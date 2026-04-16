"use client";

import { useLocale as useNextIntlLocale, useTranslations } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

/**
 * Hook para leer el locale actual y cambiar de idioma.
 *
 * @example
 * const { locale, changeLocale, isPending } = useLocale();
 * changeLocale("en");
 */
export function useLocale() {
  const locale = useNextIntlLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  /**
   * Cambia el locale reemplazando el segmento en la URL actual.
   * /es/citas → /en/citas
   */
  function changeLocale(newLocale: string) {
    startTransition(() => {
      const segments = pathname.split("/");
      segments[1] = newLocale;
      router.push(segments.join("/"));
    });
  }

  return { locale, changeLocale, isPending };
}
