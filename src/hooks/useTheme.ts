import { useEffect } from "react";
import { useSettingsStore } from "../stores/settingsStore";

export function useTheme() {
  const theme = useSettingsStore((state) => state.theme);

  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove("light", "dark");

    if (theme === "system") {
      // Use system preference
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.add("light");
      }

      // Listen for system theme changes
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        if (e.matches) {
          root.classList.remove("light");
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
          root.classList.add("light");
        }
      };

      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    } else {
      // Use explicit theme
      root.classList.add(theme);
    }
  }, [theme]);

  return theme;
}
