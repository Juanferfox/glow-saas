import "server-only";
import { createServiceClient } from "./supabase/server";
import type { Tenant } from "./supabase/types";
import { cache } from "react";

/**
 * Tenants de fallback para desarrollo local (sin Supabase configurado).
 * Se usan cuando NEXT_PUBLIC_SUPABASE_URL no está configurado.
 */
const DEV_TENANTS: Record<string, Tenant> = {
  "spa-luna": {
    id: "dev-spa-luna",
    slug: "spa-luna",
    name: "Spa Luna",
    default_locale: "es",
    active_locales: ["es"],
    currency: "COP",
    timezone: "America/Bogota",
    logo_url: null,
    brand_color_primary: "#c9956a",
    brand_color_bg: "#1a1a2e",
    brand_color_text: "#f0e8df",
    brand_color_surface: "#252540",
    brand_color_border: "#3a3a5c",
    brand_color_dark_bg: "#0d0d1a",
    brand_color_dark_surface: "#1a1a2e",
    brand_color_dark_text: "#f0e8df",
    brand_color_dark_border: "#2e2e4a",
    brand_font_heading: "Georgia, serif",
    brand_font_body: "system-ui, sans-serif",
    brand_radius: "4px",
    hero_headline: { es: "Tu espacio de bienestar y belleza" },
    hero_subtext: { es: "Reserva tu cita con los mejores especialistas" },
    hero_cta: { es: "Agendar cita" },
    feature_store: true,
    feature_inventory: true,
    feature_loyalty: true,
    feature_referrals: true,
    feature_reviews: true,
    feature_solar: true,
    feature_sales_history: true,
    feature_whatsapp_bot: false,
    points_per_service: 100,
    points_per_purchase: 1,
    referral_bonus_pts: 200,
    cancellation_penalty: 50,
    plan: "premium",
    active: true,
    created_at: new Date().toISOString(),
  },
  "glam-studio": {
    id: "dev-glam-studio",
    slug: "glam-studio",
    name: "Glam Studio",
    default_locale: "en",
    active_locales: ["en", "es"],
    currency: "USD",
    timezone: "America/New_York",
    logo_url: null,
    brand_color_primary: "#d4af6a",
    brand_color_bg: "#0a0a0a",
    brand_color_text: "#f5f5f5",
    brand_color_surface: "#1a1a1a",
    brand_color_border: "#2e2e2e",
    brand_color_dark_bg: "#000000",
    brand_color_dark_surface: "#111111",
    brand_color_dark_text: "#f5f5f5",
    brand_color_dark_border: "#222222",
    brand_font_heading: "'Playfair Display', serif",
    brand_font_body: "'DM Sans', sans-serif",
    brand_radius: "2px",
    hero_headline: {
      en: "Where beauty meets precision",
      es: "Donde la belleza se encuentra con la precisión",
    },
    hero_subtext: {
      en: "Book your appointment with our expert stylists",
      es: "Reserva tu cita con nuestros estilistas expertos",
    },
    hero_cta: { en: "Book now", es: "Reservar" },
    feature_store: true,
    feature_inventory: true,
    feature_loyalty: true,
    feature_referrals: true,
    feature_reviews: true,
    feature_solar: false,
    feature_sales_history: true,
    feature_whatsapp_bot: false,
    points_per_service: 100,
    points_per_purchase: 1,
    referral_bonus_pts: 200,
    cancellation_penalty: 50,
    plan: "pro",
    active: true,
    created_at: new Date().toISOString(),
  },
};

/**
 * Obtiene la configuración de un tenant por su slug.
 * Cachea el resultado por request (React cache).
 */
export const getTenant = cache(async (slug: string): Promise<Tenant | null> => {
  // Modo desarrollo sin Supabase configurado
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  ) {
    return DEV_TENANTS[slug] ?? null;
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .single();

    if (error || !data) return null;
    return data as Tenant;
  } catch {
    return DEV_TENANTS[slug] ?? null;
  }
});

/**
 * Obtiene el tenant desde el header x-tenant-slug inyectado por el middleware.
 */
export async function getTenantFromHeaders(
  headers: Headers
): Promise<Tenant | null> {
  const slug = headers.get("x-tenant-slug");
  if (!slug) return null;
  return getTenant(slug);
}
