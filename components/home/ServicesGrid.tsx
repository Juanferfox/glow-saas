import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { getTenantText } from "@/lib/theme";
import { formatCurrency } from "@/lib/utils";
import type { Tenant } from "@/lib/supabase/types";

interface Service {
  id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  duration_min: number;
  price: number;
  category: string | null;
  image_url: string | null;
}

interface ServicesGridProps {
  tenant: Tenant;
  locale: string;
  services: Service[];
}

/**
 * Grilla de servicios del home público.
 * - Muestra hasta 6 servicios destacados
 * - Nombre y descripción en el locale del usuario
 * - Precio formateado según la moneda del tenant
 * - CTA hacia el agendamiento con el servicio pre-seleccionado
 */
export function ServicesGrid({ tenant, locale, services }: ServicesGridProps) {
  if (services.length === 0) return null;

  // Agrupar por categoría para mostrar tabs
  const categories = [...new Set(services.map((s) => s.category ?? "general"))];
  const featured = services.slice(0, 6);

  return (
    <section id="servicios" aria-labelledby="services-heading" className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-end justify-between">
        <div>
          <p
            className="text-xs font-bold uppercase tracking-widest mb-1"
            style={{ color: "var(--brand-primary)" }}
          >
            Catálogo
          </p>
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--brand-text)",
            }}
          >
            Nuestros servicios
          </h2>
        </div>

        {services.length > 6 && (
          <Link
            href={`/${locale}/agendar`}
            className="text-sm font-semibold transition-opacity hover:opacity-70"
            style={{ color: "var(--brand-primary)" }}
          >
            Ver todos →
          </Link>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((service) => {
          const name = getTenantText(service.name, locale, tenant.default_locale);
          const description = getTenantText(
            service.description ?? {},
            locale,
            tenant.default_locale
          );

          return (
            <Link
              key={service.id}
              id={`service-card-${service.id}`}
              href={`/${locale}/agendar?service=${service.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--brand-border)] transition-all duration-200 hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
              style={{ backgroundColor: "var(--brand-surface)" }}
            >
              {/* Imagen o placeholder */}
              <div
                className="relative h-40 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 20%, var(--brand-surface)), var(--brand-surface))`,
                }}
              >
                {service.image_url ? (
                  <Image
                    src={service.image_url}
                    alt={name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <span
                      className="text-4xl font-bold opacity-20"
                      style={{ fontFamily: "var(--font-heading)", color: "var(--brand-primary)" }}
                    >
                      {name.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Badge de categoría */}
                {service.category && (
                  <span
                    className="absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold capitalize"
                    style={{
                      backgroundColor: "color-mix(in srgb, var(--brand-bg) 80%, transparent)",
                      color: "var(--brand-text)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    {service.category}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex flex-1 flex-col gap-2 p-4">
                <h3
                  className="font-semibold leading-tight"
                  style={{
                    fontFamily: "var(--font-heading)",
                    color: "var(--brand-text)",
                  }}
                >
                  {name}
                </h3>

                {description && (
                  <p
                    className="text-xs leading-relaxed line-clamp-2"
                    style={{ color: "var(--brand-text)", opacity: 0.6 }}
                  >
                    {description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between pt-2">
                  {/* Duración */}
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: "var(--brand-text)", opacity: 0.5 }}
                  >
                    <Clock size={12} />
                    {service.duration_min} min
                  </span>

                  {/* Precio */}
                  <span
                    className="text-sm font-bold"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    {formatCurrency(service.price, `${locale}-${tenant.currency === "COP" ? "CO" : "US"}`, tenant.currency)}
                  </span>
                </div>
              </div>

              {/* CTA hover */}
              <div
                className="px-4 pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              >
                <div
                  className="w-full rounded-full py-2 text-center text-xs font-semibold text-white"
                  style={{ backgroundColor: "var(--brand-primary)" }}
                >
                  Agendar →
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
