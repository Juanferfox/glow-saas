"use client";

import { useState } from "react";
import { Calendar, Clock, MapPin, User, ChevronRight, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import type { Appointment } from "@/lib/supabase/types";
import type { Tenant } from "@/lib/supabase/types";

interface UpcomingAppointmentsProps {
  appointments: (Appointment & {
    service_name: Record<string, string>;
    specialist_name: string;
  })[];
  tenant: Tenant;
  locale: string;
}

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
  }).format(new Date(iso));
}

function formatTime(iso: string) {
  return iso.slice(11, 16);
}

export function UpcomingAppointments({
  appointments: initialAppointments,
  tenant,
  locale,
}: UpcomingAppointmentsProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [cancelling, setCancelling] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("¿Estás seguro de que deseas cancelar esta cita?")) return;
    
    setCancelling(id);
    try {
      const res = await fetch("/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId: id }),
      });
      if (res.ok) {
        setAppointments(prev => prev.filter(a => a.id !== id));
      }
    } catch (e) {
      alert("No se pudo cancelar la cita");
    } finally {
      setCancelling(null);
    }
  }

  if (appointments.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--brand-border)] p-8 text-center">
        <p className="text-3xl text-[var(--brand-text)] opacity-20">📅</p>
        <p className="mt-2 text-sm font-medium" style={{ color: "var(--brand-text)" }}>
          No tienes citas agendadas
        </p>
        <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
          Tus próximas citas aparecerán aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.map((apt) => {
        const serviceName = getTenantText(apt.service_name, locale, tenant.default_locale);
        const isToday = new Date(apt.scheduled_at).toDateString() === new Date().toDateString();
        const isCancelling = cancelling === apt.id;

        return (
          <div
            key={apt.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4",
              "transition-all duration-200 hover:shadow-md active:scale-[0.98]",
              isCancelling && "opacity-50 pointer-events-none"
            )}
          >
            {/* Indicador hoy */}
            {isToday && (
              <div
                className="absolute right-0 top-0 rounded-bl-xl px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                Hoy
              </div>
            )}

            <div className="flex items-start gap-4">
              {/* Fecha box */}
              <div
                className="flex h-12 w-12 flex-col items-center justify-center rounded-xl text-center"
                style={{
                  backgroundColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
                }}
              >
                <span
                  className="text-xs font-bold uppercase"
                  style={{ color: "var(--brand-primary)", opacity: 0.6 }}
                >
                  {new Date(apt.scheduled_at).toLocaleDateString(locale, { month: "short" })}
                </span>
                <span
                  className="text-lg font-black leading-none"
                  style={{ color: "var(--brand-primary)" }}
                >
                  {new Date(apt.scheduled_at).getDate()}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <h4
                  className="truncate text-sm font-bold"
                  style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}
                >
                  {serviceName}
                </h4>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <div className="flex items-center gap-1 text-[11px] opacity-60" style={{ color: "var(--brand-text)" }}>
                    <Clock size={11} />
                    {formatTime(apt.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] opacity-60" style={{ color: "var(--brand-text)" }}>
                    <User size={11} />
                    {apt.specialist_name}
                  </div>
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCancel(apt.id)}
                  disabled={isCancelling}
                  title="Cancelar cita"
                  className="rounded-full p-2 text-red-500 opacity-20 transition-all hover:bg-red-500/10 hover:opacity-100 group-hover:opacity-40"
                >
                  {isCancelling ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                </button>
                <div className="opacity-10">
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
