"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface WorkerStats {
  today_sessions: number;
  week_sessions: number;
  week_start_date: string;
}

export function WorkerActivity() {
  const [stats, setStats] = useState<WorkerStats | null>(null);

  useEffect(() => {
    fetch("/api/empleada/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  if (!stats) return null;

  const startDate = new Date(stats.week_start_date).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
  });

  return (
    <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <Activity size={16} className="opacity-50" style={{ color: "var(--brand-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
          Mi actividad
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-center">
          <p className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
            {stats.today_sessions}
          </p>
          <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
            Sesiones hoy
          </p>
        </div>
        <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3 text-center">
          <p className="text-2xl font-black" style={{ color: "var(--brand-primary)" }}>
            {stats.week_sessions}
          </p>
          <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
            Esta semana
          </p>
        </div>
      </div>

      <p className="text-center text-xs opacity-30" style={{ color: "var(--brand-text)" }}>
        Se reinicia cada lunes · Desde {startDate}
      </p>
    </section>
  );
}
