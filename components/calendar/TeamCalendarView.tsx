"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

interface Specialist {
  id: string;
  name: string;
  color: string;
}

interface TeamCalendarViewProps {
  events: CalendarEvent[];
  specialists: Specialist[];
  locale?: string;
  /** Callback cuando la dueña hace click en un evento para editarlo */
  onEventClick?: (event: CalendarEvent) => void;
}

const SPECIALIST_PALETTE = [
  "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b",
  "#10b981", "#ef4444", "#6366f1", "#84cc16",
];

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  d.setHours(0, 0, 0, 0);
  return d;
}
function addDays(date: Date, n: number): Date {
  const d = new Date(date); d.setDate(d.getDate() + n); return d;
}
function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

const START_HOUR = 8;
const END_HOUR   = 20;

export function TeamCalendarView({
  events,
  specialists,
  locale = "es",
  onEventClick,
}: TeamCalendarViewProps) {
  const isES = locale === "es";
  const DAYS = isES ? DAYS_ES : DAYS_EN;

  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [filterSpecialist, setFilterSpecialist] = useState<string | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  const today = new Date();

  // Mapa de color por especialista
  const colorMap = useMemo(() => {
    const m: Record<string, string> = {};
    specialists.forEach((sp, i) => {
      m[sp.id] = sp.color || SPECIALIST_PALETTE[i % SPECIALIST_PALETTE.length];
    });
    return m;
  }, [specialists]);

  const filteredEvents = useMemo(
    () =>
      filterSpecialist
        ? events.filter((e) => e.specialist_id === filterSpecialist)
        : events,
    [events, filterSpecialist]
  );

  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const ev of filteredEvents) {
      const evDate = new Date(ev.start);
      for (let i = 0; i < 7; i++) {
        if (sameDay(evDate, days[i])) { map[i].push(ev); break; }
      }
    }
    return map;
  }, [filteredEvents, days]); // eslint-disable-line react-hooks/exhaustive-deps

  function eventPosition(ev: CalendarEvent) {
    const start = new Date(ev.start);
    const end   = new Date(ev.end);
    const sMin  = (start.getHours() - START_HOUR) * 60 + start.getMinutes();
    const eMin  = (end.getHours()   - START_HOUR) * 60 + end.getMinutes();
    const total = (END_HOUR - START_HOUR) * 60;
    return {
      top:    `${(sMin / total) * 100}%`,
      height: `${Math.max(((eMin - sMin) / total) * 100, 2)}%`,
    };
  }

  const weekLabel = useMemo(() => {
    const from = weekStart;
    const to   = addDays(weekStart, 6);
    const MONTHS = isES
      ? ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      : ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    if (from.getMonth() === to.getMonth())
      return `${from.getDate()}–${to.getDate()} ${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
    return `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]}`;
  }, [weekStart, isES]);

  return (
    <div className="flex flex-col gap-4">
      {/* Controles */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Navegación de semana */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-border)] hover:bg-[var(--brand-surface)]"
            style={{ color: "var(--brand-text)" }}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            {weekLabel}
          </span>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-[var(--brand-border)] px-2 py-1 text-xs font-medium hover:bg-[var(--brand-surface)]"
            style={{ color: "var(--brand-text)" }}
          >
            {isES ? "Hoy" : "Today"}
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-border)] hover:bg-[var(--brand-surface)]"
            style={{ color: "var(--brand-text)" }}
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Filtro por especialista */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterSpecialist(null)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              !filterSpecialist
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                : "border-[var(--brand-border)] hover:border-[var(--brand-primary)]"
            )}
            style={{ color: filterSpecialist ? "var(--brand-text)" : undefined }}
          >
            <User size={11} />
            {isES ? "Todas" : "All"}
          </button>
          {specialists.map((sp, i) => {
            const color = colorMap[sp.id];
            const active = filterSpecialist === sp.id;
            return (
              <button
                key={sp.id}
                onClick={() => setFilterSpecialist(active ? null : sp.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                  active ? "text-white" : "hover:opacity-80"
                )}
                style={{
                  borderColor: color,
                  backgroundColor: active ? color : `${color}20`,
                  color: active ? "white" : color,
                }}
              >
                {sp.name.split(" ")[0]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grilla */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--brand-border)]"
        style={{ backgroundColor: "var(--brand-surface)" }}
      >
        {/* Cabecera días */}
        <div className="grid grid-cols-8 border-b border-[var(--brand-border)]">
          <div className="px-2 py-2" />
          {days.map((day, i) => {
            const isToday = sameDay(day, today);
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 py-2">
                <span className="text-[10px] font-medium uppercase tracking-wide opacity-50" style={{ color: "var(--brand-text)" }}>
                  {DAYS[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    isToday ? "text-white" : "opacity-70"
                  )}
                  style={{
                    backgroundColor: isToday ? "var(--brand-primary)" : "transparent",
                    color: isToday ? "white" : "var(--brand-text)",
                  }}
                >
                  {day.getDate()}
                </span>
              </div>
            );
          })}
        </div>

        {/* Cuerpo */}
        <div className="relative overflow-y-auto" style={{ maxHeight: "600px" }}>
          <div className="grid grid-cols-8">
            {/* Horas */}
            <div className="border-r border-[var(--brand-border)]">
              {hours.map((h) => (
                <div key={h} className="flex h-14 items-start justify-end pr-2 pt-1">
                  <span className="text-[10px] tabular-nums opacity-40" style={{ color: "var(--brand-text)" }}>
                    {h}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Días */}
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  "relative border-r border-[var(--brand-border)] last:border-r-0",
                  sameDay(day, today) && "bg-[var(--brand-primary)]/[0.02]"
                )}
                style={{ height: `${hours.length * 56}px` }}
              >
                {hours.map((_, hi) => (
                  <div
                    key={hi}
                    className="absolute left-0 right-0 border-b border-[var(--brand-border)]/40"
                    style={{ top: `${hi * 56}px` }}
                  />
                ))}

                {eventsByDay[dayIdx]?.map((ev) => {
                  const pos   = eventPosition(ev);
                  const color = ev.specialist_id ? (colorMap[ev.specialist_id] ?? "#8b5cf6") : "#8b5cf6";
                  return (
                    <button
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded border-l-2 px-1 py-0.5 text-left text-[10px] leading-tight hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]"
                      style={{
                        top: pos.top,
                        height: pos.height,
                        minHeight: "20px",
                        borderLeftColor: color,
                        backgroundColor: `${color}20`,
                        color,
                      }}
                      onClick={() => onEventClick?.(ev)}
                    >
                      <span className="block truncate font-semibold">{ev.title}</span>
                      {ev.client_name && (
                        <span className="block truncate opacity-70">{ev.client_name}</span>
                      )}
                      {ev.session_number && ev.total_sessions && (
                        <span className="opacity-60">{ev.session_number}/{ev.total_sessions}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-3">
        {specialists.map((sp) => (
          <div key={sp.id} className="flex items-center gap-1.5">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: colorMap[sp.id] }}
            />
            <span className="text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
              {sp.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
