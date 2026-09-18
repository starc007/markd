use std::ffi::OsStr;
use std::path::{Component, Path, PathBuf};

use agent_client_protocol::{
    schema::{
        v1::{
            ClientCapabilities, FileSystemCapabilities, Implementation, InitializeRequest,
            ReadTextFileRequest, ReadTextFileResponse, WriteTextFileRequest, WriteTextFileResponse,
        },
        ProtocolVersion,
    },
    AcpAgent, Client,
};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult};

/// ACP providers supported by Markd. The adapters are deliberately explicit so
/// we can replace the npx launchers with bundled sidecars for packaged builds.
#[derive(Clone, Copy, Debug, Deserialize, Eq, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum AgentProvider {
    Claude,
    Codex,
}

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentProviderInfo {
    pub id: AgentProvider,
    pub name: &'static str,
    pub adapter: &'static str,
    pub auth: &'static str,
    pub can_write: bool,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AgentPromptResult {
    pub provider: AgentProvider,
    pub text: String,
}

pub fn providers() -> Vec<AgentProviderInfo> {
    vec![
        AgentProviderInfo {
            id: AgentProvider::Claude,
            name: "Claude",
            adapter: "@zed-industries/claude-code-acp",
            auth: "Claude Code subscription login",
            can_write: true,
        },
        AgentProviderInfo {
            id: AgentProvider::Codex,
            name: "Codex",
            adapter: "@zed-industries/codex-acp",
            auth: "ChatGPT login, CODEX_API_KEY, or OPENAI_API_KEY",
            can_write: true,
        },
    ]
}

fn normalize_prompt(prompt: String) -> AppResult<String> {
    let prompt = prompt.trim().to_string();
    if prompt.is_empty() {
        return Err(AppError::InvalidInput("prompt cannot be empty".to_string()));
    }
    Ok(prompt)
}

fn launch_agent(provider: AgentProvider) -> AppResult<AcpAgent> {
    // Claude Code switches to API billing whenever this variable is present.
    // Do not launch it from Markd with an inherited key by accident.
    if provider == AgentProvider::Claude && std::env::var_os("ANTHROPIC_API_KEY").is_some() {
        return Err(AppError::InvalidInput(
            "unset ANTHROPIC_API_KEY to use Claude Code subscription auth".to_string(),
        ));
    }

    let args = match provider {
        AgentProvider::Claude => ["npx", "-y", "@zed-industries/claude-code-acp"],
        AgentProvider::Codex => ["npx", "-y", "@zed-industries/codex-acp"],
    };

    AcpAgent::from_args(args)
        .map_err(|error| AppError::Other(format!("could not configure agent: {error}")))
}

fn resolve_agent_file(
    root: &Path,
    requested: &Path,
    allow_missing: bool,
) -> std::io::Result<PathBuf> {
    if !requested.is_absolute() {
        return Err(std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "ACP file paths must be absolute",
        ));
    }

    let root = root.canonicalize()?;
    let parent = requested.parent().ok_or_else(|| {
        std::io::Error::new(std::io::ErrorKind::InvalidInput, "file path has no parent")
    })?;
    let parent = parent.canonicalize()?;
    let parent_rel = parent.strip_prefix(&root).map_err(|_| {
        std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "agent may only access files inside the open vault",
        )
    })?;
    if parent_rel
        .components()
        .any(|component| component == Component::Normal(OsStr::new(crate::vault::DATA_DIR)))
    {
        return Err(std::io::Error::new(
            std::io::ErrorKind::PermissionDenied,
            "agent may not access Markd's app data",
        ));
    }

    let file_name = requested.file_name().ok_or_else(|| {
        std::io::Error::new(
            std::io::ErrorKind::InvalidInput,
            "file path has no file name",
        )
    })?;
    let path = parent.join(file_name);
    if path.exists() {
        let path = path.canonicalize()?;
        if !path.starts_with(&root) || !path.is_file() {
            return Err(std::io::Error::new(
                std::io::ErrorKind::PermissionDenied,
                "agent may only access files inside the open vault",
            ));
        }
        return Ok(path);
    }
    if allow_missing {
        Ok(path)
    } else {
        Err(std::io::Error::new(
            std::io::ErrorKind::NotFound,
            "file does not exist",
        ))
    }
}

