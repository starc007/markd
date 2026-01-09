use serde_json::Value;

/// Validate TipTap JSON structure
pub fn validate_tiptap_json(json_str: &str) -> Result<(), String> {
    // Parse JSON
    let parsed: Value = serde_json::from_str(json_str)
        .map_err(|e| format!("Invalid JSON: {}", e))?;

    // Check root type
    if let Some(node_type) = parsed.get("type").and_then(|t| t.as_str()) {
        if node_type != "doc" {
            return Err(format!("Root node must be 'doc', got '{}'", node_type));
        }
    } else {
        return Err("Missing 'type' field in root node".to_string());
    }

    // Validate content array exists
    if !parsed.get("content").is_some() {
        return Err("Missing 'content' field in root node".to_string());
    }

    // Recursively validate structure
    validate_node(&parsed)?;

    Ok(())
}

fn validate_node(node: &Value) -> Result<(), String> {
    // Check if it's an object
    if !node.is_object() {
        return Err("Node must be an object".to_string());
    }

    // Validate type field exists
    if node.get("type").is_none() {
        return Err("Node missing 'type' field".to_string());
    }

    // Validate content if present
    if let Some(content) = node.get("content") {
        if !content.is_array() {
            return Err("'content' must be an array".to_string());
        }

        // Recursively validate children
        if let Some(content_array) = content.as_array() {
            for child in content_array {
                validate_node(child)?;
            }
        }
    }

    Ok(())
}

/// Sanitize search query for FTS5
/// Removes potentially dangerous characters and normalizes the query
pub fn sanitize_search_query(query: &str) -> String {
    // First, remove HTML-like tags and script content
    let mut sanitized = String::new();
    let mut in_tag = false;
    
    for ch in query.chars() {
        if ch == '<' {
            in_tag = true;
            continue;
        }
        if ch == '>' {
            in_tag = false;
            continue;
        }
        if in_tag {
            continue;
        }
        
        match ch {
            // Allow alphanumeric, spaces, and common punctuation
            c if c.is_alphanumeric() => sanitized.push(c),
            c if c.is_whitespace() => sanitized.push(' '),
            '-' | '_' | '.' | '@' | '#' => sanitized.push(ch),
            // Escape FTS5 special characters
            '"' => sanitized.push_str("\"\""),
            '\'' => sanitized.push('\''),
            // Skip other special characters
            _ => continue,
        }
    }

    // Normalize whitespace
    sanitized = sanitized
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");

    // Limit length to prevent DoS
    if sanitized.len() > 500 {
        sanitized.truncate(500);
    }

    sanitized
}

/// Create a safe FTS5 query string from user input
pub fn create_fts5_query(query: &str) -> String {
    let sanitized = sanitize_search_query(query);
    
    if sanitized.is_empty() {
        return String::new();
    }

    // For FTS5, we can use phrase search or simple term matching
    // Wrap in quotes for phrase search, or use term matching
    let terms: Vec<&str> = sanitized.split_whitespace().collect();
    
    if terms.len() == 1 {
        // Single term - use prefix matching
        format!("{}*", terms[0])
    } else {
        // Multiple terms - use AND logic
        terms
            .iter()
            .map(|t| format!("{}*", t))
            .collect::<Vec<_>>()
            .join(" AND ")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_valid_tiptap_json() {
        let json = r#"{"type":"doc","content":[{"type":"paragraph"}]}"#;
        assert!(validate_tiptap_json(json).is_ok());
    }

    #[test]
    fn test_validate_invalid_json() {
        let json = "not json";
        assert!(validate_tiptap_json(json).is_err());
    }

    #[test]
    fn test_validate_missing_type() {
        let json = r#"{"content":[]}"#;
        assert!(validate_tiptap_json(json).is_err());
    }

    #[test]
    fn test_sanitize_search_query() {
        assert_eq!(sanitize_search_query("hello world"), "hello world");
        assert_eq!(sanitize_search_query("hello\"world"), "hello\"\"world");
        assert_eq!(sanitize_search_query("hello<script>"), "hello");
    }

    #[test]
    fn test_create_fts5_query() {
        assert_eq!(create_fts5_query("hello"), "hello*");
        assert_eq!(create_fts5_query("hello world"), "hello* AND world*");
    }
}
