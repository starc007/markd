use serde_json::Value;

/// Extract plain text from Tiptap JSON for search indexing and preview
pub fn extract_plain_text(json_str: &str) -> String {
    let parsed: Value = match serde_json::from_str(json_str) {
        Ok(v) => v,
        Err(_) => return String::new(),
    };

    let mut text_parts = Vec::new();
    extract_text_recursive(&parsed, &mut text_parts);
    text_parts.join(" ")
}

fn extract_text_recursive(node: &Value, text_parts: &mut Vec<String>) {
    if let Some(node_type) = node.get("type").and_then(|t| t.as_str()) {
        // Extract text from text nodes
        if node_type == "text" {
            if let Some(text) = node.get("text").and_then(|t| t.as_str()) {
                text_parts.push(text.to_string());
            }
        }
    }

    // Recursively process content array
    if let Some(content) = node.get("content").and_then(|c| c.as_array()) {
        for child in content {
            extract_text_recursive(child, text_parts);
        }
    }
}

/// Generate a preview from Tiptap JSON (first N characters of plain text)
pub fn generate_preview(json_str: &str, max_length: usize) -> Option<String> {
    let plain_text = extract_plain_text(json_str);
    let trimmed = plain_text.trim();

    if trimmed.is_empty() {
        return None;
    }

    if trimmed.len() <= max_length {
        Some(trimmed.to_string())
    } else {
        // Find last space before max_length
        let truncated = &trimmed[..max_length];
        if let Some(last_space) = truncated.rfind(' ') {
            Some(format!("{}...", &truncated[..last_space]))
        } else {
            Some(format!("{}...", truncated))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_plain_text() {
        let json = r#"{
            "type": "doc",
            "content": [
                {
                    "type": "heading",
                    "attrs": {"level": 1},
                    "content": [{"type": "text", "text": "Hello World"}]
                },
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": "This is a test."}]
                }
            ]
        }"#;

        let text = extract_plain_text(json);
        assert_eq!(text, "Hello World This is a test.");
    }

    #[test]
    fn test_generate_preview() {
        let json = r#"{
            "type": "doc",
            "content": [
                {"type": "paragraph", "content": [{"type": "text", "text": "This is a very long text that should be truncated at some point"}]}
            ]
        }"#;

        let preview = generate_preview(json, 20);
        assert!(preview.is_some());
        assert!(preview.unwrap().len() <= 23); // 20 + "..."
    }
}
