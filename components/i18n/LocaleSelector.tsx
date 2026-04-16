"use client";

import { useRouter, usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocaleSelectorProps {
  currentLocale: string;
  availableLocales: string[];
  className?: string;
}

const LOCALE_LABELS: Record<string, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
  fr: "Français",
};

/**
 * Selector de idioma.
 * Reemplaza el segmento de locale en la URL actual y navega.
 */
export function LocaleSelector({
  currentLocale,
  availableLocales,
  className,
}: LocaleSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();

  if (availableLocales.length <= 1) return null;

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newLocale = e.target.value;
    // Reemplazar el primer segmento de locale en la ruta
    const newPath = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, `/${newLocale}`);
    router.push(newPath);
  }

  return (
    <div className={cn("relative flex items-center", className)}>
      <Globe
        size={15}
        className="pointer-events-none absolute left-3 text-[var(--brand-text)] opacity-40"
      />
      <select
        id="locale-selector"
        value={currentLocale}
        onChange={handleChange}
        className={cn(
          "w-full appearance-none rounded-xl border border-[var(--brand-border)]",
          "bg-[var(--brand-surface)] py-2.5 pl-8 pr-4 text-sm",
          "text-[var(--brand-text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]",
          "cursor-pointer"
        )}
        aria-label="Seleccionar idioma"
      >
        {availableLocales.map((locale) => (
          <option key={locale} value={locale}>
            {LOCALE_LABELS[locale] ?? locale.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
}
