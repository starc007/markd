use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("no vault is open")]
    NoVault,
    #[error("vault folder is missing or unreadable: {0}")]
    VaultMissing(String),
    #[error("not found: {0}")]
    NotFound(String),
    #[error("invalid path: {0}")]
    InvalidPath(String),
    #[error("invalid input: {0}")]
    InvalidInput(String),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("network error: {0}")]
    Network(String),
    #[error("{0}")]
    Other(String),
}

pub type AppResult<T> = Result<T, AppError>;

#[derive(Serialize)]
struct ErrorPayload<'a> {
    kind: &'a str,
    message: String,
}

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let kind = match self {
            AppError::NoVault => "no_vault",
            AppError::VaultMissing(_) => "vault_missing",
            AppError::NotFound(_) => "not_found",
            AppError::InvalidPath(_) => "invalid_path",
            AppError::InvalidInput(_) => "invalid_input",
            AppError::Io(_) => "io",
            AppError::Network(_) => "network",
            AppError::Other(_) => "other",
        };
        ErrorPayload {
            kind,
            message: self.to_string(),
        }
        .serialize(serializer)
    }
}

impl From<serde_json::Error> for AppError {
    fn from(err: serde_json::Error) -> Self {
        AppError::Other(format!("json: {err}"))
    }
}
