import Link from "next/link";
import { Star, Gift, Users, Sparkles } from "lucide-react";
import type { Tenant } from "@/lib/supabase/types";

interface LoyaltyBannerProps {
  tenant: Tenant;
  locale: string;
}

/**
 * Banner del programa de fidelización en el home público.
 * Muestra los 4 beneficios principales y un CTA hacia el registro.
 * Solo visible si el tenant tiene feature_loyalty activo.
 */
export function LoyaltyBanner({ tenant, locale }: LoyaltyBannerProps) {
  if (!tenant.feature_loyalty) return null;

  const perks = [
    {
      icon: Star,
      title: `${tenant.points_per_service} puntos`,
      desc: "por cada servicio completado",
    },
    {
      icon: Gift,
      title: "Canjea tus puntos",
      desc: "por descuentos y servicios gratis",
    },
    {
      icon: Users,
      title: `${tenant.referral_bonus_pts} puntos`,
      desc: "por cada amigo que invites",
    },
    {
      icon: Sparkles,
      title: "30 puntos extra",
      desc: "al dejar una reseña aprobada",
    },
  ];

  return (
    <section
      aria-labelledby="loyalty-heading"
      className="relative overflow-hidden rounded-2xl px-6 py-10"
      style={{
        background: `linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 15%, var(--brand-surface)), color-mix(in srgb, var(--brand-primary) 5%, var(--brand-surface)))`,
        border: `1px solid color-mix(in srgb, var(--brand-primary) 25%, var(--brand-border))`,
      }}
    >
      {/* Círculo decorativo */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full opacity-10"
        style={{ backgroundColor: "var(--brand-primary)" }}
      />

      <div className="relative z-10">
        {/* Encabezado */}
        <div className="mb-8 max-w-lg">
          <div className="mb-3 flex items-center gap-2">
            <Star
              size={18}
              fill="currentColor"
              className="text-[var(--brand-primary)]"
            />
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--brand-primary)" }}
            >
              Programa de puntos
            </span>
          </div>
          <h2
            id="loyalty-heading"
            className="text-2xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
          >
            Acumula puntos con cada visita
          </h2>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: "var(--brand-text)", opacity: 0.65 }}
          >
            Cada servicio, compra y referido suma puntos que puedes canjear por descuentos y servicios gratis.
          </p>
        </div>

        {/* Grid de beneficios */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {perks.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
                }}
              >
                <Icon
                  size={18}
                  style={{ color: "var(--brand-primary)" }}
                />
              </div>
              <div>
                <p
                  className="text-sm font-bold leading-tight"
                  style={{ color: "var(--brand-text)" }}
                >
                  {title}
                </p>
                <p
                  className="text-xs leading-tight"
                  style={{ color: "var(--brand-text)", opacity: 0.55 }}
                >
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            id="loyalty-cta-join"
            href={`/${locale}/puntos`}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            <Star size={14} fill="currentColor" />
            Únete al programa
          </Link>

          <Link
            id="loyalty-cta-learn"
            href={`/${locale}/auth/login`}
            className="text-sm font-medium transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-text)", opacity: 0.6 }}
          >
            ¿Ya tienes cuenta? Inicia sesión →
          </Link>
        </div>
      </div>
    </section>
  );
}
