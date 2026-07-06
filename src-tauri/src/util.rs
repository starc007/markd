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

#[cfg(test)]
mod tests {
    use super::*;

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
