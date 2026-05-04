"use client";

import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Scissors, ArrowUpRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Period = "today" | "week" | "month";

interface Analytics {
  services_revenue: number;
  store_revenue: number;
  total: number;
  appointments_count: number;
  orders_count: number;
  transactions: {
    type: string;
    description: string;
    amount: number;
    client: string;
    date: string;
  }[];
}

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const PERIOD_LABELS: Record<Period, string> = {
  today: "Hoy",
  week: "Esta semana",
  month: "Este mes",
};

export function GananciasOverview() {
  const [period, setPeriod] = useState<Period>("week");
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then((d) => { if (!d.error) setData(d); })
      .finally(() => setLoading(false));
  }, [period]);

  return (
    <div className="space-y-4">
      {/* Título + selector de período */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
          Ganancias
        </h3>
        <div className="flex rounded-xl border border-[var(--brand-border)] p-0.5">
          {(["today", "week", "month"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all",
                period === p
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-[var(--brand-text)] opacity-50 hover:opacity-80"
              )}
            >
              {PERIOD_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin opacity-30" />
        </div>
      ) : data ? (
        <>
          {/* Tarjetas de métricas */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
              <div className="flex items-center gap-2 text-violet-500">
                <Scissors size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Servicios</span>
              </div>
              <p className="mt-3 text-2xl font-black" style={{ color: "var(--brand-text)" }}>
                {formatCOP(data.services_revenue)}
              </p>
              <p className="text-[11px] opacity-40 mt-1" style={{ color: "var(--brand-text)" }}>
                {data.appointments_count} citas
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5">
              <div className="flex items-center gap-2 text-amber-500">
                <ShoppingBag size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Tienda</span>
              </div>
              <p className="mt-3 text-2xl font-black" style={{ color: "var(--brand-text)" }}>
                {formatCOP(data.store_revenue)}
              </p>
              <p className="text-[11px] opacity-40 mt-1" style={{ color: "var(--brand-text)" }}>
                {data.orders_count} pedidos
              </p>
            </div>

            <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-primary)]/5 p-5">
              <div className="flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Total</span>
              </div>
              <p className="mt-3 text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
                {formatCOP(data.total)}
              </p>
              <p className="text-[11px] opacity-40 mt-1" style={{ color: "var(--brand-text)" }}>
                {PERIOD_LABELS[period]}
              </p>
            </div>
          </div>

          {/* Últimas transacciones */}
          <div className="rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--brand-border)]">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
                Últimas transacciones
              </p>
            </div>
            <div className="divide-y divide-[var(--brand-border)]">
              {data.transactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-zinc-500/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl text-white",
                      tx.type === "service" ? "bg-violet-500" : "bg-amber-500"
                    )}>
                      {tx.type === "service" ? <Scissors size={13} /> : <ShoppingBag size={13} />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>{tx.description}</p>
                      <p className="text-[10px] opacity-40" style={{ color: "var(--brand-text)" }}>{tx.client} · {tx.date}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black" style={{ color: "var(--brand-text)" }}>
                    {formatCOP(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-center text-sm opacity-30 py-8">No hay datos disponibles.</p>
      )}
    </div>
  );
}
