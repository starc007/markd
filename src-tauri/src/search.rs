use std::fs;
use std::path::Path;

use serde::Serialize;

use crate::error::AppResult;
use crate::vault::{is_reserved_note_path, notes_root, rel_of};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchHit {
    pub rel: String,
    pub title: String,
    pub snippet: String,
    /// True when the query matched the title (ranked above content hits).
    pub title_match: bool,
}

const SNIPPET_RADIUS: usize = 60;

/// Case-insensitive substring search across note titles and contents.
pub fn search_notes(root: &Path, query: &str, limit: usize) -> AppResult<Vec<SearchHit>> {
    let needle = query.trim().to_lowercase();
    if needle.is_empty() {
        return Ok(Vec::new());
    }
    let mut title_hits = Vec::new();
    let mut content_hits = Vec::new();
    walk(root, &notes_root(root), &needle, &mut title_hits, &mut content_hits)?;
    title_hits.append(&mut content_hits);
    title_hits.truncate(limit);
    Ok(title_hits)
}

fn walk(
    root: &Path,
    dir: &Path,
    needle: &str,
    title_hits: &mut Vec<SearchHit>,
    content_hits: &mut Vec<SearchHit>,
) -> AppResult<()> {
    let Ok(entries) = fs::read_dir(dir) else {
        return Ok(());
    };
    for entry in entries.flatten() {
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name.starts_with('.') || is_reserved_note_path(root, &path) {
            continue;
        }
        if path.is_dir() {
            walk(root, &path, needle, title_hits, content_hits)?;
            continue;
        }
        if path.extension().is_none_or(|e| e != "md") {
            continue;
        }
        let title = path
            .file_stem()
            .map(|s| s.to_string_lossy().to_string())
            .unwrap_or_default();
        let rel = rel_of(root, &path)?;
        let content = fs::read_to_string(&path).unwrap_or_default();

        if title.to_lowercase().contains(needle) {
            title_hits.push(SearchHit {
                rel,
                title,
                snippet: snippet(&content, needle),
                title_match: true,
            });
        } else if let Some(pos) = content.to_lowercase().find(needle) {
            content_hits.push(SearchHit {
                rel,
                title,
                snippet: snippet_at(&content, pos, needle.len()),
                title_match: false,
            });
        }
    }
    Ok(())
}

fn snippet(content: &str, needle: &str) -> String {
    match content.to_lowercase().find(needle) {
        Some(pos) => snippet_at(content, pos, needle.len()),
        None => content.chars().take(SNIPPET_RADIUS * 2).collect(),
    }
}

fn snippet_at(content: &str, byte_pos: usize, match_len: usize) -> String {
    let chars: Vec<char> = content.chars().collect();
    // Convert byte position to char position.
    let char_pos = content[..byte_pos].chars().count();
    let start = char_pos.saturating_sub(SNIPPET_RADIUS);
    let end = (char_pos + match_len + SNIPPET_RADIUS).min(chars.len());
    let mut out: String = chars[start..end].iter().collect();
    out = out.replace('\n', " ").trim().to_string();
    if start > 0 {
        out = format!("…{out}");
    }
    if end < chars.len() {
        out = format!("{out}…");
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::notes::{create_note, write_note};
    use crate::vault::ensure_layout;
    use tempfile::tempdir;

    #[test]
    fn title_hits_rank_first() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let a = create_note(dir.path(), "", "apple pie").unwrap();
        write_note(dir.path(), &a, "crust and filling").unwrap();
        let b = create_note(dir.path(), "", "groceries").unwrap();
        write_note(dir.path(), &b, "buy apple and milk").unwrap();

        let hits = search_notes(dir.path(), "apple", 10).unwrap();
        assert_eq!(hits.len(), 2);
        assert!(hits[0].title_match);
        assert_eq!(hits[0].title, "apple pie");
        assert!(hits[1].snippet.contains("apple"));
    }

    #[test]
    fn empty_query_returns_nothing() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        assert!(search_notes(dir.path(), "  ", 10).unwrap().is_empty());
    }

    #[test]
    fn ignores_generated_root_guides() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        fs::write(dir.path().join("AGENTS.md"), "private marker phrase").unwrap();

        assert!(search_notes(dir.path(), "private marker phrase", 10)
            .unwrap()
            .is_empty());
    }

    #[test]
    fn unicode_snippet_no_panic() {
        let dir = tempdir().unwrap();
        ensure_layout(dir.path()).unwrap();
        let a = create_note(dir.path(), "", "emoji").unwrap();
        write_note(dir.path(), &a, "🎉🎉🎉 find ünïcode here 🎉🎉🎉").unwrap();
        let hits = search_notes(dir.path(), "ünïcode", 10).unwrap();
        assert_eq!(hits.len(), 1);
    }
}
