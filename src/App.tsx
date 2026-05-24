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
      <main className="grid h-screen place-items-center bg-[#f6f5f2] text-[#191817] dark:bg-[#171716] dark:text-[#f4f1ea]">
        <motion.div
          initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          className="rounded-3xl border border-[#dedbd3] bg-white/80 px-5 py-4 text-sm text-[#6f6b64] backdrop-blur-[22px] dark:border-[#34322e] dark:bg-[#22211e]/80 dark:text-[#aaa39a]"
        >
          Opening workspace...
        </motion.div>
      </main>
    );
  }

  return (
    <div className="grid h-screen grid-cols-[320px_minmax(0,1fr)] overflow-hidden bg-[#f6f5f2] text-[#191817] dark:bg-[#171716] dark:text-[#f4f1ea] max-[860px]:grid-cols-1">
      <Sidebar />
      <section className="grid min-w-0 grid-rows-[auto_minmax(0,1fr)] gap-3 p-3">
        <TopBar />
        <EditorPane />
      </section>
      <CommandBar />
    </div>
  );
}
