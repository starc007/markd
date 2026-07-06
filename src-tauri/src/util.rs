use std::time::{SystemTime, UNIX_EPOCH};

/// Current unix time in milliseconds.
pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

/// Strip characters that are unsafe in file names, collapse whitespace.
pub fn sanitize_name(value: &str) -> String {
    let cleaned: String = value
        .chars()
        .map(|c| match c {
            '/' | '\\' | ':' | '*' | '?' | '"' | '<' | '>' | '|' => ' ',
            c if c.is_control() => ' ',
            c => c,
        })
        .collect();
    let collapsed = cleaned.split_whitespace().collect::<Vec<_>>().join(" ");
    let trimmed = collapsed.trim_matches('.').trim().to_string();
    if trimmed.is_empty() {
        "Untitled".to_string()
    } else {
        trimmed
    }
}

/// Clean a set of tags: trim, drop a leading '#', lowercase, dedupe, drop
/// empties, and cap length. Order is preserved by first appearance.
pub fn normalize_tags(tags: Vec<String>) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    let mut out = Vec::new();
    for tag in tags {
        let cleaned = tag
            .trim()
            .trim_start_matches('#')
            .trim()
            .to_lowercase();
        if cleaned.is_empty() || cleaned.len() > 32 {
            continue;
        }
        if seen.insert(cleaned.clone()) {
            out.push(cleaned);
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_tags_cleans_and_dedupes() {
        let out = normalize_tags(vec![
            "#Work".into(),
            "work".into(),
            "  home ".into(),
            "".into(),
        ]);
        assert_eq!(out, vec!["work", "home"]);
    }

    #[test]
    fn sanitize_removes_separators() {
        assert_eq!(sanitize_name("a/b\\c:d"), "a b c d");
    }

    #[test]
    fn sanitize_empty_falls_back() {
        assert_eq!(sanitize_name("   "), "Untitled");
        assert_eq!(sanitize_name("..."), "Untitled");
    }

    #[test]
    fn sanitize_collapses_whitespace() {
        assert_eq!(sanitize_name("  hello   world  "), "hello world");
    }
}
