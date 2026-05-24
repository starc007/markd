export function MarkdownEditor({
  content,
  onChange,
  onSave,
}: {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
}) {
  const characters = content.length;
  const words = content.trim().length
    ? content.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <main className="relative overflow-auto bg-panel px-[clamp(36px,9vw,128px)] pb-[clamp(34px,8vw,88px)] pt-4 dark:bg-panel-dark">
      <textarea
        className="min-h-[calc(100vh-104px)] w-full resize-none border-0 bg-transparent text-[17px] leading-[1.72] text-ink outline-none selection:bg-selection dark:text-ink-dark dark:selection:bg-selection-dark"
        value={content}
        spellCheck
        onChange={(event) => onChange(event.target.value)}
        onBlur={onSave}
      />
      <div className="fixed bottom-4 right-4 rounded-full border border-line bg-panel/85 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-[22px] dark:border-line-dark dark:bg-panel-dark/85 dark:text-muted-dark">
        {characters.toLocaleString()} chars · {words.toLocaleString()} words
      </div>
    </main>
  );
}
