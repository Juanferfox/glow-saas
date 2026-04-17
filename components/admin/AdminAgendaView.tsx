"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Specialist, Tenant } from "@/lib/supabase/types";

interface AdminAgendaViewProps {
  tenant: Tenant;
  locale: string;
  date: string;
  specialists: Specialist[];
  initialAppointments: any[];
}

const HOURS = Array.from({ length: 12 }, (_, i) => `${String(i + 8).padStart(2, "0")}:00`);

export function AdminAgendaView({
  tenant,
  locale,
  date,
  specialists,
  initialAppointments,
}: AdminAgendaViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(date);

  function changeDate(days: number) {
    const d = new Date(`${currentDate}T12:00:00`);
    d.setDate(d.getDate() + days);
    const newDate = d.toISOString().slice(0, 10);
    setCurrentDate(newDate);
    router.push(`/${locale}/admin/agenda?date=${newDate}`);
  }

  return (
    <div className="space-y-6">
      {/* Selector de fecha */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="rounded-full border border-[var(--brand-border)] p-1.5 opacity-60 hover:opacity-100"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex flex-col items-center min-w-[140px]">
            <span className="text-xs font-bold uppercase tracking-wider opacity-40">
              {new Date(`${currentDate}T12:00:00`).toLocaleDateString(locale, { weekday: "long" })}
            </span>
            <span className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
              {new Date(`${currentDate}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
            </span>
          </div>
          <button
            onClick={() => changeDate(1)}
            className="rounded-full border border-[var(--brand-border)] p-1.5 opacity-60 hover:opacity-100"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <input
          type="date"
          value={currentDate}
          onChange={(e) => {
            setCurrentDate(e.target.value);
            router.push(`/${locale}/admin/agenda?date=${e.target.value}`);
          }}
          className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-3 py-1.5 text-xs text-[var(--brand-text)] focus:outline-none"
        />
      </div>

      {/* Vista Kanban / Grid de Especialistas */}
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {specialists.map((sp) => {
          const spApps = initialAppointments.filter((a) => a.specialist_id === sp.id);

          return (
            <div
              key={sp.id}
              className="min-w-[280px] flex-1 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4"
            >
              {/* Header Especialista */}
              <div className="mb-4 flex items-center gap-3 border-b border-[var(--brand-border)] pb-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-primary)] text-white"
                  style={{ opacity: 0.8 }}
                >
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
                    {sp.name}
                  </h3>
                  <p className="text-[10px] opacity-40 uppercase tracking-tighter">
                    {spApps.length} citas hoy
                  </p>
                </div>
              </div>

              {/* Lista de Citas */}
              <div className="space-y-3">
                {HOURS.map((hour) => {
                  const appsAtHour = spApps.filter((a) => {
                    const h = a.scheduled_at.slice(11, 16);
                    return h.startsWith(hour.slice(0, 2));
                  });

                  return (
                    <div key={hour} className="relative min-h-[40px] border-l border-dashed border-[var(--brand-border)] pl-4">
                      <span className="absolute -left-1.5 top-0 text-[9px] font-bold opacity-30">
                        {hour}
                      </span>
                      {appsAtHour.length === 0 ? (
                        <div className="h-full border-b border-[var(--brand-border)]/20 py-2 opacity-10">
                          <span className="text-[10px]">Libre</span>
                        </div>
                      ) : (
                        appsAtHour.map((a) => (
                          <div
                            key={a.id}
                            className="mb-2 rounded-xl bg-[var(--brand-primary)]/10 border border-[var(--brand-primary)]/20 p-2.5"
                          >
                            <p className="text-[10px] font-bold" style={{ color: "var(--brand-primary)" }}>
                              {a.scheduled_at.slice(11, 16)} - {a.ends_at.slice(11, 16)}
                            </p>
                            <p className="text-[11px] font-semibold" style={{ color: "var(--brand-text)" }}>
                              {a.client_name ?? "Cliente"}
                            </p>
                            <p className="text-[10px] opacity-60" style={{ color: "var(--brand-text)" }}>
                              {a.service_name?.es ?? "Servicio"}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
