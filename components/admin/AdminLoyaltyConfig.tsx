"use client";

import { useState } from "react";
import { Save, Info, Plus, Trash2 } from "lucide-react";
import type { Tenant } from "@/lib/supabase/types";

interface AdminLoyaltyConfigProps {
  tenant: Tenant;
  locale: string;
}

export function AdminLoyaltyConfig({ tenant, locale }: AdminLoyaltyConfigProps) {
  const [pointsPerService, setPointsPerService] = useState(tenant.points_per_service || 100);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    // Simulación
    setTimeout(() => setLoading(false), 800);
  }

  return (
    <div className="max-w-4xl space-y-8 pb-20">
      {/* Reglas Generales */}
      <section className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 space-y-6">
        <div className="flex items-center gap-3 border-b border-[var(--brand-border)] pb-4">
          <div className="rounded-2xl bg-zinc-500/5 p-3 text-[var(--brand-primary)]">
            <Info size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Reglas de Acumulación</h3>
            <p className="text-xs opacity-40">Define cuántos puntos ganan los clientes por cada interacción.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Puntos por servicio completado</label>
            <div className="relative">
              <input
                type="number"
                value={pointsPerService}
                onChange={(e) => setPointsPerService(Number(e.target.value))}
                className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--brand-primary)]">PTS</span>
            </div>
            <p className="text-[10px] opacity-40 italic">Ej: Un cliente gana 100 puntos por cada masaje.</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Puntos por compra (per $)</label>
            <div className="relative">
              <input
                type="number"
                defaultValue={1}
                className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] opacity-50 cursor-not-allowed"
                disabled
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-[var(--brand-primary)] opacity-50">PTS/$</span>
            </div>
            <p className="text-[10px] opacity-40 italic">Suscripción Premium requerida para esta regla.</p>
          </div>
        </div>
      </section>

      {/* Recompensas / Beneficios */}
      <section className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Catálogo de Beneficios</h3>
          <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[var(--brand-primary)] hover:underline">
            <Plus size={12} />
            Nueva Recompensa
          </button>
        </div>

        <div className="space-y-3">
          <RewardRow
            title="Masaje Express (15 min)"
            cost={500}
            status="Activo"
          />
          <RewardRow
            title="Cupón Descuento 15%"
            cost={300}
            status="Activo"
          />
        </div>
      </section>

      {/* Botón Guardar */}
      <div className="fixed bottom-8 right-8">
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-8 py-4 text-xs font-bold text-white shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save size={16} />}
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
      </div>
    </div>
  );
}

function RewardRow({ title, cost, status }: { title: string; cost: number; status: string }) {
  return (
    <div className="flex items-center justify-between rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
      <div className="flex items-center gap-4">
        <div className="rounded-full bg-zinc-500/10 p-2 text-[var(--brand-text)] opacity-40">
          <Plus size={16} />
        </div>
        <div>
          <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>{title}</p>
          <p className="text-[10px] opacity-40">{cost} puntos requeridos</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="rounded-full bg-green-500/10 px-2.5 py-1 text-[9px] font-bold uppercase text-green-500">{status}</span>
        <button className="rounded-full p-2 text-red-500 opacity-20 hover:bg-red-500/10 hover:opacity-100">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
