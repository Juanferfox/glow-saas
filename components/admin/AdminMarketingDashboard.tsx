"use client";

import { Ticket, Users, MousePointer2, Mail, ExternalLink, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CouponRow } from "@/lib/data/coupons";
import type { Tenant } from "@/lib/supabase/types";

interface AdminMarketingDashboardProps {
  coupons: CouponRow[];
  tenant: Tenant;
  locale: string;
}

export function AdminMarketingDashboard({ coupons, tenant, locale }: AdminMarketingDashboardProps) {
  return (
    <div className="space-y-8 pb-10">
      {/* Stats Quick View */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon={<Ticket size={14} />} label="Cupones Activos" value={coupons.length.toString()} />
        <StatCard icon={<Users size={14} />} label="Alcance Mail" value="1.2k" />
        <StatCard icon={<MousePointer2 size={14} />} label="Clicks Banner" value="342" />
        <StatCard icon={<ExternalLink size={14} />} label="Referidos" value="12" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Sección de Cupones */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Gestión de Cupones</h3>
          <div className="space-y-3">
            {coupons.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--brand-border)] p-12 text-center opacity-30">
                <Ticket size={32} className="mx-auto mb-2" />
                <p className="text-sm">No hay cupones activos.</p>
              </div>
            ) : (
              coupons.map((c) => (
                <div key={c.id} className="group relative flex items-center justify-between rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 transition-all hover:border-[var(--brand-primary)]/40 hover:shadow-md">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-500/5 text-[var(--brand-primary)]">
                       <Percent size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black tracking-tight" style={{ color: "var(--brand-text)" }}>{c.code}</p>
                      <p className="text-[10px] opacity-40">
                        {c.discount_type === "percentage" ? `${c.amount}% off` : `$${c.amount} off`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[9px] font-bold uppercase text-green-500">Activo</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Sección de Campañas de Email */}
        <section className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Campañas de Email</h3>
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500">
                <Mail size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Reactivación de Clientes</p>
                <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                  Envía un cupón automático a clientes que no han agendado en los últimos 30 días.
                </p>
              </div>
            </div>
            <button className="w-full rounded-2xl bg-[var(--brand-primary)] py-3 text-xs font-bold text-white shadow-lg transition-all hover:opacity-90 active:scale-[0.98]">
              Configurar Campaña
            </button>
          </div>

          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                <Users size={18} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Referidos Premium</p>
                <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                  Otorga 500 puntos extra a clientes que inviten a amigos y concreten su primera cita.
                </p>
              </div>
            </div>
            <button className="w-full rounded-2xl border border-[var(--brand-border)] py-3 text-xs font-bold transition-all hover:bg-zinc-500/5 active:scale-[0.98]" style={{ color: "var(--brand-text)" }}>
              Gestionar Referidos
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
      <div className="flex items-center gap-2 opacity-40" style={{ color: "var(--brand-text)" }}>
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1 text-xl font-black" style={{ color: "var(--brand-text)" }}>{value}</p>
    </div>
  );
}
