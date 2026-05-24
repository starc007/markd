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
      <main className="grid h-screen place-items-center bg-canvas text-ink">
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="rounded-2xl border border-line bg-panel/80 px-5 py-4 text-sm text-muted backdrop-blur-[22px]"
        >
          Opening workspace...
        </motion.div>
      </main>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[280px_minmax(0,1fr)] overflow-hidden bg-canvas text-ink max-[860px]:grid-cols-1">
      <Sidebar />
      <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)]">
        <TopBar />
        <EditorPane />
      </section>
      <CommandBar />
    </div>
  );
}
