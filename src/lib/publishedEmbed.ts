function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function publishedEmbedCode(url: string, title: string): string {
  const embedUrl = new URL(url);
  embedUrl.searchParams.set("embed", "1");
  return `<iframe src="${escapeAttribute(embedUrl.toString())}" title="${escapeAttribute(title)}" width="100%" height="600" style="border: 0;" loading="lazy"></iframe>`;
}
