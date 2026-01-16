import { useState, useEffect } from "react";
import type { Editor } from "@tiptap/core";

interface WordCountStatsProps {
  editor: Editor | null;
}

function calculateStats(text: string) {
  const charactersNoSpaces = text.replace(/\s/g, "").length;
  const characters = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
  const readingTime = Math.ceil(words / 200);

  return { words, characters, charactersNoSpaces, readingTime };
}

export function WordCountStats({ editor }: WordCountStatsProps) {
  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    readingTime: 0,
  });

  useEffect(() => {
    if (!editor) {
      return;
    }

    const updateStats = () => {
      const text = editor.state.doc.textContent;
      const newStats = calculateStats(text);
      setStats(newStats);
    };

    // Initial update
    updateStats();

    // Update on content changes
    editor.on("update", updateStats);
    editor.on("transaction", updateStats);

    return () => {
      editor.off("update", updateStats);
      editor.off("transaction", updateStats);
    };
  }, [editor]);

  if (!editor) {
    return null;
  }

  const { words, characters, readingTime } = stats;

  return (
    <div className="flex items-center gap-4 text-xs text-muted-foreground">
      <span>
        {words.toLocaleString()} {words === 1 ? "word" : "words"}
      </span>
      <span className="text-muted-foreground/50">•</span>
      <span>
        {characters.toLocaleString()}{" "}
        {characters === 1 ? "character" : "characters"}
      </span>
      {readingTime > 0 && (
        <>
          <span className="text-muted-foreground/50">•</span>
          <span>
            {readingTime} {readingTime === 1 ? "min" : "min"} read
          </span>
        </>
      )}
    </div>
  );
}
