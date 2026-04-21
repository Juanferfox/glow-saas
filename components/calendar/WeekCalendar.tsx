"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CalendarEvent } from "@/lib/data/calendar";

interface WeekCalendarProps {
  events: CalendarEvent[];
  /** Si true, los eventos no son clicables/editables */
  readOnly?: boolean;
  locale?: string;
  /** Horas visibles: inicio */
  startHour?: number;
  /** Horas visibles: fin */
  endHour?: number;
}

const DAYS_ES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_ES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MONTHS_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_COLORS: Record<string, string> = {
  confirmed: "bg-emerald-500/20 border-emerald-500 text-emerald-700 dark:text-emerald-300",
  pending:   "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300",
  completed: "bg-slate-400/20 border-slate-400 text-slate-500",
  cancelled: "bg-red-500/10 border-red-400 text-red-400 line-through opacity-60",
};

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekCalendar({
  events,
  readOnly = false,
  locale = "es",
  startHour = 8,
  endHour = 20,
}: WeekCalendarProps) {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);

  const isES = locale === "es";
  const DAYS = isES ? DAYS_ES : DAYS_EN;
  const MONTHS = isES ? MONTHS_ES : MONTHS_EN;

  const weekLabel = useMemo(() => {
    const from = weekStart;
    const to   = addDays(weekStart, 6);
    if (from.getMonth() === to.getMonth()) {
      return `${from.getDate()}–${to.getDate()} ${MONTHS[from.getMonth()]} ${from.getFullYear()}`;
    }
    return `${from.getDate()} ${MONTHS[from.getMonth()]} – ${to.getDate()} ${MONTHS[to.getMonth()]} ${from.getFullYear()}`;
  }, [weekStart, MONTHS]);

  // Agrupar eventos por día
  const eventsByDay = useMemo(() => {
    const map: Record<number, CalendarEvent[]> = {};
    for (let i = 0; i < 7; i++) map[i] = [];
    for (const ev of events) {
      const evDate = new Date(ev.start);
      for (let i = 0; i < 7; i++) {
        if (sameDay(evDate, days[i])) {
          map[i].push(ev);
          break;
        }
      }
    }
    return map;
  }, [events, days]); // eslint-disable-line react-hooks/exhaustive-deps

  // Posición de un evento dentro de la grilla (top + height en %)
  function eventPosition(ev: CalendarEvent) {
    const start  = new Date(ev.start);
    const end    = new Date(ev.end);
    const sMin   = (start.getHours() - startHour) * 60 + start.getMinutes();
    const eMin   = (end.getHours()   - startHour) * 60 + end.getMinutes();
    const totalMin = (endHour - startHour) * 60;
    const top    = (sMin / totalMin) * 100;
    const height = Math.max(((eMin - sMin) / totalMin) * 100, 2);
    return { top: `${top}%`, height: `${height}%` };
  }

  const today = new Date();

  return (
    <div className="flex flex-col gap-3">
      {/* Header de navegación */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setWeekStart((w) => addDays(w, -7))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-border)] transition-colors hover:bg-[var(--brand-surface)]"
          style={{ color: "var(--brand-text)" }}
          aria-label="Semana anterior"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="text-center">
          <p className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
            {weekLabel}
          </p>
          {readOnly && (
            <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
              {isES ? "Vista de solo lectura" : "Read-only view"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="rounded-lg border border-[var(--brand-border)] px-2 py-1 text-xs font-medium transition-colors hover:bg-[var(--brand-surface)]"
            style={{ color: "var(--brand-text)" }}
          >
            {isES ? "Hoy" : "Today"}
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--brand-border)] transition-colors hover:bg-[var(--brand-surface)]"
            style={{ color: "var(--brand-text)" }}
            aria-label="Semana siguiente"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Grilla */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--brand-border)]"
        style={{ backgroundColor: "var(--brand-surface)" }}
      >
        {/* Cabecera de días */}
        <div className="grid grid-cols-8 border-b border-[var(--brand-border)]">
          <div className="px-2 py-2" /> {/* spacer horas */}
          {days.map((day, i) => {
            const isToday = sameDay(day, today);
            return (
              <div key={i} className="flex flex-col items-center gap-0.5 px-1 py-2">
                <span
                  className="text-[10px] font-medium uppercase tracking-wide"
                  style={{ color: "var(--brand-text)", opacity: 0.5 }}
                >
                  {DAYS[day.getDay()]}
                </span>
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                    isToday
                      ? "text-white"
                      : "opacity-70"
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

        {/* Cuerpo con scroll */}
        <div className="relative overflow-y-auto" style={{ maxHeight: "520px" }}>
          <div className="grid grid-cols-8">
            {/* Columna de horas */}
            <div className="border-r border-[var(--brand-border)]">
              {hours.map((h) => (
                <div
                  key={h}
                  className="flex h-14 items-start justify-end pr-2 pt-1"
                >
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--brand-text)", opacity: 0.4 }}>
                    {h}:00
                  </span>
                </div>
              ))}
            </div>

            {/* Columnas de días */}
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                className={cn(
                  "relative border-r border-[var(--brand-border)] last:border-r-0",
                  sameDay(day, today) && "bg-[var(--brand-primary)]/[0.02]"
                )}
                style={{ height: `${hours.length * 56}px` }}
              >
                {/* Líneas de hora */}
                {hours.map((_, hi) => (
                  <div
                    key={hi}
                    className="absolute left-0 right-0 border-b border-[var(--brand-border)]/40"
                    style={{ top: `${hi * 56}px` }}
                  />
                ))}

                {/* Eventos */}
                {eventsByDay[dayIdx]?.map((ev) => {
                  const pos = eventPosition(ev);
                  const colorClass = STATUS_COLORS[ev.status] ?? STATUS_COLORS.confirmed;
                  const hasSession = ev.session_number && ev.total_sessions;

                  return (
                    <button
                      key={ev.id}
                      className={cn(
                        "absolute left-0.5 right-0.5 overflow-hidden rounded border-l-2 px-1 py-0.5 text-left text-[10px] leading-tight",
                        colorClass,
                        !readOnly && "hover:brightness-110 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--brand-primary)]",
                        readOnly && "cursor-default"
                      )}
                      style={{ top: pos.top, height: pos.height, minHeight: "20px" }}
                      onClick={() => !readOnly && setSelectedEvent(ev)}
                    >
                      <span className="block truncate font-semibold">{ev.title}</span>
                      {ev.specialist_name && (
                        <span className="block truncate opacity-70">{ev.specialist_name}</span>
                      )}
                      {hasSession && (
                        <span className="block opacity-60">{ev.session_number}/{ev.total_sessions}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel de detalle del evento */}
      {selectedEvent && !readOnly && (
        <div
          className="rounded-xl border border-[var(--brand-border)] p-4"
          style={{ backgroundColor: "var(--brand-surface)" }}
        >
          <div className="flex items-start justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-semibold" style={{ color: "var(--brand-text)" }}>
                {selectedEvent.title}
              </h3>
              {selectedEvent.specialist_name && (
                <span className="flex items-center gap-1 text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
                  <User size={11} />
                  {selectedEvent.specialist_name}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
                <Clock size={11} />
                {new Date(selectedEvent.start).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                {" – "}
                {new Date(selectedEvent.end).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
              </span>
              {selectedEvent.session_number && selectedEvent.total_sessions && (
                <span className="text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
                  {isES ? "Sesión" : "Session"} {selectedEvent.session_number}/{selectedEvent.total_sessions}
                </span>
              )}
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className="rounded p-1 text-xs opacity-40 hover:opacity-70"
              style={{ color: "var(--brand-text)" }}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
