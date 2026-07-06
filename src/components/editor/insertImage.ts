import type { Editor } from "@tiptap/react";
import { toast } from "sonner";
import { ipc } from "@/lib/ipc";

/** Save a pasted/dropped image into the vault and insert it at `range`. */
export async function insertImageFile({
  editor,
  file,
  range,
  vaultRoot,
}: {
  editor: Editor;
  file: File;
  range: { from: number; to: number };
  vaultRoot: string;
}) {
  try {
    const data = await fileToDataUrl(file);
    const extension = file.type.split("/")[1]?.split("+")[0] || "png";
    const absPath = await ipc.saveImageAsset(data, extension);
    const rel = absPath.startsWith(vaultRoot)
      ? absPath.slice(vaultRoot.length).replace(/^\//, "")
      : absPath;
    editor
      .chain()
      .focus()
      .deleteRange(range)
      .setImage({ src: rel } as never)
      .run();
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Could not save image");
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("could not read image"));
    reader.readAsDataURL(file);
  });
}
