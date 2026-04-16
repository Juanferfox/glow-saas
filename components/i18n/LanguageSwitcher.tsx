"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/components/tenant/TenantProvider";

const LOCALE_LABELS: Record<string, string> = {
  es: "ES",
  en: "EN",
  de: "DE",
  fr: "FR",
  pt: "PT",
};

/**
 * Selector de idioma por pills.
 * Solo se muestra si el tenant tiene más de un idioma activo.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const tenant = useTenant();

  const activeLocales = tenant?.active_locales ?? ["es"];

  // No mostrar si hay un solo idioma disponible
  if (activeLocales.length <= 1) return null;

  function handleChange(newLocale: string) {
    startTransition(() => {
      // Reemplazar el locale en la URL actual
      // pathname viene como /es/ruta → cambiar a /en/ruta
      const segments = pathname.split("/");
      segments[1] = newLocale;
      router.push(segments.join("/"));
    });
  }

  return (
    <div
      className={cn("flex items-center gap-1", className)}
      aria-label="Selector de idioma"
    >
      {activeLocales.map((loc) => (
        <button
          key={loc}
          id={`lang-${loc}`}
          onClick={() => handleChange(loc)}
          disabled={isPending || loc === locale}
          aria-current={loc === locale ? "true" : undefined}
          className={cn(
            "rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wider transition-all duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
            loc === locale
              ? "text-[var(--brand-primary)]"
              : "text-[var(--brand-text)] opacity-40 hover:opacity-70"
          )}
        >
          {LOCALE_LABELS[loc] ?? loc.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
