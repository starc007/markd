import { Modal, ModalFooter } from "../ui/Modal";
import { Button } from "../ui/Button";
import { useUpdateStore } from "../../stores/updateStore";
import { useUpdateCheck } from "../../hooks/useUpdateCheck";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Download01Icon,
  Refresh01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon,
} from "@hugeicons/core-free-icons";

interface UpdateDialogProps {
  open: boolean;
  onClose: () => void;
}

/**
 * UpdateDialog Component
 *
 * Modal dialog that shows update information and allows users to:
 * - View update details (version, release notes)
 * - Download the update
 * - Install and restart
 * - Dismiss the dialog
 */
export function UpdateDialog({ open, onClose }: UpdateDialogProps) {
  const { status, update, currentVersion, error, downloadProgress } =
    useUpdateStore();
  const { download, install, check } = useUpdateCheck({ autoCheck: false });

  const handleDownload = async () => {
    await download();
  };

  const handleInstall = async () => {
    await install();
    // App will restart, so onClose won't be called
  };

  const handleCheckAgain = async () => {
    await check();
  };

  console.log("status", status);
  console.log("update", update);
  console.log("currentVersion", currentVersion);
  console.log("error", error);
  console.log("downloadProgress", downloadProgress);

  return (
    <Modal isOpen={open} onClose={onClose} title="Update Available">
      <div className="space-y-4">
        {/* Update Information */}
        {update && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={Download01Icon}
                className="w-5 h-5 text-blue-500"
              />
              <div>
                <p className="font-medium">
                  Version {update.version} is available
                </p>
                <p className="text-sm text-muted-foreground">
                  Current version: {currentVersion}
                </p>
              </div>
            </div>

            {update.body && (
              <div className="mt-4 p-3 bg-accent rounded-lg">
                <p className="text-sm font-medium mb-2">Release Notes:</p>
                <div
                  className="text-sm text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{
                    __html: update.body.replace(/\n/g, "<br />"),
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Download Progress */}
        {status === "downloading" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Downloading...</span>
              <span className="font-medium">
                {Math.round(downloadProgress)}%
              </span>
            </div>
            <div className="w-full bg-accent rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Ready to Install */}
        {status === "ready" && (
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              className="w-5 h-5 text-green-500"
            />
            <p className="text-sm text-green-700 dark:text-green-400">
              Update downloaded and ready to install. The app will restart after
              installation.
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <HugeiconsIcon
              icon={Cancel01Icon}
              className="w-5 h-5 text-red-500"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Update Error
              </p>
              <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
            </div>
          </div>
        )}

        {/* No Update Available */}
        {status === "idle" && !update && (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              You're running the latest version ({currentVersion})
            </p>
          </div>
        )}
      </div>

      <ModalFooter>
        {status === "available" && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Later
            </Button>
            <Button variant="primary" onClick={handleDownload}>
              <HugeiconsIcon icon={Download01Icon} className="w-4 h-4" />
              Download Update
            </Button>
          </>
        )}

        {status === "downloading" && (
          <Button variant="ghost" onClick={onClose} disabled>
            Downloading...
          </Button>
        )}

        {status === "ready" && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Later
            </Button>
            <Button variant="primary" onClick={handleInstall}>
              <HugeiconsIcon icon={CheckmarkCircle01Icon} className="w-4 h-4" />
              Restart to Install
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" onClick={handleCheckAgain}>
              <HugeiconsIcon icon={Refresh01Icon} className="w-4 h-4" />
              Try Again
            </Button>
          </>
        )}

        {status === "idle" && !update && (
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button variant="secondary" onClick={handleCheckAgain}>
              <HugeiconsIcon icon={Refresh01Icon} className="w-4 h-4" />
              Check Again
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
