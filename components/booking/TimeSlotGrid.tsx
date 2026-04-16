"use client";

import { useEffect, useState } from "react";
import { User } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { AvailableSlot } from "@/lib/supabase/types";

interface TimeSlotGridProps {
  tenantSlug: string;
  serviceId: string;
  date: string;         // "YYYY-MM-DD"
  selectedSlot: AvailableSlot | null;
  onSelect: (slot: AvailableSlot) => void;
}

/**
 * Paso 3 del flujo de agendamiento.
 * Carga slots disponibles desde /api/availability y los muestra en una grilla.
 */
export function TimeSlotGrid({
  tenantSlug,
  serviceId,
  date,
  selectedSlot,
  onSelect,
}: TimeSlotGridProps) {
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Agrupar por especialista
  const [filterSpecialist, setFilterSpecialist] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/availability?tenant=${tenantSlug}&service=${serviceId}&date=${date}`)
      .then((r) => r.json())
      .then((json) => {
        setSlots(json.slots ?? []);
        setFilterSpecialist(null);
      })
      .catch(() => setError("No se pudo cargar la disponibilidad"))
      .finally(() => setLoading(false));
  }, [tenantSlug, serviceId, date]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <span
          className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]"
        />
        <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
          Buscando disponibilidad…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-8 text-center text-sm text-red-400">{error}</p>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="py-12 text-center space-y-2">
        <p className="text-3xl">😔</p>
        <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
          No hay disponibilidad para este día
        </p>
        <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
          Prueba con otra fecha
        </p>
      </div>
    );
  }

  // Especialistas únicos
  const specialists = [
    ...new Map(slots.map((s) => [s.specialist_id, s])).values(),
  ];

  const visible = filterSpecialist
    ? slots.filter((s) => s.specialist_id === filterSpecialist)
    : slots;

  // Horas únicas (para la grilla horizontal)
  const uniqueTimes = [...new Set(visible.map((s) => s.time))].sort();

  return (
    <div className="space-y-4">
      {/* Filtro por especialista */}
      {specialists.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterSpecialist(null)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              !filterSpecialist
                ? "bg-[var(--brand-primary)] text-white"
                : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
            )}
          >
            Todos
          </button>
          {specialists.map((sp) => (
            <button
              key={sp.specialist_id}
              onClick={() =>
                setFilterSpecialist(
                  filterSpecialist === sp.specialist_id ? null : sp.specialist_id
                )
              }
              className={cn(
                "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                filterSpecialist === sp.specialist_id
                  ? "bg-[var(--brand-primary)] text-white"
                  : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
              )}
            >
              {sp.specialist_avatar ? (
                <Image
                  src={sp.specialist_avatar}
                  alt={sp.specialist_name}
                  width={16}
                  height={16}
                  className="rounded-full"
                />
              ) : (
                <User size={11} />
              )}
              {sp.specialist_name}
            </button>
          ))}
        </div>
      )}

      {/* Grilla de horas */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {uniqueTimes.map((time) => {
          // Para cada hora, tomar el primer slot disponible (si hay varios especialistas a la misma hora)
          const slot = visible.find((s) => s.time === time)!;
          const isSelected =
            selectedSlot?.time === time &&
            selectedSlot?.specialist_id === slot.specialist_id;

          return (
            <button
              key={`${time}-${slot.specialist_id}`}
              id={`slot-${time}-${slot.specialist_id}`}
              onClick={() => onSelect(slot)}
              aria-pressed={isSelected}
              className={cn(
                "rounded-xl border px-3 py-3 text-center transition-all duration-150",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                isSelected
                  ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                  : "border-[var(--brand-border)] bg-[var(--brand-surface)] hover:border-[var(--brand-primary)]/50"
              )}
            >
              <p
                className="text-sm font-bold"
                style={{ color: isSelected ? "white" : "var(--brand-text)" }}
              >
                {time}
              </p>
              <p
                className="mt-0.5 truncate text-xs"
                style={{
                  color: isSelected ? "rgba(255,255,255,0.75)" : "var(--brand-text)",
                  opacity: isSelected ? 1 : 0.5,
                }}
              >
                {slot.specialist_name.split(" ")[0]}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
