use std::fs;

use tempfile::tempdir;

use super::*;
use crate::notes::{create_folder, create_note, move_entry, write_note};
use crate::vault::{ensure_layout, notes_root};

#[test]
fn finds_mentions_with_context_and_occurrence() {
    let dir = tempdir().unwrap();
    ensure_layout(dir.path()).unwrap();
    let target = create_note(dir.path(), "", "Target Note").unwrap();
    let source = create_note(dir.path(), "", "Source").unwrap();
    write_note(
        dir.path(),
        &source,
        "Before [first](Target%20Note.md) after.\n\n[second](Target%20Note.md)",
    )
    .unwrap();

    let mentions = find_backlinks(dir.path(), &target).unwrap();
    assert_eq!(mentions.len(), 2);
    assert_eq!(mentions[0].context, "Before first after.");
    assert_eq!(mentions[1].occurrence, 1);
    assert_eq!(mentions[1].line, 3);
}

#[test]
fn ignores_external_images_frontmatter_and_code() {
    let dir = tempdir().unwrap();
    ensure_layout(dir.path()).unwrap();
    let target = create_note(dir.path(), "", "Target").unwrap();
    let source = create_note(dir.path(), "", "Source").unwrap();
    write_note(
        dir.path(),
        &source,
        "---\nref: '[meta](Target.md)'\n---\n![image](Target.md)\n[web](https://example.com)\n```md\n[code](Target.md)\n```",
    )
    .unwrap();
    assert!(find_backlinks(dir.path(), &target).unwrap().is_empty());
}

#[test]
fn move_rewrites_links_and_rebuilds_mentions() {
    let dir = tempdir().unwrap();
    ensure_layout(dir.path()).unwrap();
    let folder = create_folder(dir.path(), "", "Archive").unwrap();
    let target = create_note(dir.path(), "", "Target Note").unwrap();
    let source = create_note(dir.path(), "", "Source").unwrap();
    write_note(
        dir.path(),
        &source,
        "See [target](Target%20Note.md#details).",
    )
    .unwrap();

    let moved = move_entry(dir.path(), &target, &folder).unwrap();
    let content = fs::read_to_string(notes_root(dir.path()).join(&source)).unwrap();
    assert!(content.contains("Archive/Target%20Note.md#details"));
    assert_eq!(find_backlinks(dir.path(), &moved).unwrap().len(), 1);
}

#[test]
fn malformed_percent_encoding_does_not_panic() {
    assert_eq!(normalize_destination("notes/%aé.md"), Some("notes/%aé.md".into()));
}

#[test]
fn resolves_wiki_links_by_path_then_filename() {
    let dir = tempdir().unwrap();
    ensure_layout(dir.path()).unwrap();
    let folder = create_folder(dir.path(), "", "Projects").unwrap();
    let target = create_note(dir.path(), &folder, "Roadmap").unwrap();
    let source = create_note(dir.path(), "", "Source").unwrap();
    write_note(
        dir.path(),
        &source,
        "See [[Projects/Roadmap]] and [[Roadmap|the plan]].",
    )
    .unwrap();

    let mentions = find_backlinks(dir.path(), &target).unwrap();
    assert_eq!(mentions.len(), 2);
    assert_eq!(mentions[0].context, "See Projects/Roadmap and the plan.");
    assert_eq!(mentions[1].occurrence, 1);
}

#[test]
fn scans_links_after_an_unclosed_frontmatter_delimiter() {
    let dir = tempdir().unwrap();
    ensure_layout(dir.path()).unwrap();
    let folder = create_folder(dir.path(), "", "user-knowledgebase").unwrap();
    let target = create_note(dir.path(), &folder, "about-saurabh").unwrap();
    let source = create_note(dir.path(), &folder, "INDEX").unwrap();
    write_note(
        dir.path(),
        &source,
        "---\n\n## status: active\n\n[about-saurabh](user-knowledgebase/about-saurabh.md)",
    )
    .unwrap();

    let mentions = find_backlinks(dir.path(), &target).unwrap();
    assert_eq!(mentions.len(), 1);
    assert_eq!(mentions[0].source_rel, "user-knowledgebase/INDEX.md");
}
