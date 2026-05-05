"use client";

import { useState, useCallback, useEffect } from "react";
import { ServiceSelector } from "@/components/booking/ServiceSelector";
import { CalendarPicker } from "@/components/booking/CalendarPicker";
import { TimeSlotGrid } from "@/components/booking/TimeSlotGrid";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { cn } from "@/lib/utils";
import type { ServiceRow } from "@/lib/data/services";
import type { Tenant, AvailableSlot } from "@/lib/supabase/types";

interface BookingWizardProps {
  tenant: Tenant;
  locale: string;
  services: ServiceRow[];
}

type Step = "service" | "date" | "slot" | "confirm";

const STEPS: { id: Step; label: string }[] = [
  { id: "service", label: "Servicio" },
  { id: "date",    label: "Fecha" },
  { id: "slot",    label: "Hora" },
  { id: "confirm", label: "confirmar" },
];

export function BookingWizard({ tenant, locale, services }: BookingWizardProps) {
  const [step, setStep] = useState<Step>("service");
  
  // Selección del usuario
  const [selectedService, setSelectedService] = useState<ServiceRow | null>(null);
  const [selectedDate,    setSelectedDate]    = useState<string | null>(null);
  const [selectedSlot,    setSelectedSlot]    = useState<AvailableSlot | null>(null);

  // Disponibilidad de fechas por mes
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [loadingDates, setLoadingDates] = useState(false);

  const loadAvailableDates = useCallback(async (serviceId: string, year: number, month: number) => {
    const monthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
    setLoadingDates(true);
    try {
      const res = await fetch(`/api/availability/dates?tenant=${tenant.slug}&service=${serviceId}&month=${monthStr}`);
      const data = await res.json();
      setAvailableDates(data.dates ?? []);
    } catch {
      setAvailableDates([]);
    } finally {
      setLoadingDates(false);
    }
  }, [tenant.slug]);

  // Navegación
  function handleServiceSelect(service: ServiceRow) {
    setSelectedService(service);
    const now = new Date();
    loadAvailableDates(service.id, now.getFullYear(), now.getMonth());
    setStep("date");
  }

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    setSelectedSlot(null);
    setStep("slot");
  }

  function handleSlotSelect(slot: AvailableSlot) {
    setSelectedSlot(slot);
    setStep("confirm");
  }

  async function handleConfirm(notes: string, referralCode: string) {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    const response = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantSlug: tenant.slug,
        serviceId: selectedService.id,
        specialistId: selectedSlot.specialist_id,
        date: selectedDate,
        time: selectedSlot.time,
        notes,
        referralCode,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error al crear la reserva");
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg">
      {/* Indicador de pasos */}
      <div className="mb-8 flex items-center justify-between px-2">
        {STEPS.map((s, idx) => {
          const isCompleted = STEPS.findIndex(x => x.id === step) > idx;
          const isActive    = s.id === step;
          
          return (
            <div key={s.id} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-colors",
                  isCompleted || isActive
                    ? "bg-[var(--brand-primary)] text-white"
                    : "bg-[var(--brand-border)] text-[var(--brand-text)] opacity-40"
                )}
              >
                {isCompleted ? "✓" : idx + 1}
              </div>
              <span
                className={cn(
                  "hidden text-xs font-semibold capitalize sm:block",
                  isActive ? "text-[var(--brand-text)]" : "text-[var(--brand-text)] opacity-40"
                )}
              >
                {s.label}
              </span>
              {idx < STEPS.length - 1 && (
                <div className="ml-2 h-[1px] w-4 bg-[var(--brand-border)] sm:w-8" />
              )}
            </div>
          );
        })}
      </div>

      {/* Título dinámico por paso */}
      <div className="mb-6">
        <h2
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          {step === "service" && "Selecciona un servicio"}
          {step === "date"    && "Escoge una fecha"}
          {step === "slot"    && "Elige el mejor horario"}
          {step === "confirm" && "Confirma tu cita"}
        </h2>
        <p className="mt-1 text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
          {step === "service" && "Contamos con los mejores especialistas para ti."}
          {step === "date"    && "Disponibilidad garantizada en los próximos 60 días."}
          {step === "slot"    && `Horarios disponibles para ${selectedDate}.`}
          {step === "confirm" && "Verifica que todos los datos sean correctos."}
        </p>
      </div>

      {/* Contenido del paso */}
      <div className="min-h-[400px]">
        {step === "service" && (
          <ServiceSelector
            services={services}
            tenant={tenant}
            locale={locale}
            selectedId={selectedService?.id ?? null}
            onSelect={handleServiceSelect}
          />
        )}

        {step === "date" && (
          <div className="space-y-6">
            <CalendarPicker
              selectedDate={selectedDate}
              onSelect={handleDateSelect}
              timezone={tenant.timezone}
              availableDates={availableDates}
              loadingDates={loadingDates}
              onViewChange={(year, month) => {
                if (selectedService) loadAvailableDates(selectedService.id, year, month);
              }}
            />
            <button
              onClick={() => setStep("service")}
              className="text-xs font-medium opacity-50 hover:opacity-100"
              style={{ color: "var(--brand-text)" }}
            >
              ← Volver a servicios
            </button>
          </div>
        )}

        {step === "slot" && selectedService && selectedDate && (
          <div className="space-y-6">
            <TimeSlotGrid
              tenantSlug={tenant.slug}
              serviceId={selectedService.id}
              date={selectedDate}
              selectedSlot={selectedSlot}
              onSelect={handleSlotSelect}
            />
            <button
              onClick={() => setStep("date")}
              className="text-xs font-medium opacity-50 hover:opacity-100"
              style={{ color: "var(--brand-text)" }}
            >
              ← Cambiar fecha
            </button>
          </div>
        )}

        {step === "confirm" && selectedService && selectedDate && selectedSlot && (
          <BookingConfirmation
            tenant={tenant}
            locale={locale}
            service={selectedService}
            date={selectedDate}
            slot={selectedSlot}
            onConfirm={handleConfirm}
            onBack={() => setStep("slot")}
          />
        )}
      </div>
    </div>
  );
}
