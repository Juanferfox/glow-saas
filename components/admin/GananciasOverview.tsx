"use client";

import { useEffect, useState } from "react";
import { formatCurrency, cn } from "@/lib/utils";
import { DollarSign, ShoppingBag, CalendarDays, TrendingUp, BarChart3 } from "lucide-react";

interface AnalyticsData {
  services_revenue: number;
  store_revenue: number;
  total: number;
  appointments_count: number;
  orders_count: number;
  recent_transactions?: {
    type: string;
    description: string;
    amount: number;
    client: string;
    date: string;
  }[];
}

export function GananciasOverview() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?period=${period}`)
      .then((r) => r.json())
      .then((json) => setData(json))
      .finally(() => setLoading(false));
  }, [period]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-8">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  const maxBar = Math.max(data.services_revenue, data.store_revenue, 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
          Ingresos
        </h3>
        <div className="flex rounded-lg border border-[var(--brand-border)] p-0.5">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                period === p
                  ? "bg-[var(--brand-primary)] text-white"
                  : "text-[var(--brand-text)] opacity-50 hover:opacity-80"
              )}
            >
              {p === "today" ? "Hoy" : p === "week" ? "Semana" : "Mes"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card
          icon={<CalendarDays size={16} className="text-blue-500" />}
          label="Servicios"
          value={formatCurrency(data.services_revenue, "es-CO", "COP")}
          sub={`${data.appointments_count} citas`}
        />
        <Card
          icon={<ShoppingBag size={16} className="text-emerald-500" />}
          label="Tienda"
          value={formatCurrency(data.store_revenue, "es-CO", "COP")}
          sub={`${data.orders_count} pedidos`}
        />
        <Card
          icon={<DollarSign size={16} className="text-amber-500" />}
          label="Total General"
          value={formatCurrency(data.total, "es-CO", "COP")}
          highlight
        />
      </div>

      {/* Gráfica de barras */}
      {data.total > 0 && (
        <div
          className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} style={{ color: "var(--brand-primary)" }} />
            <span className="text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
              Comparativa de ingresos
            </span>
          </div>
          <div className="flex items-end gap-4 h-32">
            <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
              <span className="text-xs font-bold" style={{ color: "var(--brand-text)" }}>
                {formatCurrency(data.services_revenue, "es-CO", "COP")}
              </span>
              <div
                className="w-full max-w-[80px] rounded-t-lg transition-all duration-500"
                style={{
                  height: `${(data.services_revenue / maxBar) * 100}%`,
                  backgroundColor: "#3b82f6",
                  minHeight: 4,
                }}
              />
              <span className="text-[10px] font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                Servicios
              </span>
            </div>
            <div className="flex flex-col items-center gap-1 flex-1 h-full justify-end">
              <span className="text-xs font-bold" style={{ color: "var(--brand-text)" }}>
                {formatCurrency(data.store_revenue, "es-CO", "COP")}
              </span>
              <div
                className="w-full max-w-[80px] rounded-t-lg transition-all duration-500"
                style={{
                  height: `${(data.store_revenue / maxBar) * 100}%`,
                  backgroundColor: "#10b981",
                  minHeight: 4,
                }}
              />
              <span className="text-[10px] font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                Tienda
              </span>
            </div>
          </div>
        </div>
      )}

      {data.recent_transactions && data.recent_transactions.length > 0 && (
        <div>
          <h4 className="mb-2 text-xs font-bold uppercase tracking-widest opacity-40" style={{ color: "var(--brand-text)" }}>
            Últimas transacciones
          </h4>
          <div className="space-y-1.5">
            {data.recent_transactions.map((tx, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-2.5"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn(
                    "rounded-lg px-2 py-1 text-[9px] font-bold uppercase",
                    tx.type === "service"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-emerald-500/10 text-emerald-600"
                  )}>
                    {tx.type === "service" ? "Servicio" : "Tienda"}
                  </span>
                  <p className="truncate text-xs font-medium" style={{ color: "var(--brand-text)" }}>
                    {tx.description}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                    {tx.client} · {tx.date}
                  </p>
                  <p className="text-xs font-bold" style={{ color: "var(--brand-primary)" }}>
                    {formatCurrency(tx.amount, "es-CO", "COP")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Card({
  icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4",
        highlight && "ring-2 ring-[var(--brand-primary)] ring-offset-2 ring-offset-[var(--brand-bg)]"
      )}
    >
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
          {label}
        </span>
      </div>
      <p className="mt-2 text-xl font-black" style={{ color: "var(--brand-text)" }}>
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
