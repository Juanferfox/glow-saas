"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalendarPickerProps {
  selectedDate: string | null; // "YYYY-MM-DD"
  onSelect: (date: string) => void;
  timezone: string;
  availableDates?: string[];
  loadingDates?: boolean;
  onViewChange?: (year: number, month: number) => void;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

function toYMD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Paso 2 del flujo de agendamiento.
 * Calendario mensual mobile-first. No muestra días pasados ni más de 60 días adelante.
 */
export function CalendarPicker({ selectedDate, onSelect, timezone, availableDates, loadingDates, onViewChange }: CalendarPickerProps) {
  const today = new Date();
  const todayYMD = toYMD(today);

  // Límite: 60 días adelante
  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + 60);
  const maxYMD = toYMD(maxDate);

  // Mes visible
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth()); // 0-indexed

  // Celdas del mes
  const firstDay  = new Date(viewYear, viewMonth, 1);
  const lastDay   = new Date(viewYear, viewMonth + 1, 0);
  const startPad  = firstDay.getDay(); // cuántos días antes del 1 poner vacíos
  const daysInMonth = lastDay.getDate();

  const availableSet = new Set(availableDates ?? []);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
    const newMonth = viewMonth === 0 ? 11 : viewMonth - 1;
    const newYear = viewMonth === 0 ? viewYear - 1 : viewYear;
    onViewChange?.(newYear, newMonth);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
    const newMonth = viewMonth === 11 ? 0 : viewMonth + 1;
    const newYear = viewMonth === 11 ? viewYear + 1 : viewYear;
    onViewChange?.(newYear, newMonth);
  }

  // Deshabilitar navegación a meses pasados
  const isCurrentOrFuture = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth());
  const isPrevDisabled = !isCurrentOrFuture ||
    (viewYear === today.getFullYear() && viewMonth === today.getMonth());

  // ¿Puede ir al próximo mes? Solo si no supera maxDate + 1 mes de margen
  const maxMonth = maxDate.getMonth();
  const maxYear  = maxDate.getFullYear();
  const isNextDisabled = viewYear > maxYear || (viewYear === maxYear && viewMonth >= maxMonth);

  const cells: (number | null)[] = [
    ...Array(startPad).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div className="space-y-3">
      {/* Cabecera del mes */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevMonth}
          disabled={isPrevDisabled}
          aria-label="Mes anterior"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
            isPrevDisabled
              ? "opacity-20 cursor-not-allowed"
              : "hover:bg-[var(--brand-border)]"
          )}
        >
          <ChevronLeft size={16} style={{ color: "var(--brand-text)" }} />
        </button>

        <span
          className="text-sm font-semibold"
          style={{ color: "var(--brand-text)" }}
        >
          {MONTHS[viewMonth]} {viewYear}
        </span>

        <button
          onClick={nextMonth}
          disabled={isNextDisabled}
          aria-label="Mes siguiente"
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
            isNextDisabled
              ? "opacity-20 cursor-not-allowed"
              : "hover:bg-[var(--brand-border)]"
          )}
        >
          <ChevronRight size={16} style={{ color: "var(--brand-text)" }} />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 text-center">
        {DAYS.map((d) => (
          <span
            key={d}
            className="py-1 text-xs font-bold uppercase"
            style={{ color: "var(--brand-text)", opacity: 0.35 }}
          >
            {d}
          </span>
        ))}
      </div>

      {/* Celdas */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, i) => {
          if (!day) return <span key={`pad-${i}`} />;

          const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const isPast    = ymd < todayYMD;
          const isFuture  = ymd > maxYMD;
          const disabled  = isPast || isFuture;
          const isToday   = ymd === todayYMD;
          const isSelected = ymd === selectedDate;

          return (
            <button
              key={ymd}
              onClick={() => !disabled && onSelect(ymd)}
              disabled={disabled}
              aria-label={ymd}
              aria-pressed={isSelected}
              className={cn(
                "relative mx-auto flex h-9 w-9 items-center justify-center rounded-full text-sm",
                "transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                disabled && "opacity-20 cursor-not-allowed",
                !disabled && !isSelected && "hover:bg-[var(--brand-border)]",
                isSelected && "bg-[var(--brand-primary)] text-white font-bold shadow-sm",
                isToday && !isSelected && "border border-[var(--brand-primary)] font-semibold"
              )}
              style={{
                color: isSelected ? "white" : "var(--brand-text)",
              }}
            >
              {day}
              {!disabled && availableSet.has(ymd) && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-green-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
