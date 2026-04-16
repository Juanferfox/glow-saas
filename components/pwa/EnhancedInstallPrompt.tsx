"use client";

import { useState, useEffect } from "react";
import { Share, PlusSquare, X, Smartphone, Download } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Componente de instalación PWA mejorado.
 * Detecta si el usuario está en iOS o Android y muestra instrucciones personalizadas.
 */
export function EnhancedInstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // 1. Verificar si ya está instalada la PWA
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches || 
      ("standalone" in window.navigator && (window.navigator as Navigator & { standalone: boolean }).standalone) || 
      document.referrer.includes("android-app://");

    if (isStandalone) return;

    // 2. Mostrar después de un delay ligero (5s) para no ser intrusivo al inicio
    const timer = setTimeout(() => {
      // Detectar plataforma de forma asíncrona dentro del timer para evitar cascading renders
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setPlatform("ios");
      } else if (/android/.test(ua)) {
        setPlatform("android");
      }

      const dismissed = localStorage.getItem("pwa-prompt-dismissed");
      if (!dismissed) setShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[100] sm:bottom-6 sm:right-6 sm:left-auto sm:w-80">
      <div className="relative overflow-hidden rounded-[2rem] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl backdrop-blur-xl">
        <button 
          onClick={dismiss}
          className="absolute right-4 top-4 opacity-40 hover:opacity-100"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20">
            <Smartphone size={24} />
          </div>
          <div>
            <h4 className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Instala nuestra App</h4>
            <p className="text-[10px] opacity-50" style={{ color: "var(--brand-text)" }}>Acceso rápido y notificaciones</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {platform === "ios" ? (
            <div className="space-y-3 rounded-2xl bg-zinc-500/5 p-4 text-[11px] leading-relaxed">
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">1</div>
                <p>Toca el botón <strong>Compartir</strong> <Share size={14} className="inline mx-1 text-blue-500" /> abajo.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/10">2</div>
                <p>Desliza hacia abajo y elige <strong>Añadir a pantalla de inicio</strong> <PlusSquare size={14} className="inline mx-1" />.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[11px] opacity-60">Instala la aplicación en tu pantalla de inicio para una experiencia completa sin distracciones.</p>
              <button 
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-primary)] py-3 text-xs font-bold text-white shadow-lg transition-transform active:scale-95"
              >
                <Download size={14} />
                Instalar ahora
              </button>
            </div>
          )}
        </div>

        {/* Círculo decorativo */}
        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-[var(--brand-primary)]/10 blur-2xl" />
      </div>
    </div>
  );
}
