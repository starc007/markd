use std::fs;
use std::path::Path;

use serde::Serialize;

use crate::backlink_links::{
    clean_context, fence_marker, has_frontmatter, normalize_destination, resolve_wiki,
    rewrite_line, scan_content,
};
use crate::error::AppResult;
use crate::vault::{
    is_reserved_note_path, notes_root, rel_of, scan_tree, NodeKind, TreeNode,
};

#[derive(Debug, PartialEq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BacklinkMention {
    pub source_rel: String,
    pub context: String,
    pub line: usize,
    pub occurrence: usize,
}

pub fn find_backlinks(root: &Path, target_rel: &str) -> AppResult<Vec<BacklinkMention>> {
    let Some(target) = normalize_destination(target_rel) else {
        return Ok(Vec::new());
    };
    let note_rels = collect_note_rels(root)?;
    let mut mentions = Vec::new();
    walk_notes(root, &notes_root(root), &mut |path, content| {
        let source_rel = rel_of(root, path)?;
        let mut occurrence = 0;
        scan_content(content, |line, line_number, raw, wiki| {
            let links_to_target = if wiki {
                resolve_wiki(raw, &note_rels).as_deref() == Some(target.as_str())
            } else {
                normalize_destination(raw).as_deref() == Some(target.as_str())
            };
            if !links_to_target {
                return;
            }
            mentions.push(BacklinkMention {
                source_rel: source_rel.clone(),
                context: clean_context(line),
                line: line_number,
                occurrence,
            });
            occurrence += 1;
        });
        Ok(())
    })?;
    mentions.sort_by(|a, b| {
        a.source_rel
            .to_lowercase()
            .cmp(&b.source_rel.to_lowercase())
            .then(a.line.cmp(&b.line))
    });
    Ok(mentions)
}

fn collect_note_rels(root: &Path) -> AppResult<Vec<String>> {
    fn flatten(nodes: &[TreeNode], output: &mut Vec<String>) {
        for node in nodes {
            if node.kind == NodeKind::Note {
                output.push(node.rel.clone());
            } else if let Some(children) = &node.children {
                flatten(children, output);
            }
        }
    }

    let mut rels = Vec::new();
    flatten(&scan_tree(root)?, &mut rels);
    Ok(rels)
}

/// Rewrite vault-relative Markdown link destinations after a note or folder
/// moves. The Markdown files remain the rebuildable source of truth.
pub fn rewrite_links(root: &Path, from: &str, to: &str) -> AppResult<usize> {
    let mut changed_files = 0;
    walk_notes(root, &notes_root(root), &mut |path, content| {
        let mut output = String::with_capacity(content.len());
        let mut changed = false;
        let mut in_frontmatter = has_frontmatter(content);
        let mut frontmatter_started = false;
        let mut fence: Option<char> = None;

        for segment in content.split_inclusive('\n') {
            let (line, ending) = segment
                .strip_suffix('\n')
                .map(|value| (value, "\n"))
                .unwrap_or((segment, ""));
            let trimmed = line.trim_start();
            if in_frontmatter {
                if frontmatter_started && trimmed.trim_end() == "---" {
                    in_frontmatter = false;
                }
                frontmatter_started = true;
                output.push_str(line);
                output.push_str(ending);
                continue;
            }
            if let Some(marker) = fence_marker(trimmed) {
                if fence == Some(marker) {
                    fence = None;
                } else if fence.is_none() {
                    fence = Some(marker);
                }
                output.push_str(line);
                output.push_str(ending);
                continue;
            }
            if fence.is_some() {
                output.push_str(line);
                output.push_str(ending);
                continue;
            }

            let rewritten = rewrite_line(line, from, to);
            changed |= rewritten != line;
            output.push_str(&rewritten);
            output.push_str(ending);
        }
        if changed {
            fs::write(path, output)?;
            changed_files += 1;
        }
        Ok(())
    })?;
    Ok(changed_files)
}

fn walk_notes(
    root: &Path,
    dir: &Path,
    visit: &mut impl FnMut(&Path, &str) -> AppResult<()>,
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
            walk_notes(root, &path, visit)?;
        } else if path.extension().is_some_and(|ext| ext == "md") {
            let content = fs::read_to_string(&path).unwrap_or_default();
            visit(&path, &content)?;
        }
    }
    Ok(())
}

#[cfg(test)]
#[path = "backlinks_tests.rs"]
mod tests;
