import { useEffect, useState } from "react";

const THEME_KEY = "productivity-theme";

/**
 * 3-state theme hook: "light" | "dark" | "system"
 * - "system" listens to the OS prefers-color-scheme media query
 * - Persists selection to localStorage
 * - Applies the "dark" class to <html> immediately
 */
export function useTheme() {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === "undefined") return "system";
    return localStorage.getItem(THEME_KEY) || "system";
  });

  // Resolve the actual applied mode (for components that need to know light vs dark)
  const resolveApplied = (t) => {
    if (t === "system") {
      return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return t;
  };

  useEffect(() => {
    const root = document.documentElement;

    const apply = (t) => {
      const applied = resolveApplied(t);
      if (applied === "dark") root.classList.add("dark");
      else root.classList.remove("dark");
    };

    apply(theme);
    localStorage.setItem(THEME_KEY, theme);

    // When "system", dynamically follow OS changes
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const onChange = () => apply("system");
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }
  }, [theme]);

  const setTheme = (value) => {
    if (["light", "dark", "system"].includes(value)) setThemeState(value);
  };

  // Legacy toggle: cycles light → dark → system → light
  const toggle = () =>
    setThemeState((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));

  return {
    theme,                          // "light" | "dark" | "system"
    appliedTheme: resolveApplied(theme), // "light" | "dark" (the actually applied value)
    setTheme,
    toggle,
  };
}