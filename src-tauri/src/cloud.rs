use std::fs::{self, OpenOptions};
use std::io::{ErrorKind, Write};
use std::path::{Path, PathBuf};
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use tauri::Manager;

use crate::cloud_metadata::{self, PublishedShare};
pub use crate::cloud_publish::PublishPageDraft;
use crate::error::{AppError, AppResult};

pub(crate) const API_BASE: &str = "https://api.usemarkd.app";
const SESSION_FILE: &str = "cloud-session.json";

#[derive(Debug, Serialize)]
struct OtpRequest<'a> {
    email: &'a str,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct OtpVerifyRequest<'a> {
    challenge_id: &'a str,
    code: &'a str,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OtpChallenge {
    pub challenge_id: String,
    pub email: String,
    pub expires_in: u64,
    pub resend_after: u64,
}

#[derive(Debug, Deserialize)]
struct ErrorEnvelope {
    error: CloudError,
}

#[derive(Debug, Deserialize)]
struct CloudError {
    #[allow(dead_code)]
    code: String,
    message: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishedNoteStatus {
    pub account: Option<CloudAccount>,
    pub share: Option<PublishedShare>,
    pub is_outdated: bool,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudAccount {
    pub email: String,
    pub plan: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudAccountStatus {
    pub account: Option<CloudAccount>,
}

#[derive(Clone, Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct StoredSession {
    access_token: String,
    expires_at: u64,
    account: CloudAccount,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct SessionResponse {
    access_token: String,
    expires_at: u64,
    user: CloudAccount,
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}

fn session_file(app: &tauri::AppHandle) -> AppResult<PathBuf> {
    let dir = app
        .path()
        .app_config_dir()
        .map_err(|error| AppError::Other(error.to_string()))?;
    fs::create_dir_all(&dir)?;
    Ok(dir.join(SESSION_FILE))
}

fn load_session(app: &tauri::AppHandle) -> AppResult<Option<StoredSession>> {
    let path = session_file(app)?;
    let value = match fs::read_to_string(&path) {
        Ok(value) => value,
        Err(error) if error.kind() == ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(error.into()),
    };
    let session: StoredSession = serde_json::from_str(&value)?;
    if session.expires_at <= now_millis() {
        let _ = fs::remove_file(path);
        return Ok(None);
    }
    Ok(Some(session))
}

fn save_session(app: &tauri::AppHandle, session: &StoredSession) -> AppResult<()> {
    let path = session_file(app)?;
    let mut options = OpenOptions::new();
    options.create(true).truncate(true).write(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    let mut file = options.open(&path)?;
    file.write_all(serde_json::to_string(session)?.as_bytes())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        file.set_permissions(fs::Permissions::from_mode(0o600))?;
    }
    Ok(())
}

fn clear_session(app: &tauri::AppHandle) -> AppResult<()> {
    match fs::remove_file(session_file(app)?) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == ErrorKind::NotFound => Ok(()),
        Err(error) => Err(error.into()),
    }
}

pub fn account_status(app: &tauri::AppHandle) -> AppResult<CloudAccountStatus> {
    Ok(CloudAccountStatus {
        account: load_session(app)?.map(|session| session.account),
    })
}

pub(crate) fn access_token(app: &tauri::AppHandle) -> AppResult<String> {
    load_session(app)?
        .map(|session| session.access_token)
        .ok_or_else(|| {
            AppError::CloudLoginRequired("Sign in to Markd before publishing a note.".to_string())
        })
}

pub(crate) fn client() -> AppResult<Client> {
    Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent("Markd/0.1.5")
        .build()
        .map_err(|error| AppError::Network(error.to_string()))
}

pub(crate) async fn cloud_error(response: reqwest::Response) -> AppError {
    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    let error = serde_json::from_str::<ErrorEnvelope>(&body)
        .map(|envelope| envelope.error)
        .unwrap_or(CloudError {
            code: "cloud_request_failed".to_string(),
            message: format!("Markd Cloud returned {status}"),
        });
    if status == StatusCode::UNAUTHORIZED {
        AppError::CloudLoginRequired(error.message)
    } else if status == StatusCode::PAYMENT_REQUIRED {
        AppError::CloudSubscriptionRequired(error.message)
    } else {
        AppError::Cloud(error.message)
    }
}

pub(crate) fn stored_account(app: &tauri::AppHandle) -> AppResult<Option<CloudAccount>> {
    Ok(load_session(app)?.map(|session| session.account))
}

pub async fn request_otp(email: &str) -> AppResult<OtpChallenge> {
    let response = client()?
        .post(format!("{API_BASE}/v1/auth/otp/request"))
        .json(&OtpRequest { email })
        .send()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    if !response.status().is_success() {
        return Err(cloud_error(response).await);
    }
    response
        .json::<OtpChallenge>()
        .await
        .map_err(|error| AppError::Cloud(format!("invalid OTP response: {error}")))
}

pub async fn verify_otp(
    app: &tauri::AppHandle,
    challenge_id: &str,
    code: &str,
) -> AppResult<CloudAccount> {
    let response = client()?
        .post(format!("{API_BASE}/v1/auth/otp/verify"))
        .json(&OtpVerifyRequest { challenge_id, code })
        .send()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    if !response.status().is_success() {
        return Err(cloud_error(response).await);
    }
    let response = response
        .json::<SessionResponse>()
        .await
        .map_err(|error| AppError::Cloud(format!("invalid session response: {error}")))?;
    let session = StoredSession {
        access_token: response.access_token,
        expires_at: response.expires_at,
        account: response.user,
    };
    save_session(app, &session)?;
    Ok(session.account)
}

pub async fn sign_out(app: &tauri::AppHandle) -> AppResult<()> {
    let token = access_token(app).ok();
    clear_session(app)?;
    if let Some(token) = token {
        tauri::async_runtime::spawn(async move {
            let Ok(client) = client() else {
                return;
            };
            let _ = client
                .delete(format!("{API_BASE}/v1/session"))
                .bearer_auth(token)
                .send()
                .await;
        });
    }
    Ok(())
}

pub fn status(
    app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedNoteStatus> {
    crate::cloud_publish::status(app, root, rel, title, content, pages)
}

pub async fn publish(
    app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedShare> {
    crate::cloud_publish::publish(app, root, rel, title, content, pages).await
}

pub async fn update(
    app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedShare> {
    crate::cloud_publish::update(app, root, rel, title, content, pages).await
}

pub async fn revoke(app: &tauri::AppHandle, root: &Path, rel: &str) -> AppResult<()> {
    let Some(entry) = cloud_metadata::get(root, rel)? else {
        return Ok(());
    };
    let Some(share) = entry.share else {
        return Ok(());
    };
    let response = client()?
        .delete(format!("{API_BASE}/v1/sites/{}", share.id))
        .bearer_auth(access_token(app)?)
        .send()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        let message = serde_json::from_str::<ErrorEnvelope>(&body)
            .map(|envelope| envelope.error.message)
            .unwrap_or_else(|_| format!("publishing service returned {status}"));
        return Err(AppError::Cloud(message));
    }
    cloud_metadata::clear_share(root, rel)
}
