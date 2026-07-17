use std::path::Path;
use std::time::{Duration, SystemTime, UNIX_EPOCH};

use keyring::Entry;
use reqwest::{Client, StatusCode};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::cloud_metadata::{self, PublishedShare};
use crate::error::{AppError, AppResult};

const API_BASE: &str = "https://api.usemarkd.app";
const KEYRING_SERVICE: &str = "app.usemarkd.markd";
const KEYRING_ACCOUNT: &str = "cloud-session";

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct PublishRequest<'a> {
    entry_id: &'a str,
    title: &'a str,
    markdown: &'a str,
}

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
struct ShareEnvelope {
    share: PublishedShare,
}

#[derive(Debug, Deserialize)]
struct ErrorEnvelope {
    error: CloudError,
}

#[derive(Debug, Deserialize)]
struct CloudError {
    code: String,
    message: String,
    #[serde(default)]
    share: Option<PublishedShare>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishedNoteStatus {
    pub account: Option<CloudAccount>,
    pub share: Option<PublishedShare>,
    pub is_outdated: bool,
    pub free_share_limit: u8,
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

fn keyring_entry() -> AppResult<Entry> {
    Entry::new(KEYRING_SERVICE, KEYRING_ACCOUNT)
        .map_err(|error| AppError::Cloud(format!("could not open secure account storage: {error}")))
}

fn load_session() -> AppResult<Option<StoredSession>> {
    let entry = keyring_entry()?;
    let value = match entry.get_password() {
        Ok(value) => value,
        Err(keyring::Error::NoEntry) => return Ok(None),
        Err(error) => {
            return Err(AppError::Cloud(format!(
                "could not read the saved Markd account: {error}"
            )))
        }
    };
    let session: StoredSession = serde_json::from_str(&value)?;
    if session.expires_at <= now_millis() {
        let _ = entry.delete_credential();
        return Ok(None);
    }
    Ok(Some(session))
}

fn save_session(session: &StoredSession) -> AppResult<()> {
    keyring_entry()?
        .set_password(&serde_json::to_string(session)?)
        .map_err(|error| AppError::Cloud(format!("could not save the Markd account: {error}")))
}

fn clear_session() -> AppResult<()> {
    match keyring_entry()?.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(error) => Err(AppError::Cloud(format!(
            "could not remove the saved Markd account: {error}"
        ))),
    }
}

pub fn account_status(_app: &tauri::AppHandle) -> AppResult<CloudAccountStatus> {
    Ok(CloudAccountStatus {
        account: load_session()?.map(|session| session.account),
    })
}

fn access_token(_app: &tauri::AppHandle) -> AppResult<String> {
    load_session()?
        .map(|session| session.access_token)
        .ok_or_else(|| {
            AppError::CloudLoginRequired("Sign in to Markd before publishing a note.".to_string())
        })
}

fn client() -> AppResult<Client> {
    Client::builder()
        .timeout(Duration::from_secs(20))
        .user_agent("Markd/0.1.5")
        .build()
        .map_err(|error| AppError::Network(error.to_string()))
}

fn content_hash(content: &str) -> String {
    format!("{:x}", Sha256::digest(content.as_bytes()))
}

fn request_key() -> String {
    format!("publish_{}", Uuid::new_v4().simple())
}

async fn cloud_error(response: reqwest::Response) -> AppError {
    let status = response.status();
    let body = response.text().await.unwrap_or_default();
    let error = serde_json::from_str::<ErrorEnvelope>(&body)
        .map(|envelope| envelope.error)
        .unwrap_or(CloudError {
            code: "cloud_request_failed".to_string(),
            message: format!("Markd Cloud returned {status}"),
            share: None,
        });
    if status == StatusCode::UNAUTHORIZED {
        AppError::CloudLoginRequired(error.message)
    } else if status == StatusCode::PAYMENT_REQUIRED {
        AppError::CloudSubscriptionRequired(error.message)
    } else {
        AppError::Cloud(error.message)
    }
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

pub async fn verify_otp(challenge_id: &str, code: &str) -> AppResult<CloudAccount> {
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
    save_session(&session)?;
    Ok(session.account)
}

pub async fn sign_out(app: &tauri::AppHandle) -> AppResult<()> {
    let token = access_token(app).ok();
    clear_session()?;
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

async fn parse_response(response: reqwest::Response) -> AppResult<PublishedShare> {
    let status = response.status();
    let body = response
        .text()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    if status.is_success() {
        return serde_json::from_str::<ShareEnvelope>(&body)
            .map(|envelope| envelope.share)
            .map_err(|error| AppError::Cloud(format!("invalid publishing response: {error}")));
    }

    let error = serde_json::from_str::<ErrorEnvelope>(&body)
        .map(|envelope| envelope.error)
        .unwrap_or(CloudError {
            code: "publishing_failed".to_string(),
            message: format!("publishing service returned {status}"),
            share: None,
        });
    if status == StatusCode::CONFLICT && error.code == "already_published" {
        return error
            .share
            .ok_or_else(|| AppError::Cloud("published note metadata is missing".to_string()));
    }
    if status == StatusCode::PAYMENT_REQUIRED {
        return Err(AppError::CloudSubscriptionRequired(error.message));
    }
    if status == StatusCode::UNAUTHORIZED {
        return Err(AppError::CloudLoginRequired(error.message));
    }
    Err(AppError::Cloud(error.message))
}

pub fn status(
    _app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    content: &str,
) -> AppResult<PublishedNoteStatus> {
    let share = cloud_metadata::get(root, rel)?.and_then(|entry| entry.share);
    let is_outdated = share
        .as_ref()
        .is_some_and(|published| published.content_hash != content_hash(content));
    Ok(PublishedNoteStatus {
        account: load_session()?.map(|session| session.account),
        share,
        is_outdated,
        free_share_limit: 1,
    })
}

pub async fn publish(
    app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
) -> AppResult<PublishedShare> {
    let entry = cloud_metadata::entry(root, rel)?;
    let response = client()?
        .post(format!("{API_BASE}/v1/shares"))
        .bearer_auth(access_token(app)?)
        .header("idempotency-key", request_key())
        .json(&PublishRequest {
            entry_id: &entry.entry_id,
            title,
            markdown: content,
        })
        .send()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    let share = parse_response(response).await?;
    cloud_metadata::set_share(root, rel, share.clone())?;
    Ok(share)
}

pub async fn update(
    app: &tauri::AppHandle,
    root: &Path,
    rel: &str,
    title: &str,
    content: &str,
) -> AppResult<PublishedShare> {
    let entry =
        cloud_metadata::get(root, rel)?.ok_or_else(|| AppError::NotFound(rel.to_string()))?;
    let current = entry
        .share
        .ok_or_else(|| AppError::NotFound("published note".to_string()))?;
    let response = client()?
        .put(format!("{API_BASE}/v1/shares/{}", current.id))
        .bearer_auth(access_token(app)?)
        .header("idempotency-key", request_key())
        .json(&PublishRequest {
            entry_id: &entry.entry_id,
            title,
            markdown: content,
        })
        .send()
        .await
        .map_err(|error| AppError::Network(error.to_string()))?;
    let share = parse_response(response).await?;
    cloud_metadata::set_share(root, rel, share.clone())?;
    Ok(share)
}

pub async fn revoke(app: &tauri::AppHandle, root: &Path, rel: &str) -> AppResult<()> {
    let Some(entry) = cloud_metadata::get(root, rel)? else {
        return Ok(());
    };
    let Some(share) = entry.share else {
        return Ok(());
    };
    let response = client()?
        .delete(format!("{API_BASE}/v1/shares/{}", share.id))
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hashes_content_like_the_cloud_api() {
        assert_eq!(
            content_hash("Markd"),
            "5f760a58961babe4c488f61b3457e73fc9d9b78f5727b04ae80a8e470580eb6f"
        );
    }
}
