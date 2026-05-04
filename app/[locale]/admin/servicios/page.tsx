"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Plus, Pencil, Power, PowerOff, Clock, Scissors } from "lucide-react";
import { ServiceEditor } from "@/components/admin/ServiceEditor";
import { getTenantText } from "@/lib/theme";
import { formatCurrency, cn } from "@/lib/utils";
import type { ServiceRow } from "@/lib/data/services";

export default function ServiciosPage() {
  const { locale } = useParams<{ locale: string }>();
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);

  const tenantSlug = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tenant") ?? "fm-glow-studio"
    : "fm-glow-studio";

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/servicios?tenant=${tenantSlug}`);
    const data = await res.json();
    setServices(data.services ?? []);
    setLoading(false);
  }, [tenantSlug]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const categories = [...new Set(services.map((s) => s.category).filter(Boolean))] as string[];
  const filtered = filter ? services.filter((s) => s.category === filter) : services;

  async function handleSave(service: Partial<ServiceRow> & { id?: string }) {
    const isNew = !service.id;
    const res = await fetch("/api/admin/servicios", {
      method: isNew ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(service),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Error al guardar");
    }
    await fetchServices();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-[var(--brand-primary)]">
            <Scissors size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Catálogo</span>
          </div>
          <h2 className="text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}>
            Gestión de Servicios
          </h2>
        </div>
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <Plus size={16} />
          Agregar
        </button>
      </div>

      {/* Filtro por categoría */}
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
              !filter
                ? "bg-[var(--brand-primary)] text-white"
                : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
            )}
          >
            Todas
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(filter === cat ? null : cat)}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold transition-colors capitalize",
                filter === cat
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
        <div className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-3 px-3 py-2 text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
          <span>Servicio</span>
          <span>Categoría</span>
          <span>Duración</span>
          <span>Precio</span>
          <span>Acciones</span>
        </div>

        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            No hay servicios en esta categoría.
          </p>
        ) : (
          filtered.map((svc) => (
            <div
              key={svc.id}
              className="grid grid-cols-[1fr_100px_80px_80px_100px] gap-3 items-center rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-3 transition-colors hover:bg-zinc-500/5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
                  {getTenantText(svc.name, locale, "es")}
                </p>
                {svc.description && (
                  <p className="truncate text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                    {getTenantText(svc.description!, locale, "es")}
                  </p>
                )}
              </div>
              <span className="text-xs capitalize opacity-50" style={{ color: "var(--brand-text)" }}>
                {svc.category ?? "—"}
              </span>
              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--brand-text)" }}>
                <Clock size={11} />
                {svc.duration_min} min
              </span>
              <span className="text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
                {formatCurrency(svc.price, "es-CO", "COP")}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setEditing(svc)}
                  className="rounded-lg p-1.5 opacity-50 hover:opacity-100 hover:bg-[var(--brand-primary)]/10"
                  title="Editar"
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleSave({ id: svc.id })}
                  className="rounded-lg p-1.5 opacity-50 hover:opacity-100 hover:bg-[var(--brand-primary)]/10"
                  title="Activar/Desactivar"
                >
                  {true ? <Power size={14} className="text-green-500" /> : <PowerOff size={14} className="text-red-400" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal editor */}
      {(editing || adding) && (
        <ServiceEditor
          service={adding ? null : editing}
          locale={locale}
          defaultLocale="es"
          onSave={handleSave}
          onClose={() => { setEditing(null); setAdding(false); }}
        />
      )}
    </div>
  );
}
