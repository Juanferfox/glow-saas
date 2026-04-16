"use client";

import { useState } from "react";
import { Clock, Search } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ServiceRow } from "@/lib/data/services";
import type { Tenant } from "@/lib/supabase/types";

interface ServiceSelectorProps {
  services: ServiceRow[];
  tenant: Tenant;
  locale: string;
  selectedId: string | null;
  onSelect: (service: ServiceRow) => void;
}

/**
 * Paso 1 del flujo de agendamiento.
 * Lista de servicios con búsqueda y filtro por categoría.
 */
export function ServiceSelector({
  services,
  tenant,
  locale,
  selectedId,
  onSelect,
}: ServiceSelectorProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(services.map((s) => s.category ?? "general"))];

  const filtered = services.filter((s) => {
    const name = getTenantText(s.name, locale, tenant.default_locale).toLowerCase();
    const matchQuery = !query || name.includes(query.toLowerCase());
    const matchCat = !activeCategory || s.category === activeCategory;
    return matchQuery && matchCat;
  });

  return (
    <div className="space-y-4">
      {/* Búsqueda */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--brand-text)] opacity-40"
        />
        <input
          type="search"
          placeholder="Buscar servicio…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn(
            "w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)]",
            "py-2.5 pl-9 pr-4 text-sm text-[var(--brand-text)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] placeholder:opacity-40"
          )}
        />
      </div>

      {/* Filtros por categoría */}
      {categories.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setActiveCategory(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
              !activeCategory
                ? "bg-[var(--brand-primary)] text-white"
                : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
            )}
          >
            Todos
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold capitalize transition-colors",
                activeCategory === cat
                  ? "bg-[var(--brand-primary)] text-white"
                  : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Lista de servicios */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            No se encontraron servicios
          </p>
        )}
        {filtered.map((service) => {
          const name = getTenantText(service.name, locale, tenant.default_locale);
          const desc = getTenantText(service.description ?? {}, locale, tenant.default_locale);
          const isSelected = service.id === selectedId;

          return (
            <button
              key={service.id}
              id={`service-option-${service.id}`}
              onClick={() => onSelect(service)}
              className={cn(
                "w-full rounded-2xl border p-4 text-left transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                isSelected
                  ? "border-[var(--brand-primary)] bg-[color-mix(in_srgb,var(--brand-primary)_10%,transparent)]"
                  : "border-[var(--brand-border)] bg-[var(--brand-surface)] hover:border-[var(--brand-primary)]/40"
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="font-semibold leading-tight"
                    style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}
                  >
                    {name}
                  </p>
                  {desc && (
                    <p
                      className="mt-0.5 text-xs leading-relaxed line-clamp-1"
                      style={{ color: "var(--brand-text)", opacity: 0.55 }}
                    >
                      {desc}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3">
                    <span
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "var(--brand-text)", opacity: 0.5 }}
                    >
                      <Clock size={11} />
                      {service.duration_min} min
                    </span>
                    {service.category && (
                      <span
                        className="rounded-full px-2 py-0.5 text-xs capitalize"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
                          color: "var(--brand-primary)",
                        }}
                      >
                        {service.category}
                      </span>
                    )}
                  </div>
                </div>
                <span
                  className="shrink-0 text-base font-bold"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {formatCurrency(
                    service.price,
                    `${locale}-${tenant.currency === "COP" ? "CO" : "US"}`,
                    tenant.currency
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
