import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** clsx + tailwind-merge — the class helper beui/shadcn components expect. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Lightweight join for our own components (no tailwind-merge overhead). */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** "projects/app.md" → "app" */
export function noteTitle(rel: string) {
  const base = rel.split("/").pop() ?? rel;
  return base.replace(/\.md$/, "");
}

/** Parent directory of a rel path ("" for root). */
export function parentDir(rel: string) {
  const idx = rel.lastIndexOf("/");
  return idx === -1 ? "" : rel.slice(0, idx);
}

export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  wait: number,
) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      fn(...args);
    }, wait);
  };
  debounced.flush = (...args: Args) => {
    if (timer) clearTimeout(timer);
    timer = null;
    fn(...args);
  };
  debounced.cancel = () => {
    if (timer) clearTimeout(timer);
    timer = null;
  };
  return debounced;
}

export function hostOf(url: string) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function isMac() {
  return (
    typeof navigator !== "undefined" &&
    navigator.platform.toLowerCase().includes("mac")
  );
}
