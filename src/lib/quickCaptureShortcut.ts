import { getCurrentWindow } from "@tauri-apps/api/window";
import { register } from "@tauri-apps/plugin-global-shortcut";
import { toast } from "sonner";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

export const QUICK_CAPTURE_SHORTCUT = "CommandOrControl+Shift+N";

let started = false;

/** Register once for the lifetime of the desktop process. */
export async function startQuickCaptureShortcut() {
  if (started) return;
  started = true;

  try {
    await register(QUICK_CAPTURE_SHORTCUT, async ({ state }) => {
      if (state !== "Pressed") return;
      const window = getCurrentWindow();
      await window.show();
      await window.setFocus();
      if (useVault.getState().status === "ready") {
        useUi.getState().setQuickCaptureOpen(true);
      } else {
        toast("Choose a vault before capturing a note");
      }
    });
  } catch (error) {
    started = false;
    toast.error("Quick Capture shortcut is unavailable", {
      description: error instanceof Error ? error.message : String(error),
    });
  }
}
