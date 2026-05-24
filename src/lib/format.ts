export function timeAgo(value: number) {
  const diff = Date.now() - value;
  const minute = 60_000;
  const hour = minute * 60;
  const day = hour * 24;

  if (diff < minute) return "just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  return `${Math.floor(diff / day)}d ago`;
}

export function titleFromMarkdown(markdown: string) {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  return heading || "Untitled";
}

export function extractTodos(markdown: string) {
  return markdown
    .split("\n")
    .map((line, index) => {
      const match = line.match(/^\s*-\s+\[( |x|X)\]\s+(.+)$/);
      if (!match) return null;
      return {
        line: index,
        done: match[1].toLowerCase() === "x",
        text: match[2],
      };
    })
    .filter(Boolean) as Array<{ line: number; done: boolean; text: string }>;
}
