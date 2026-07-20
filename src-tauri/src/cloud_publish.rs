use std::collections::BTreeMap;
use std::fs;
use std::path::Path;
use std::time::Duration;

#[cfg(test)]
use base64::engine::general_purpose::STANDARD;
#[cfg(test)]
use base64::Engine;
use futures_util::stream::{self, StreamExt, TryStreamExt};
use regex::Regex;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use tauri::AppHandle;

use crate::cloud::{self, PublishedNoteStatus, API_BASE};
use crate::cloud_metadata::{self, PublishedShare};
use crate::error::{AppError, AppResult};
use crate::vault::ASSETS_DIR;

const PAGE_CONTENT_TYPE: &str = "text/markdown; charset=utf-8";
const UPLOAD_CONCURRENCY: usize = 6;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishPageDraft {
    pub rel: String,
    pub path: String,
    pub title: String,
    pub markdown: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct BeginPublishRequest {
    #[serde(skip_serializing_if = "Option::is_none")]
    site_id: Option<String>,
    entry_id: String,
    title: String,
    manifest: PublishManifest,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublishManifest {
    version: u8,
    root_entry_id: String,
    pages: Vec<PublishPage>,
    objects: Vec<PublishObject>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublishPage {
    entry_id: String,
    path: String,
    title: String,
    object_hash: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublishObject {
    hash: String,
    kind: &'static str,
    content_type: String,
    size: usize,
}

struct PreparedRelease {
    manifest: PublishManifest,
    objects: BTreeMap<String, Vec<u8>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct BeginPublishResponse {
    session_id: String,
    uploads: Vec<PendingUpload>,
}

#[derive(Debug, Deserialize)]
struct PendingUpload {
    hash: String,
    url: String,
    headers: BTreeMap<String, String>,
}

#[derive(Debug, Deserialize)]
struct SiteEnvelope {
    site: PublishedShare,
}

pub async fn status(
    app: &AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedNoteStatus> {
    let mut share = cloud_metadata::get(root, rel)?.and_then(|entry| entry.share);
    if share
        .as_ref()
        .is_some_and(|published| !published.id.starts_with("site_"))
    {
        cloud_metadata::clear_share(root, rel)?;
        share = None;
    }
    let release_title = share
        .as_ref()
        .map(|published| published.title.as_str())
        .unwrap_or(title);
    let local_hash = prepare_release(root, rel, release_title, content, pages)?.manifest_hash()?;
    Ok(PublishedNoteStatus {
        account: cloud::refreshed_account(app).await?,
        is_outdated: share
            .as_ref()
            .is_some_and(|published| published.content_hash != local_hash),
        share,
    })
}

pub async fn publish(
    app: &AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedShare> {
    let entry = cloud_metadata::entry(root, rel)?;
    publish_release(app, root, rel, entry.entry_id, None, title, content, pages).await
}

pub async fn update(
    app: &AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedShare> {
    let entry =
        cloud_metadata::get(root, rel)?.ok_or_else(|| AppError::NotFound(rel.to_string()))?;
    let site = entry
        .share
        .ok_or_else(|| AppError::NotFound("published site".to_string()))?;
    publish_release(
        app,
        root,
        rel,
        entry.entry_id,
        Some(site.id),
        title,
        content,
        pages,
    )
    .await
}

async fn publish_release(
    app: &AppHandle,
    root: &Path,
    rel: &str,
    entry_id: String,
    site_id: Option<String>,
    title: &str,
    content: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PublishedShare> {
    let prepared = prepare_release(root, rel, title, content, pages)?;
    let expected_hash = prepared.manifest_hash()?;
    let response = cloud::client()?
        .post(format!("{API_BASE}/v1/publish-sessions"))
        .bearer_auth(cloud::access_token(app)?)
        .json(&BeginPublishRequest {
            site_id,
            entry_id,
            title: title.to_string(),
            manifest: prepared.manifest.clone(),
        })
        .send()
        .await
        .map_err(network_error)?;
    if !response.status().is_success() {
        return Err(cloud::cloud_error(response).await);
    }
    let session = response
        .json::<BeginPublishResponse>()
        .await
        .map_err(|error| AppError::Cloud(format!("invalid publish session: {error}")))?;
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5 * 60))
        .user_agent("Markd/0.1.6")
        .build()
        .map_err(network_error)?;
    stream::iter(session.uploads)
        .map(|upload| {
            let bytes = prepared.objects.get(&upload.hash).cloned();
            let client = client.clone();
            async move {
                let bytes =
                    bytes.ok_or_else(|| AppError::Cloud("upload object is missing".to_string()))?;
                let mut request = client.put(upload.url).body(bytes);
                for (name, value) in upload.headers {
                    request = request.header(name, value);
                }
                let response = request.send().await.map_err(network_error)?;
                if !response.status().is_success() {
                    return Err(AppError::Cloud(format!(
                        "asset upload failed with {}",
                        response.status()
                    )));
                }
                Ok(())
            }
        })
        .buffer_unordered(UPLOAD_CONCURRENCY)
        .try_collect::<Vec<()>>()
        .await?;

    let response = cloud::client()?
        .post(format!(
            "{API_BASE}/v1/publish-sessions/{}/finalize",
            session.session_id
        ))
        .bearer_auth(cloud::access_token(app)?)
        .send()
        .await
        .map_err(network_error)?;
    if !response.status().is_success() {
        return Err(cloud::cloud_error(response).await);
    }
    let mut site = response
        .json::<SiteEnvelope>()
        .await
        .map_err(|error| AppError::Cloud(format!("invalid publishing response: {error}")))?
        .site;
    site.content_hash = expected_hash;
    cloud_metadata::set_share(root, rel, site.clone())?;
    Ok(site)
}

fn prepare_release(
    root: &Path,
    root_rel: &str,
    root_title: &str,
    root_markdown: &str,
    pages: Vec<PublishPageDraft>,
) -> AppResult<PreparedRelease> {
    let mut objects = BTreeMap::<String, Vec<u8>>::new();
    let mut descriptors = BTreeMap::<String, PublishObject>::new();
    let mut published_pages = Vec::with_capacity(pages.len() + 1);
    let mut drafts = Vec::with_capacity(pages.len() + 1);
    drafts.push(PublishPageDraft {
        rel: root_rel.to_string(),
        path: String::new(),
        title: root_title.to_string(),
        markdown: root_markdown.to_string(),
    });
    drafts.extend(pages);

    for draft in drafts {
        let entry = cloud_metadata::entry(root, &draft.rel)?;
        let markdown = rewrite_assets(root, &draft.markdown, &mut objects, &mut descriptors)?;
        let bytes = markdown.into_bytes();
        let hash = hash_bytes(&bytes);
        descriptors
            .entry(hash.clone())
            .or_insert_with(|| PublishObject {
                hash: hash.clone(),
                kind: "page",
                content_type: PAGE_CONTENT_TYPE.to_string(),
                size: bytes.len(),
            });
        objects.entry(hash.clone()).or_insert(bytes);
        published_pages.push(PublishPage {
            entry_id: entry.entry_id,
            path: draft.path,
            title: draft.title,
            object_hash: hash,
        });
    }
    let root_entry_id = published_pages
        .first()
        .map(|page| page.entry_id.clone())
        .ok_or_else(|| AppError::InvalidInput("published site has no root page".to_string()))?;
    Ok(PreparedRelease {
        manifest: PublishManifest {
            version: 1,
            root_entry_id,
            pages: published_pages,
            objects: descriptors.into_values().collect(),
        },
        objects,
    })
}

fn rewrite_assets(
    root: &Path,
    markdown: &str,
    objects: &mut BTreeMap<String, Vec<u8>>,
    descriptors: &mut BTreeMap<String, PublishObject>,
) -> AppResult<String> {
    let image = Regex::new(r#"!\[[^\]]*\]\(\s*(?P<href><[^>]+>|[^)\s]+)"#)
        .map_err(|error| AppError::Other(error.to_string()))?;
    let mut replacements = Vec::new();
    for captures in image.captures_iter(markdown) {
        let Some(found) = captures.name("href") else {
            continue;
        };
        let href = found.as_str().trim_matches(['<', '>']);
        if is_remote(href) || href.starts_with("markd-asset:") {
            continue;
        }
        let normalized = href.trim_start_matches('/');
        if !normalized.starts_with(&format!("{ASSETS_DIR}/")) {
            return Err(AppError::InvalidInput(format!(
                "image must be stored in {ASSETS_DIR}: {href}"
            )));
        }
        let asset_root = fs::canonicalize(root.join(ASSETS_DIR))?;
        let path = fs::canonicalize(root.join(normalized))?;
        if !path.starts_with(&asset_root) || !path.is_file() {
            return Err(AppError::InvalidInput(
                "image path leaves the vault asset folder".to_string(),
            ));
        }
        let bytes = fs::read(&path)?;
        let content_type = image_content_type(&bytes)?;
        let hash = hash_bytes(&bytes);
        descriptors
            .entry(hash.clone())
            .or_insert_with(|| PublishObject {
                hash: hash.clone(),
                kind: "asset",
                content_type,
                size: bytes.len(),
            });
        objects.entry(hash.clone()).or_insert(bytes);
        replacements.push((found.start(), found.end(), format!("markd-asset:{hash}")));
    }
    let mut rewritten = markdown.to_string();
    for (start, end, value) in replacements.into_iter().rev() {
        rewritten.replace_range(start..end, &value);
    }
    Ok(rewritten)
}

fn image_content_type(bytes: &[u8]) -> AppResult<String> {
    let mime = infer::get(bytes).map(|kind| kind.mime_type()).unwrap_or("");
    match mime {
        "image/png" | "image/jpeg" | "image/gif" | "image/webp" | "image/avif" => {
            Ok(mime.to_string())
        }
        "image/svg+xml" => Err(AppError::InvalidInput(
            "SVG images must be converted before publishing".to_string(),
        )),
        _ => Err(AppError::InvalidInput(
            "unsupported or invalid published image".to_string(),
        )),
    }
}

fn is_remote(href: &str) -> bool {
    href.starts_with('#')
        || href.starts_with("//")
        || href.contains("://")
        || href.starts_with("data:")
}

fn hash_bytes(bytes: &[u8]) -> String {
    format!("{:x}", Sha256::digest(bytes))
}

#[cfg(test)]
fn checksum_base64(bytes: &[u8]) -> String {
    STANDARD.encode(Sha256::digest(bytes))
}

fn network_error(error: reqwest::Error) -> AppError {
    AppError::Network(error.to_string())
}

impl PreparedRelease {
    fn manifest_hash(&self) -> AppResult<String> {
        Ok(hash_bytes(
            serde_json::to_string(&self.manifest)?.as_bytes(),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::{ensure_layout, notes_root};
    use tempfile::tempdir;

    #[test]
    fn rewrites_and_deduplicates_local_images() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        fs::write(notes_root(dir.path()).join("Home.md"), "# Home").unwrap();
        let asset = dir.path().join(ASSETS_DIR).join("pixel.png");
        fs::write(&asset, b"\x89PNG\r\n\x1a\nrest").unwrap();
        let mut objects = BTreeMap::new();
        let mut descriptors = BTreeMap::new();
        let markdown = rewrite_assets(
            dir.path(),
            "![one](.markd/assets/pixel.png) ![two](.markd/assets/pixel.png)",
            &mut objects,
            &mut descriptors,
        )
        .unwrap();
        assert_eq!(objects.len(), 1);
        assert_eq!(descriptors.len(), 1);
        assert_eq!(markdown.matches("markd-asset:").count(), 2);
    }

    #[test]
    fn checksum_header_matches_content_hash() {
        let bytes = b"Markd";
        assert_eq!(
            STANDARD.decode(checksum_base64(bytes)).unwrap(),
            Sha256::digest(bytes).as_slice()
        );
    }

    #[test]
    fn release_hash_tracks_linked_page_changes() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        fs::write(notes_root(dir.path()).join("Home.md"), "# Home").unwrap();
        fs::write(notes_root(dir.path()).join("Roadmap.md"), "# Roadmap").unwrap();
        let page = |markdown: &str| PublishPageDraft {
            rel: "Roadmap.md".into(),
            path: "roadmap".into(),
            title: "Roadmap".into(),
            markdown: markdown.into(),
        };
        let first = prepare_release(
            dir.path(),
            "Home.md",
            "Home",
            "# Home",
            vec![page("# Roadmap")],
        )
        .unwrap()
        .manifest_hash()
        .unwrap();
        let second = prepare_release(
            dir.path(),
            "Home.md",
            "Home",
            "# Home",
            vec![page("# Roadmap\n\nUpdated")],
        )
        .unwrap()
        .manifest_hash()
        .unwrap();
        assert_ne!(first, second);
    }
}
