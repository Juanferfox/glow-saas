/**
 * /dev/theme-test — Herramienta de preview visual de tenants.
 *
 * Renderiza side-by-side las tarjetas de todos los tenants de desarrollo
 * con sus CSS vars aplicadas inline, para verificar el theming
 * sin necesitar acceder por subdominio.
 *
 * Solo disponible en desarrollo.
 */
import { redirect } from "next/navigation";
import { generateCSSVars } from "@/lib/theme";
import type { Tenant } from "@/lib/supabase/types";

// Tenants de dev hardcodeados (mismos que lib/tenant.ts)
const DEV_TENANTS: Tenant[] = [
  {
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
  {
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
];

function TenantCard({ tenant }: { tenant: Tenant }) {
  const vars = generateCSSVars(tenant);
  const cssVarsStyle = Object.fromEntries(
    Object.entries(vars).map(([k, v]) => [k, v])
  ) as React.CSSProperties;

  const features = [
    { key: "feature_solar", label: "☀️ Bronceo solar" },
    { key: "feature_store", label: "🛍️ Tienda" },
    { key: "feature_loyalty", label: "⭐ Puntos" },
    { key: "feature_referrals", label: "🔗 Referidos" },
    { key: "feature_reviews", label: "💬 Reseñas" },
  ] as const;

  return (
    <div
      style={{
        ...cssVarsStyle,
        backgroundColor: "var(--brand-bg)",
        color: "var(--brand-text)",
        borderRadius: "var(--brand-radius)",
        border: "1px solid var(--brand-border)",
        fontFamily: "var(--font-body)",
      }}
      className="overflow-hidden shadow-xl"
    >
      {/* Header / TopBar simulado */}
      <div
        style={{
          backgroundColor: "var(--brand-bg)",
          borderBottom: "1px solid var(--brand-border)",
        }}
        className="flex items-center justify-between px-4 py-3"
      >
        <span
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--brand-text)",
            fontSize: "1.1rem",
            fontWeight: 600,
          }}
        >
          {tenant.name}
        </span>
        <div className="flex items-center gap-2">
          <span
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "white",
              fontSize: "0.65rem",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "999px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            {tenant.plan}
          </span>
          <span style={{ color: "var(--brand-text)", opacity: 0.4, fontSize: "0.75rem" }}>
            {tenant.currency}
          </span>
        </div>
      </div>

      {/* Hero simulado */}
      <div
        style={{
          backgroundColor: "var(--brand-surface)",
          padding: "2rem 1.5rem",
          textAlign: "center",
          position: "relative",
        }}
      >
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(circle at 50% 0%, color-mix(in srgb, var(--brand-primary) 12%, transparent), transparent 70%)`,
        }} />
        <div style={{ position: "relative" }}>
          <h2
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--brand-text)",
              fontSize: "1.5rem",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "0.75rem",
            }}
          >
            {tenant.hero_headline[tenant.default_locale]}
          </h2>
          <p style={{ color: "var(--brand-text)", opacity: 0.65, fontSize: "0.875rem", marginBottom: "1.25rem" }}>
            {tenant.hero_subtext[tenant.default_locale]}
          </p>
          <button
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "white",
              borderRadius: `calc(var(--brand-radius) * 3)`,
              padding: "0.625rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            {tenant.hero_cta[tenant.default_locale]}
          </button>
        </div>
      </div>

      {/* Features grid */}
      <div style={{ padding: "1rem 1.5rem" }}>
        <p style={{ color: "var(--brand-text)", opacity: 0.4, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
          Módulos activos
        </p>
        <div className="flex flex-wrap gap-2">
          {features.map(({ key, label }) => (
            <span
              key={key}
              style={{
                backgroundColor: tenant[key]
                  ? `color-mix(in srgb, var(--brand-primary) 15%, transparent)`
                  : "transparent",
                color: tenant[key] ? "var(--brand-primary)" : "var(--brand-text)",
                opacity: tenant[key] ? 1 : 0.25,
                border: `1px solid ${tenant[key] ? "var(--brand-primary)" : "var(--brand-border)"}`,
                borderRadius: "var(--brand-radius)",
                padding: "3px 10px",
                fontSize: "0.7rem",
                fontWeight: 600,
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Tokens de color */}
      <div style={{ padding: "0.75rem 1.5rem 1rem", borderTop: "1px solid var(--brand-border)" }}>
        <p style={{ color: "var(--brand-text)", opacity: 0.4, fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
          Tokens de color
        </p>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: "primary", value: tenant.brand_color_primary },
            { label: "bg", value: tenant.brand_color_bg },
            { label: "surface", value: tenant.brand_color_surface },
            { label: "text", value: tenant.brand_color_text },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div
                style={{
                  width: 14, height: 14,
                  borderRadius: "var(--brand-radius)",
                  backgroundColor: value,
                  border: "1px solid var(--brand-border)",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: "var(--brand-text)", opacity: 0.5, fontSize: "0.65rem" }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ThemeTestPage() {
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <span className="inline-block rounded-full bg-yellow-500/10 border border-yellow-500/30 px-3 py-1 text-xs font-semibold text-yellow-400 uppercase tracking-widest mb-3">
          Dev only
        </span>
        <h1 className="text-2xl font-bold text-white mb-1">Theme Preview</h1>
        <p className="text-zinc-400 text-sm">
          Identidad visual de cada tenant. Para ver la app real, usa{" "}
          <code className="rounded bg-zinc-800 px-1.5 py-0.5 text-xs text-yellow-400">
            spa-luna.localhost:3000/es
          </code>
        </p>
      </div>

      {/* Tenant cards */}
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {DEV_TENANTS.map((tenant) => (
          <TenantCard key={tenant.slug} tenant={tenant} />
        ))}
      </div>

      {/* API routes */}
      <div className="mx-auto mt-8 max-w-4xl rounded-xl bg-zinc-900 p-5">
        <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
          API routes verificadas
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEV_TENANTS.flatMap((t) => [
            { url: `/api/manifest/${t.slug}`, label: `PWA Manifest — ${t.name}` },
            { url: `/api/theme/${t.slug}`, label: `CSS Theme — ${t.name}` },
          ]).map(({ url, label }) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-lg bg-zinc-800 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <span className="truncate">{label}</span>
              <span className="ml-2 font-mono text-zinc-500 shrink-0">{url}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
