use std::fs;
use std::path::Path;

use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::{AppError, AppResult};
use crate::util::now_ms;
use crate::vault::DATA_DIR;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Todo {
    pub id: String,
    pub text: String,
    pub done: bool,
    pub created_at: i64,
    #[serde(default)]
    pub completed_at: Option<i64>,
}

fn store_path(root: &Path) -> std::path::PathBuf {
    root.join(DATA_DIR).join("todos.json")
}

pub fn list(root: &Path) -> AppResult<Vec<Todo>> {
    let path = store_path(root);
    if !path.exists() {
        return Ok(Vec::new());
    }
    Ok(serde_json::from_str(&fs::read_to_string(path)?)?)
}

fn save(root: &Path, todos: &[Todo]) -> AppResult<()> {
    fs::write(store_path(root), serde_json::to_string_pretty(todos)?)?;
    Ok(())
}

pub fn add(root: &Path, text: &str) -> AppResult<Todo> {
    let text = text.trim();
    if text.is_empty() {
        return Err(AppError::InvalidInput("todo text is empty".to_string()));
    }
    let todo = Todo {
        id: Uuid::new_v4().to_string(),
        text: text.to_string(),
        done: false,
        created_at: now_ms(),
        completed_at: None,
    };
    let mut todos = list(root)?;
    todos.insert(0, todo.clone());
    save(root, &todos)?;
    Ok(todo)
}

pub fn toggle(root: &Path, id: &str) -> AppResult<Todo> {
    let mut todos = list(root)?;
    let todo = todos
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(id.to_string()))?;
    todo.done = !todo.done;
    todo.completed_at = todo.done.then(now_ms);
    let updated = todo.clone();
    save(root, &todos)?;
    Ok(updated)
}

pub fn update_text(root: &Path, id: &str, text: &str) -> AppResult<Todo> {
    let text = text.trim();
    if text.is_empty() {
        return Err(AppError::InvalidInput("todo text is empty".to_string()));
    }
    let mut todos = list(root)?;
    let todo = todos
        .iter_mut()
        .find(|t| t.id == id)
        .ok_or_else(|| AppError::NotFound(id.to_string()))?;
    todo.text = text.to_string();
    let updated = todo.clone();
    save(root, &todos)?;
    Ok(updated)
}

pub fn delete(root: &Path, id: &str) -> AppResult<()> {
    let mut todos = list(root)?;
    let before = todos.len();
    todos.retain(|t| t.id != id);
    if todos.len() == before {
        return Err(AppError::NotFound(id.to_string()));
    }
    save(root, &todos)
}

pub fn clear_completed(root: &Path) -> AppResult<Vec<Todo>> {
    let mut todos = list(root)?;
    todos.retain(|t| !t.done);
    save(root, &todos)?;
    Ok(todos)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    #[test]
    fn add_toggle_clear_roundtrip() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();

        let a = add(dir.path(), "buy milk").unwrap();
        let _b = add(dir.path(), "write code").unwrap();
        assert_eq!(list(dir.path()).unwrap().len(), 2);

        let toggled = toggle(dir.path(), &a.id).unwrap();
        assert!(toggled.done);
        assert!(toggled.completed_at.is_some());

        let remaining = clear_completed(dir.path()).unwrap();
        assert_eq!(remaining.len(), 1);
        assert_eq!(remaining[0].text, "write code");
    }

    #[test]
    fn empty_text_rejected() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        assert!(add(dir.path(), "   ").is_err());
    }

    #[test]
    fn newest_first() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        add(dir.path(), "first").unwrap();
        add(dir.path(), "second").unwrap();
        assert_eq!(list(dir.path()).unwrap()[0].text, "second");
    }
}
