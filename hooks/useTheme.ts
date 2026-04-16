"use client";

import { useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

function applyTheme(theme: Theme): void {
  if (typeof window === "undefined") return;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

/**
 * Hook para leer y cambiar el tema de la aplicación.
 *
 * - Lee la preferencia desde localStorage
 * - Aplica el tema al elemento <html> vía data-theme
 * - Escucha cambios del OS cuando el tema es "system"
 *
 * @example
 * const { theme, setTheme, resolvedTheme } = useTheme();
 * setTheme("dark");
 */
export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");

  // Inicializar desde localStorage (sin SSR mismatch)
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) ?? "system";
    setThemeState(saved);
  }, []);

  // Escuchar cambios del sistema cuando theme = "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, []);

  // El tema efectivo que se está mostrando (resuelve "system")
  const resolvedTheme: "light" | "dark" =
    theme === "system"
      ? typeof window !== "undefined" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;

  return { theme, setTheme, resolvedTheme };
}
