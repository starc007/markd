import { useEffect } from "react";
import { motion } from "motion/react";
import { CommandBar } from "@/components/CommandBar";
import { EditorPane } from "@/components/editor-workspace";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/TopBar";
import { useWorkspaceStore } from "@/stores/workspace";

export default function App() {
  const hydrate = useWorkspaceStore((state) => state.hydrate);
  const ready = useWorkspaceStore((state) => state.ready);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!ready) {
    return (
      <main className="grid h-dvh w-dvw place-items-center overflow-hidden bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark">
        <motion.div
          initial={{ scale: 0.98, y: 10 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl border border-line dark:border-line-dark bg-panel/80 dark:bg-panel-dark/80 px-5 py-4 text-sm text-muted dark:text-muted-dark backdrop-blur-[22px]"
        >
          Opening workspace...
        </motion.div>
      </main>
    );
  }

  return (
    <div className="grid h-dvh w-dvw min-h-0 min-w-0 grid-cols-[280px_minmax(0,1fr)] overflow-hidden bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark max-[860px]:grid-cols-1">
      <Sidebar />
      <motion.section
        className="grid h-dvh min-h-0 min-w-0 grid-rows-[48px_minmax(0,1fr)] overflow-hidden"
        initial={{ x: 10 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <TopBar />
        <EditorPane />
      </motion.section>
      <CommandBar />
    </div>
  );
}
