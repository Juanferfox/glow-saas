"use client";

import { useState, useRef } from "react";
import { Calendar, Clock, User, MessageSquare, CheckCircle2, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { ServiceRow } from "@/lib/data/services";
import type { AvailableSlot } from "@/lib/supabase/types";
import type { Tenant } from "@/lib/supabase/types";

interface BookingConfirmationProps {
  tenant: Tenant;
  locale: string;
  service: ServiceRow;
  date: string;        // "YYYY-MM-DD"
  slot: AvailableSlot;
  onConfirm: (notes: string, referralCode: string) => Promise<void>;
  onBack: () => void;
}

function formatDate(date: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

/**
 * Paso 4 del flujo de agendamiento.
 * Resumen completo antes de confirmar: servicio, fecha, hora, especialista y campo de notas.
 */
export function BookingConfirmation({
  tenant,
  locale,
  service,
  date,
  slot,
  onConfirm,
  onBack,
}: BookingConfirmationProps) {
  const [notes, setNotes] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralValid, setReferralValid] = useState<boolean | null>(null);
  const [referralName, setReferralName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const serviceName = getTenantText(service.name, locale, tenant.default_locale);

  async function handleReferralCheck(code: string) {
    setReferralCode(code);
    if (!code) {
      setReferralValid(null);
      setReferralName(null);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/referral/validate?tenant=${tenant.slug}&code=${encodeURIComponent(code)}`);
        const data = await res.json();
        setReferralValid(data.valid);
        setReferralName(data.referrerName ?? null);
      } catch {
        setReferralValid(false);
        setReferralName(null);
      }
    }, 400);
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm(notes, referralCode);
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al confirmar la cita");
    } finally {
      setLoading(false);
    }
  }

  if (confirmed) {
    return (
      <div className="flex flex-col items-center gap-6 py-10 text-center">
        <CheckCircle2
          size={56}
          className="text-green-500"
          strokeWidth={1.5}
        />
        <div>
          <h3
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
          >
            ¡Cita confirmada!
          </h3>
          <p className="mt-2 text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
            Recibirás un recordatorio 24h antes de tu cita.
          </p>
        </div>
        <div
          className="w-full rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 text-left space-y-2"
        >
          <SummaryRow icon={<Calendar size={14} />} label="Fecha" value={formatDate(date, locale)} />
          <SummaryRow icon={<Clock size={14} />}    label="Hora"  value={slot.time} />
          <SummaryRow icon={<User size={14} />}     label="Con"   value={slot.specialist_name} />
        </div>
        <p className="text-xs opacity-40" style={{ color: "var(--brand-text)" }}>
          Ganarás {tenant.points_per_service} puntos al completar este servicio.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Resumen */}
      <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 space-y-3">
        <h3
          className="text-xs font-bold uppercase tracking-widest opacity-45"
          style={{ color: "var(--brand-text)" }}
        >
          Resumen de tu cita
        </h3>
        <SummaryRow
          icon={<span className="text-base">✨</span>}
          label="Servicio"
          value={serviceName}
          sub={formatCurrency(
            service.price,
            `${locale}-${tenant.currency === "COP" ? "CO" : "US"}`,
            tenant.currency
          )}
        />
        <SummaryRow
          icon={<Calendar size={14} />}
          label="Fecha"
          value={formatDate(date, locale)}
        />
        <SummaryRow
          icon={<Clock size={14} />}
          label="Hora"
          value={`${slot.time} · ${service.duration_min} min`}
        />
        <SummaryRow
          icon={<User size={14} />}
          label="Especialista"
          value={slot.specialist_name}
        />
      </div>

      {/* Puntos que ganará */}
      <div
        className="flex items-center gap-2 rounded-xl px-3 py-2"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
        }}
      >
        <span className="text-sm">⭐</span>
        <p className="text-xs" style={{ color: "var(--brand-primary)" }}>
          Ganarás <strong>{tenant.points_per_service} puntos</strong> al completar este servicio
        </p>
      </div>

      {/* Notas opcionales */}
      <div className="space-y-1.5">
        <label
          htmlFor="booking-notes"
          className="flex items-center gap-1.5 text-xs font-semibold"
          style={{ color: "var(--brand-text)", opacity: 0.6 }}
        >
          <MessageSquare size={12} />
          Notas opcionales
        </label>
        <textarea
          id="booking-notes"
          rows={3}
          placeholder="Ej. alergia a ciertos productos, preferencias especiales…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={cn(
            "w-full resize-none rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)]",
            "px-3 py-2.5 text-sm text-[var(--brand-text)] placeholder:opacity-35",
            "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          )}
        />
      </div>

      {/* Código de referido */}
      {tenant.feature_referrals && (
        <div className="space-y-1.5">
          <label
            htmlFor="booking-referral"
            className="flex items-center gap-1.5 text-xs font-semibold"
            style={{ color: "var(--brand-text)", opacity: 0.6 }}
          >
            <User size={12} />
            Código de referido (opcional)
          </label>
          <input
            id="booking-referral"
            type="text"
            placeholder="Ej. FMCLI001"
            value={referralCode}
            onChange={(e) => handleReferralCheck(e.target.value)}
            className={cn(
              "w-full rounded-xl border px-3 py-2.5 text-sm",
              "bg-[var(--brand-surface)] text-[var(--brand-text)] placeholder:opacity-35",
              "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]",
              referralValid
                ? "border-green-500/50"
                : referralValid === false
                  ? "border-red-500/50"
                  : "border-[var(--brand-border)]"
            )}
          />
          {referralValid && (
            <p className="text-xs text-green-600">
              Código válido{referralName ? ` — ${referralName}` : ""}. {referralName ? "Recibirá" : "El cliente que te refirió recibirá"} {tenant.referral_bonus_pts} puntos.
            </p>
          )}
          {referralValid === false && (
            <p className="text-xs text-red-400">
              Código no válido. Verifica con quien te refirió.
            </p>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* Botones */}
      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button
          id="booking-confirm-btn"
          onClick={handleConfirm}
          disabled={loading}
          className={cn(
            "flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white",
            "transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
            "disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
          )}
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : "Confirmar cita"}
        </button>

        <button
          onClick={onBack}
          disabled={loading}
          className={cn(
            "rounded-full border border-[var(--brand-border)] px-6 py-3 text-sm font-medium",
            "text-[var(--brand-text)] opacity-60 transition-opacity hover:opacity-100",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
          )}
        >
          Volver
        </button>
      </div>
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 shrink-0 opacity-40" style={{ color: "var(--brand-text)" }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs opacity-45" style={{ color: "var(--brand-text)" }}>
          {label}
        </p>
        <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
          {value}
        </p>
      </div>
      {sub && (
        <span className="shrink-0 text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
          {sub}
        </span>
      )}
    </div>
  );
}
