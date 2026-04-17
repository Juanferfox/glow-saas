"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, AlertTriangle, Loader2 } from "lucide-react";

interface CancelButtonProps {
  appointmentId: string;
  tenantSlug: string;
  scheduledAt: string;
  cancellationPenalty: number;
  locale: string;
}

/**
 * Botón de cancelación con diálogo de confirmación inline.
 * Muestra advertencia si la cita es en menos de 24h (penalidad de puntos).
 */
export function CancelButton({
  appointmentId,
  tenantSlug,
  scheduledAt,
  cancellationPenalty,
  locale,
}: CancelButtonProps) {
  const router = useRouter();
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const hoursUntil = (new Date(scheduledAt).getTime() - Date.now()) / 3_600_000;
  const isLate     = hoursUntil < 24 && hoursUntil > 0;

  async function handleCancel() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/booking/${appointmentId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantSlug }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Error al cancelar");
      }
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cancelar");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-medium text-red-500 opacity-70 hover:opacity-100 transition-opacity"
      >
        <X size={12} />
        Cancelar cita
      </button>
    );
  }

  return (
    <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-950/30">
      {isLate && (
        <div className="mb-3 flex items-start gap-2 text-amber-700 dark:text-amber-400">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-snug">
            Esta cita es en menos de 24 horas. Se descontarán{" "}
            <strong>{cancellationPenalty} puntos</strong> de tu saldo.
          </p>
        </div>
      )}

      <p className="mb-3 text-xs font-medium text-red-700 dark:text-red-400">
        ¿Confirmas que deseas cancelar esta cita?
      </p>

      {error && (
        <p className="mb-2 text-xs text-red-600">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
        >
          {loading && <Loader2 size={11} className="animate-spin" />}
          Sí, cancelar
        </button>
        <button
          onClick={() => setOpen(false)}
          disabled={loading}
          className="rounded-lg px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors"
        >
          Volver
        </button>
      </div>
    </div>
  );
}
