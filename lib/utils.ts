import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind de forma segura (shadcn/ui standard) */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formatea un valor numérico como moneda según el locale y la moneda del tenant.
 * @example formatCurrency(15000, 'es-CO', 'COP') → "$15.000"
 */
export function formatCurrency(
  amount: number,
  locale: string = "es-CO",
  currency: string = "COP"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea una fecha según el locale.
 * @example formatDate('2025-06-15', 'es') → "15 de junio de 2025"
 */
export function formatDate(
  date: string | Date,
  locale: string = "es"
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "long",
  }).format(d);
}

/**
 * Extrae el subdominio del hostname.
 * @example getTenantSlug("spa-luna.tuapp.co") → "spa-luna"
 * @example getTenantSlug("localhost") → null
 */
export function getTenantSlug(hostname: string): string | null {
  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";

  // Desarrollo local: spa-luna.localhost → "spa-luna"
  if (hostname.endsWith(`.${appDomain}`) || hostname.endsWith(".localhost")) {
    const parts = hostname.split(".");
    if (parts.length >= 2) {
      const subdomain = parts[0];
      // Excluir "www" y subdominios de sistema
      if (subdomain && subdomain !== "www" && subdomain !== "app") {
        return subdomain;
      }
    }
  }

  return null;
}

/**
 * Trunca un texto a un máximo de caracteres.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}

/**
 * Genera un slug URL-amigable desde un texto.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
