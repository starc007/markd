import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { useUi } from "@/stores/ui";
import { useVault } from "@/stores/vault";

let started = false;

/** Listen once for the global shortcut event registered by the Rust process. */
export async function startQuickCaptureShortcut() {
  if (started) return;
  started = true;

  try {
    await listen("markd:quick-capture", () => {
      if (useVault.getState().status === "ready") {
        useUi.getState().setQuickCaptureOpen(true);
      } else {
        toast("Choose a vault before capturing a note");
      }
    });
  } catch (error) {
    started = false;
    toast.error("Quick Capture could not start", {
      description: error instanceof Error ? error.message : String(error),
    });
  }
}
