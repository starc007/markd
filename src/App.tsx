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
      <main className="grid h-screen place-items-center bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark">
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="rounded-2xl border border-line dark:border-line-dark bg-panel/80 dark:bg-panel-dark/80 px-5 py-4 text-sm text-muted dark:text-muted-dark backdrop-blur-[22px]"
        >
          Opening workspace...
        </motion.div>
      </main>
    );
  }

  return (
    <div className="grid h-screen min-h-0 grid-cols-[280px_minmax(0,1fr)] overflow-hidden bg-canvas text-ink dark:bg-canvas-dark dark:text-ink-dark max-[860px]:grid-cols-1">
      <Sidebar />
      <section className="grid h-screen min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] overflow-hidden">
        <TopBar />
        <EditorPane />
      </section>
      <CommandBar />
    </div>
  );
}