fn read_text_file(root: &Path, request: &ReadTextFileRequest) -> std::io::Result<String> {
    let path = resolve_agent_file(root, &request.path, false)?;

    let content = std::fs::read_to_string(path)?;
    let Some(line) = request.line else {
        return Ok(content);
    };

    let start = line.saturating_sub(1) as usize;
    let lines = content.lines().skip(start);
    let selected = match request.limit {
        Some(limit) => lines.take(limit as usize).collect::<Vec<_>>(),
        None => lines.collect::<Vec<_>>(),
    };
    Ok(selected.join("\n"))
}

fn write_text_file(root: &Path, request: &WriteTextFileRequest) -> std::io::Result<()> {
    let path = resolve_agent_file(root, &request.path, true)?;
    std::fs::write(path, &request.content)
}

pub async fn prompt(
    provider: AgentProvider,
    root: PathBuf,
    prompt: String,
) -> AppResult<AgentPromptResult> {
    let prompt = normalize_prompt(prompt)?;
    if !root.is_dir() {
        return Err(AppError::VaultMissing(root.display().to_string()));
    }

    let agent = launch_agent(provider)?;
    let callback_root = root.clone();
    let write_root = root.clone();
    let result = Client::default()
        .builder()
        .name("Markd")
        .on_receive_request(
            async move |request: ReadTextFileRequest, responder, _cx| {
                match read_text_file(&callback_root, &request) {
                    Ok(content) => responder.respond(ReadTextFileResponse::new(content))?,
                    Err(_) => responder
                        .respond_with_error(agent_client_protocol::Error::invalid_params())?,
                }
                Ok(())
            },
            agent_client_protocol::on_receive_request!(),
        )
        .on_receive_request(
            async move |request: WriteTextFileRequest, responder, _cx| {
                match write_text_file(&write_root, &request) {
                    Ok(()) => responder.respond(WriteTextFileResponse::new())?,
                    Err(_) => responder
                        .respond_with_error(agent_client_protocol::Error::invalid_params())?,
                }
                Ok(())
            },
            agent_client_protocol::on_receive_request!(),
        )
        .connect_with(agent, async move |cx| {
            cx.send_request(
                InitializeRequest::new(ProtocolVersion::V1)
                    .client_capabilities(
                        ClientCapabilities::new().fs(FileSystemCapabilities::new()
                            .read_text_file(true)
                            .write_text_file(true)),
                    )
                    .client_info(Implementation::new("Markd", env!("CARGO_PKG_VERSION"))),
            )
            .block_task()
            .await?;

            cx.build_session(&root)
                .block_task()
                .run_until(async move |mut session| {
                    session.send_prompt(prompt)?;
                    session.read_to_string().await
                })
                .await
        })
        .await
        .map_err(|error| AppError::Other(format!("agent request failed: {error}")))?;

    Ok(AgentPromptResult {
        provider,
        text: result,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exposes_both_supported_providers() {
        let ids = providers()
            .into_iter()
            .map(|provider| provider.id)
            .collect::<Vec<_>>();
        assert_eq!(ids, vec![AgentProvider::Claude, AgentProvider::Codex]);
    }

    #[test]
    fn rejects_empty_prompts_before_starting_process() {
        let result = normalize_prompt("  ".into());
        assert!(
            matches!(result, Err(AppError::InvalidInput(message)) if message.contains("empty"))
        );
    }

    #[test]
    fn writes_inside_vault_but_not_markd_data() {
        let vault = tempfile::tempdir().unwrap();
        std::fs::create_dir(vault.path().join(crate::vault::DATA_DIR)).unwrap();
        let note = WriteTextFileRequest::new("session", vault.path().join("note.md"), "updated");

        write_text_file(vault.path(), &note).unwrap();
        assert_eq!(
            std::fs::read_to_string(vault.path().join("note.md")).unwrap(),
            "updated"
        );

        let app_data = WriteTextFileRequest::new(
            "session",
            vault.path().join(crate::vault::DATA_DIR).join("state.json"),
            "blocked",
        );
        assert!(write_text_file(vault.path(), &app_data).is_err());
    }
}
