import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import type { Editor } from "@tiptap/react";
import * as api from "@/lib/workspace-api";
import { applyImageAsset } from "./linkCommands";

const imageExtensions = ["png", "jpg", "jpeg", "gif", "webp", "avif", "svg"];

function extensionFromName(name: string) {
  return name.split(".").pop()?.toLowerCase() || "png";
}

function workspaceAssetUrl(workspaceRoot: string, relativePath: string) {
  return convertFileSrc(`${workspaceRoot.replace(/\/$/, "")}/${relativePath}`);
}

async function bytesFromFile(file: File) {
  return Array.from(new Uint8Array(await file.arrayBuffer()));
}

export async function pickImageFile() {
  const selected = await open({
    multiple: false,
    filters: [{ name: "Images", extensions: imageExtensions }],
  });

  return !selected || Array.isArray(selected) ? null : selected;
}

export async function insertImagePath({
  editor,
  path,
  range,
}: {
  editor: Editor;
  path: string;
  range: { from: number; to: number };
}) {
  const relativePath = await api.importImageAsset(path);
  const displaySrc = convertFileSrc(path);
  return applyImageAsset(editor, displaySrc, relativePath, range.from, range.to);
}

export async function insertImageFile({
  editor,
  file,
  range,
  workspaceRoot,
}: {
  editor: Editor;
  file: File;
  range: { from: number; to: number };
  workspaceRoot: string;
}) {
  const relativePath = await api.saveImageAsset({
    bytes: await bytesFromFile(file),
    fileName: file.name || `image.${extensionFromName(file.name)}`,
  });

  return applyImageAsset(
    editor,
    workspaceAssetUrl(workspaceRoot, relativePath),
    relativePath,
    range.from,
    range.to,
  );
}
