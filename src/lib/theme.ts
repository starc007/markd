import type { Theme } from "./types";

export function applyTheme(theme: Theme) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const dark = theme === "dark" || (theme === "system" && media.matches);
  document.documentElement.classList.toggle("dark", dark);
}
