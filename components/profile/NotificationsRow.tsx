"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Toggle de notificaciones push (Web Push API).
 * Solicita permiso al navegador si no ha sido otorgado/denegado.
 * En SSR / entornos sin soporte devuelve null.
 */
export function NotificationsRow() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "default"
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
    } else {
      setPermission(Notification.permission);
    }
  }, []);

  if (permission === "unsupported") return null;

  const enabled = permission === "granted";
  const denied = permission === "denied";

  async function handleToggle() {
    if (denied) return; // No se puede revertir desde JS; el usuario debe hacerlo en config del navegador
    if (enabled) {
      // Notificar al usuario que debe revocar desde la config del navegador
      return;
    }

    setLoading(true);
    const result = await Notification.requestPermission();
    setPermission(result);
    setLoading(false);
  }

  return (
    <div className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
      <div>
        <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
          Notificaciones
        </p>
        <p
          className="text-xs"
          style={{ color: "var(--brand-text)", opacity: 0.5 }}
        >
          {denied
            ? "Bloqueadas en la configuración del navegador"
            : enabled
            ? "Activadas — recibirás recordatorios de citas"
            : "Actívalas para recibir recordatorios de citas"}
        </p>
      </div>

      <button
        id="notifications-toggle"
        onClick={handleToggle}
        disabled={loading || denied}
        aria-pressed={enabled}
        aria-label={enabled ? "Desactivar notificaciones" : "Activar notificaciones"}
        className={cn(
          "relative flex h-7 w-12 items-center rounded-full transition-colors duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
          "disabled:cursor-not-allowed disabled:opacity-50",
          enabled
            ? "bg-[var(--brand-primary)]"
            : "bg-[var(--brand-border)]"
        )}
      >
        <span
          className={cn(
            "absolute flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm",
            "transition-transform duration-200",
            enabled ? "translate-x-6" : "translate-x-1"
          )}
        >
          {loading ? (
            <span className="h-3 w-3 animate-spin rounded-full border border-zinc-300 border-t-zinc-600" />
          ) : enabled ? (
            <Bell size={10} className="text-[var(--brand-primary)]" />
          ) : (
            <BellOff size={10} className="text-zinc-400" />
          )}
        </span>
      </button>
    </div>
  );
}
