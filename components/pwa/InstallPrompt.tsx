"use client";

import { useState } from "react";
import { X, Download, Smartphone } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useTenant } from "@/hooks/useTenant";
import { cn } from "@/lib/utils";

/**
 * Banner de instalación PWA.
 *
 * - Se muestra automáticamente si el browser soporta la instalación
 *   y la app NO está instalada aún.
 * - El usuario puede descartarlo (se guarda en sessionStorage para no molestar).
 * - Al hacer click en "Instalar" dispara el prompt nativo del browser.
 *
 * Posicionado encima del BottomNav en móvil.
 */
export function InstallPrompt() {
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const tenant = useTenant();
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("pwa-prompt-dismissed") === "1";
  });

  // No mostrar si no hay condiciones
  if (!canInstall || isInstalled || dismissed) return null;

  async function handleInstall() {
    const outcome = await promptInstall();
    if (outcome === "accepted" || outcome === "dismissed") {
      setDismissed(true);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("pwa-prompt-dismissed", "1");
    setDismissed(true);
  }

  return (
    <div
      role="banner"
      aria-label="Instalar aplicación"
      className={cn(
        "fixed bottom-20 left-4 right-4 z-40 lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm",
        "rounded-2xl border border-[var(--brand-border)]",
        "bg-[var(--brand-surface)]/95 backdrop-blur-md shadow-lg",
        "p-4 flex items-center gap-3",
        "animate-in slide-in-from-bottom-4 duration-300"
      )}
    >
      {/* Ícono */}
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        <Smartphone size={22} className="text-white" />
      </div>

      {/* Texto */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--brand-text)] leading-tight">
          {tenant?.name ?? "SPA"}
        </p>
        <p className="text-xs text-[var(--brand-text)] opacity-60 mt-0.5">
          Agrega la app a tu pantalla de inicio
        </p>
      </div>

      {/* Botón instalar */}
      <button
        id="pwa-install-btn"
        onClick={handleInstall}
        className={cn(
          "flex items-center gap-1.5 shrink-0 rounded-full px-3.5 py-2",
          "text-xs font-semibold text-white transition-opacity hover:opacity-90",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        )}
        style={{ backgroundColor: "var(--brand-primary)" }}
      >
        <Download size={13} strokeWidth={2.5} />
        Instalar
      </button>

      {/* Botón cerrar */}
      <button
        id="pwa-dismiss-btn"
        onClick={handleDismiss}
        aria-label="Cerrar"
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          "text-[var(--brand-text)] opacity-40 hover:opacity-70 transition-opacity",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]"
        )}
      >
        <X size={14} strokeWidth={2.5} />
      </button>
    </div>
  );
}
