import { FolderOpen, FolderPlus } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { useVault } from "@/stores/vault";

export function Welcome() {
  const chooseVault = useVault((s) => s.chooseVault);
  const createVault = useVault((s) => s.createVault);

  return (
    <div
      data-tauri-drag-region
      className="relative flex h-full flex-col items-center justify-center bg-bg"
    >
      {/* dot grid backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in srgb, var(--ink) 12%, transparent) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, black, transparent)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center"
      >
        <h1 className="text-[64px] font-[680] leading-none tracking-[-0.04em]">
          Markd
        </h1>
        <p className="mt-4 text-[15px] text-muted">
          Plain markdown notes. Yours, on disk.
        </p>

        <div className="mt-12 flex items-center gap-3">
          <Button variant="primary" size="lg" onClick={createVault}>
            <FolderPlus size={16} strokeWidth={1.75} />
            Create new vault
          </Button>
          <Button variant="outline" size="lg" onClick={chooseVault}>
            <FolderOpen size={16} strokeWidth={1.75} />
            Open existing
          </Button>
        </div>

        <p className="mt-5 max-w-[320px] text-center text-[12.5px] leading-relaxed text-faint">
          Your notes live in a folder you own, as plain{" "}
          <span className="font-mono text-[11.5px]">.md</span> files
        </p>
      </motion.div>
    </div>
  );
}
