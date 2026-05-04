"use client";

import { useEffect, useState } from "react";
import { Activity, RotateCcw } from "lucide-react";

interface Stats {
  today_sessions: number;
  week_sessions: number;
  week_start_date: string;
}

export function EmpleadaStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/empleada/stats")
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) setStats(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const mondayLabel = stats?.week_start_date
    ? new Date(stats.week_start_date + "T00:00:00").toLocaleDateString("es-CO", { day: "numeric", month: "short" })
    : "—";

  return (
    <section aria-labelledby="activity-heading" className="space-y-3">
      <h2
        id="activity-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--brand-text)", opacity: 0.45 }}
      >
        <Activity size={13} />
        Mi actividad
      </h2>

      <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-primary)]/30 border-t-[var(--brand-primary)]" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 divide-x divide-[var(--brand-border)]">
              {/* Sesiones hoy */}
              <div className="p-6 text-center">
                <p
                  className="text-4xl font-black"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {stats?.today_sessions ?? 0}
                </p>
                <p
                  className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-50"
                  style={{ color: "var(--brand-text)" }}
                >
                  Sesiones hoy
                </p>
              </div>

              {/* Sesiones esta semana */}
              <div className="p-6 text-center">
                <p
                  className="text-4xl font-black"
                  style={{ color: "var(--brand-text)" }}
                >
                  {stats?.week_sessions ?? 0}
                </p>
                <p
                  className="mt-1 text-xs font-semibold uppercase tracking-wide opacity-50"
                  style={{ color: "var(--brand-text)" }}
                >
                  Esta semana
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 border-t border-[var(--brand-border)] px-5 py-3">
              <RotateCcw size={11} style={{ color: "var(--brand-text)", opacity: 0.35 }} />
              <p className="text-[10px]" style={{ color: "var(--brand-text)", opacity: 0.4 }}>
                El contador semanal se reinicia cada lunes · Semana desde {mondayLabel}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
