use std::sync::OnceLock;

use regex::Regex;

fn link_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(
            r#"!?\[[^\]\r\n]*\]\((?P<dest><[^>\r\n]+>|[^\s)\r\n]+)(?:[ \t]+(?:\"[^\"]*\"|'[^']*'|\([^\)]*\)))?\)"#,
        )
        .expect("valid Markdown link regex")
    })
}

fn wiki_re() -> &'static Regex {
    static RE: OnceLock<Regex> = OnceLock::new();
    RE.get_or_init(|| {
        Regex::new(r"\[\[([^\[\]|]+)(?:\|([^\[\]]+))?\]\]")
            .expect("valid wiki link regex")
    })
}

pub(crate) fn scan_content(
    content: &str,
    mut visit: impl FnMut(&str, usize, &str, bool),
) {
    let mut in_frontmatter = has_frontmatter(content);
    let mut frontmatter_started = false;
    let mut fence: Option<char> = None;
    for (index, line) in content.lines().enumerate() {
        let trimmed = line.trim_start();
        if in_frontmatter {
            if frontmatter_started && trimmed.trim_end() == "---" {
                in_frontmatter = false;
            }
            frontmatter_started = true;
            continue;
        }
        if let Some(marker) = fence_marker(trimmed) {
            if fence == Some(marker) {
                fence = None;
            } else if fence.is_none() {
                fence = Some(marker);
            }
            continue;
        }
        if fence.is_some() {
            continue;
        }
        let mut targets = Vec::new();
        for capture in link_re().captures_iter(line) {
            if !capture
                .get(0)
                .is_some_and(|value| value.as_str().starts_with('!'))
            {
                if let Some(dest) = capture.name("dest") {
                    targets.push((dest.start(), dest.as_str(), false));
                }
            }
        }
        for capture in wiki_re().captures_iter(line) {
            if let Some(target) = capture.get(1) {
                targets.push((target.start(), target.as_str(), true));
            }
        }
        targets.sort_by_key(|(position, _, _)| *position);
        for (_, target, wiki) in targets {
            visit(line, index + 1, target, wiki);
        }
    }
}

pub(crate) fn has_frontmatter(content: &str) -> bool {
    let mut lines = content.lines();
    if lines.next().map(str::trim) != Some("---") {
        return false;
    }
    lines.any(|line| line.trim() == "---")
}

pub(crate) fn fence_marker(line: &str) -> Option<char> {
    if line.starts_with("```") {
        Some('`')
    } else if line.starts_with("~~~") {
        Some('~')
    } else {
        None
    }
}

pub(crate) fn resolve_wiki(raw: &str, note_rels: &[String]) -> Option<String> {
    let clean = raw.trim().trim_end_matches(".md");
    if clean.is_empty() {
        return None;
    }
    let full = format!("{clean}.md").replace('\\', "/");
    if let Some(found) = note_rels
        .iter()
        .find(|rel| rel.eq_ignore_ascii_case(&full))
    {
        return Some(found.clone());
    }
    let needle = clean.rsplit('/').next()?.to_lowercase();
    note_rels
        .iter()
        .find(|rel| {
            rel.rsplit('/')
                .next()
                .unwrap_or(rel)
                .trim_end_matches(".md")
                .to_lowercase()
                == needle
        })
        .cloned()
        .or(Some(full))
}

pub(crate) fn normalize_destination(raw: &str) -> Option<String> {
    let raw = raw.trim().trim_start_matches('<').trim_end_matches('>');
    if raw.is_empty() || raw.starts_with('#') || raw.starts_with("//") {
        return None;
    }
    let path_end = raw.find(['?', '#']).unwrap_or(raw.len());
    let mut path = percent_decode(&raw[..path_end]).replace('\\', "/");
    if path
        .split('/')
        .next()
        .is_some_and(|first| first.contains(':'))
    {
        return None;
    }
    while path.starts_with("./") {
        path = path[2..].to_string();
    }
    path = path.trim_start_matches('/').to_string();
    if path.is_empty() || path.split('/').any(|part| part == "..") {
        return None;
    }
    if !path.to_lowercase().ends_with(".md") {
        path.push_str(".md");
    }
    Some(path)
}

fn percent_decode(value: &str) -> String {
    let bytes = value.as_bytes();
    let mut output = Vec::with_capacity(bytes.len());
    let mut index = 0;
    while index < bytes.len() {
        if bytes[index] == b'%' && index + 2 < bytes.len() {
            if let (Some(high), Some(low)) = (hex(bytes[index + 1]), hex(bytes[index + 2])) {
                output.push((high << 4) | low);
                index += 3;
                continue;
            }
        }
        output.push(bytes[index]);
        index += 1;
    }
    String::from_utf8_lossy(&output).to_string()
}

fn hex(byte: u8) -> Option<u8> {
    match byte {
        b'0'..=b'9' => Some(byte - b'0'),
        b'a'..=b'f' => Some(byte - b'a' + 10),
        b'A'..=b'F' => Some(byte - b'A' + 10),
        _ => None,
    }
}

fn encode_rel(value: &str) -> String {
    let mut output = String::new();
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || matches!(byte, b'-' | b'_' | b'.' | b'~' | b'/') {
            output.push(byte as char);
        } else {
            output.push_str(&format!("%{byte:02X}"));
        }
    }
    output
}

pub(crate) fn rewrite_line(line: &str, from: &str, to: &str) -> String {
    let mut replacements = Vec::new();
    for capture in link_re().captures_iter(line) {
        let Some(dest) = capture.name("dest") else {
            continue;
        };
        let Some(normalized) = normalize_destination(dest.as_str()) else {
            continue;
        };
        let mapped = if normalized == from {
            Some(to.to_string())
        } else {
            normalized
                .strip_prefix(&format!("{from}/"))
                .map(|suffix| format!("{to}/{suffix}"))
        };
        if let Some(mapped) = mapped {
            let raw = dest.as_str().trim_matches(['<', '>']);
            let suffix_at = raw.find(['?', '#']).unwrap_or(raw.len());
            let replacement = format!("{}{}", encode_rel(&mapped), &raw[suffix_at..]);
            replacements.push((dest.start(), dest.end(), replacement));
        }
    }
    let mut output = line.to_string();
    for (start, end, replacement) in replacements.into_iter().rev() {
        output.replace_range(start..end, &replacement);
    }
    output
}

pub(crate) fn clean_context(line: &str) -> String {
    let without_links = link_re().replace_all(line, |capture: &regex::Captures<'_>| {
        capture
            .get(0)
            .and_then(|value| value.as_str().split_once("](").map(|(label, _)| label))
            .map(|label| label.trim_start_matches('['))
            .unwrap_or("")
            .to_string()
    });
    let without_wiki = wiki_re().replace_all(&without_links, |capture: &regex::Captures<'_>| {
        capture
            .get(2)
            .or_else(|| capture.get(1))
            .map(|value| value.as_str())
            .unwrap_or("")
            .to_string()
    });
    let clean = without_wiki
        .trim()
        .trim_start_matches('#')
        .trim_start_matches(['-', '*', '+', '>'])
        .split_whitespace()
        .collect::<Vec<_>>()
        .join(" ");
    if clean.chars().count() <= 220 {
        clean
    } else {
        format!("{}…", clean.chars().take(219).collect::<String>())
    }
}
