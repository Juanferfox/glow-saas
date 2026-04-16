import type { Tenant } from "./supabase/types";

/**
 * Genera las CSS custom properties del tenant.
 * Se inyectan en el <html> root vía TenantProvider.
 */
export function generateCSSVars(tenant: Tenant): Record<string, string> {
  return {
    "--brand-primary": tenant.brand_color_primary,
    "--brand-bg": tenant.brand_color_bg,
    "--brand-text": tenant.brand_color_text,
    "--brand-surface": tenant.brand_color_surface,
    "--brand-border": tenant.brand_color_border,
    "--brand-dark-bg": tenant.brand_color_dark_bg,
    "--brand-dark-surface": tenant.brand_color_dark_surface,
    "--brand-dark-text": tenant.brand_color_dark_text,
    "--brand-dark-border": tenant.brand_color_dark_border,
    "--brand-radius": tenant.brand_radius,
    "--font-heading": tenant.brand_font_heading,
    "--font-body": tenant.brand_font_body,
  };
}

/**
 * Genera un bloque de CSS inline para inyectar en <style>.
 * Incluye los tokens para light y dark mode del tenant.
 */
export function generateCSSBlock(tenant: Tenant): string {
  const vars = generateCSSVars(tenant);
  const varLines = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");

  return `
:root {
${varLines}
}

[data-theme="dark"] {
  --brand-bg: var(--brand-dark-bg);
  --brand-surface: var(--brand-dark-surface);
  --brand-text: var(--brand-dark-text);
  --brand-border: var(--brand-dark-border);
}
`.trim();
}

/**
 * Obtiene el headline del tenant en el locale dado.
 * Fallback al locale por defecto del tenant, luego a cualquier valor disponible.
 */
export function getTenantText(
  jsonbField: Record<string, string> | null,
  locale: string,
  defaultLocale: string = "es"
): string {
  if (!jsonbField) return "";
  return (
    jsonbField[locale] ??
    jsonbField[defaultLocale] ??
    Object.values(jsonbField)[0] ??
    ""
  );
}

/**
 * Genera el inline script anti-FOUC que va en el <head> antes de cualquier CSS.
 * Lee localStorage y aplica data-theme inmediatamente antes del primer render.
 */
export function getFOUCPreventionScript(): string {
  return `(function(){try{var t=localStorage.getItem('theme')||'system';var dark=t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.setAttribute('data-theme',dark?'dark':'light');}catch(e){}})();`;
}
