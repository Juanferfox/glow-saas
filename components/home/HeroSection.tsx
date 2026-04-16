import Link from "next/link";
import Image from "next/image";
import type { Tenant } from "@/lib/supabase/types";
import { getTenantText } from "@/lib/theme";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  tenant: Tenant;
  locale: string;
}

/**
 * Sección hero del home público.
 * - Headline, subtítulo y CTA vienen del JSONB del tenant (multi-locale)
 * - Logo del tenant si existe
 * - Gradiente radial usando el color primario del tenant
 */
export function HeroSection({ tenant, locale }: HeroSectionProps) {
  const headline = getTenantText(tenant.hero_headline, locale, tenant.default_locale);
  const subtext  = getTenantText(tenant.hero_subtext,  locale, tenant.default_locale);
  const cta      = getTenantText(tenant.hero_cta,      locale, tenant.default_locale);

  return (
    <section
      aria-label="Bienvenida"
      className="relative flex min-h-[65vh] flex-col items-center justify-center overflow-hidden rounded-2xl px-6 py-16 text-center"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      {/* Gradiente decorativo con el color primario del tenant */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, color-mix(in srgb, var(--brand-primary) 20%, transparent), transparent)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-2xl">
        {/* Badge del nombre del spa */}
        <span
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
          style={{
            backgroundColor: "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
            color: "var(--brand-primary)",
            border: "1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent)",
          }}
        >
          {tenant.name}
        </span>

        {/* Headline */}
        <h1
          className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--brand-text)",
          }}
        >
          {headline}
        </h1>

        {/* Subtítulo */}
        <p
          className="max-w-md text-lg leading-relaxed"
          style={{ color: "var(--brand-text)", opacity: 0.7 }}
        >
          {subtext}
        </p>

        {/* CTAs */}
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
          <Link
            id="hero-cta-primary"
            href={`/${locale}/agendar`}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "rounded-full px-8 py-3.5 text-sm font-semibold text-white shadow-lg",
              "transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 hover:shadow-xl",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-2"
            )}
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {cta}
          </Link>

          <Link
            id="hero-cta-secondary"
            href={`/${locale}#servicios`}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "rounded-full px-8 py-3.5 text-sm font-semibold",
              "border border-[var(--brand-border)] bg-transparent",
              "transition-all duration-200 hover:bg-[var(--brand-border)] hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            )}
            style={{ color: "var(--brand-text)" }}
          >
            Ver servicios
          </Link>
        </div>

        {/* Indicadores de confianza */}
        <div className="flex items-center gap-6 pt-2">
          {[
            { value: "100%", label: "Personalizado" },
            { value: "24/7", label: "Reservas online" },
            { value: "★★★★★", label: "Clientes felices" },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--brand-primary)" }}
              >
                {value}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--brand-text)", opacity: 0.5 }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
