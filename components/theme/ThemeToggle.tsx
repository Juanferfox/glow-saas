"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

const THEMES: { value: Theme; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Claro", Icon: Sun },
  { value: "dark", label: "Oscuro", Icon: Moon },
  { value: "system", label: "Sistema", Icon: Monitor },
];

function applyTheme(theme: Theme) {
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.setAttribute("data-theme", isDark ? "dark" : "light");
}

/**
 * Toggle de tema dark/light/system.
 * Persiste la preferencia en localStorage y la aplica inmediatamente.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("system");

  // Leer preferencia guardada al montar
  useEffect(() => {
    const saved = (localStorage.getItem("theme") as Theme) ?? "system";
    setTheme(saved);
  }, []);

  // Escuchar cambios del OS cuando theme es "system"
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  function handleChange(newTheme: Theme) {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-full p-1",
        "bg-[var(--brand-surface)] border border-[var(--brand-border)]",
        className
      )}
      role="radiogroup"
      aria-label="Tema de la aplicación"
    >
      {THEMES.map(({ value, label, Icon }) => (
        <button
          key={value}
          id={`theme-toggle-${value}`}
          role="radio"
          aria-checked={theme === value}
          aria-label={label}
          title={label}
          onClick={() => handleChange(value)}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full transition-all duration-200",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
            theme === value
              ? "bg-[var(--brand-primary)] text-white shadow-sm"
              : "text-[var(--brand-text)] opacity-50 hover:opacity-80"
          )}
        >
          <Icon size={14} strokeWidth={2} />
        </button>
      ))}
    </div>
  );
}
