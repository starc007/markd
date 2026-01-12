import { useState } from "react";
import { useUpdateStore } from "../../stores/updateStore";
import { IconButton } from "../ui/IconButton";
import { UpdateDialog } from "./UpdateDialog";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download01Icon } from "@hugeicons/core-free-icons";

/**
 * UpdateIndicator Component
 *
 * Small indicator in the top-left corner showing update status.
 * Shows different states:
 * - Hidden when no update available
 * - Blue dot/badge when update is available
 * - Spinner when downloading
 * - Checkmark when ready to install
 */
export function UpdateIndicator() {
  const status = useUpdateStore((state) => state.status);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Don't show indicator if idle or checking (unless there's an error)
  if (status === "idle" || status === "checking") {
    return null;
  }

  // Show indicator for available, downloading, ready, or error states
  const showIndicator =
    status === "available" ||
    status === "downloading" ||
    status === "ready" ||
    status === "error";

  if (!showIndicator) {
    return null;
  }

  return (
    <>
      <div className="absolute top-2 left-2 z-50">
        <IconButton
          variant="ghost"
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="relative"
          title={
            status === "available"
              ? "Update available"
              : status === "downloading"
              ? "Downloading update..."
              : status === "ready"
              ? "Update ready to install"
              : "Update error"
          }
        >
          {status === "available" && (
            <div className="relative">
              <HugeiconsIcon
                icon={Download01Icon}
                className="w-4 h-4 text-blue-500"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            </div>
          )}
          {status === "downloading" && (
            <div className="relative">
              <HugeiconsIcon
                icon={Download01Icon}
                className="w-4 h-4 text-blue-500 animate-spin"
              />
            </div>
          )}
          {status === "ready" && (
            <div className="relative">
              <HugeiconsIcon
                icon={Download01Icon}
                className="w-4 h-4 text-green-500"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
            </div>
          )}
          {status === "error" && (
            <div className="relative">
              <HugeiconsIcon
                icon={Download01Icon}
                className="w-4 h-4 text-red-500"
              />
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
            </div>
          )}
        </IconButton>
      </div>

      <UpdateDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />
    </>
  );
}
