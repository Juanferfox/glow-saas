"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface PWAState {
  /** true si la app ya está instalada (standalone mode) */
  isInstalled: boolean;
  /** true si el browser soporta la instalación y aún no está instalada */
  canInstall: boolean;
  /** Llama a este método para mostrar el prompt nativo de instalación */
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
}

/**
 * Hook para gestionar el estado de instalación de la PWA.
 *
 * Captura el evento `beforeinstallprompt` del browser y expone
 * una función para disparar el prompt de instalación nativo.
 *
 * @example
 * const { canInstall, isInstalled, promptInstall } = usePWA();
 * if (canInstall && !isInstalled) return <InstallBanner onInstall={promptInstall} />;
 */
export function usePWA(): PWAState {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar modo standalone (ya instalada)
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(mq.matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsInstalled(e.matches);
    };
    mq.addEventListener("change", handleDisplayModeChange);

    // Capturar el prompt de instalación
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Limpiar cuando se instala
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mq.removeEventListener("change", handleDisplayModeChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  async function promptInstall(): Promise<"accepted" | "dismissed" | null> {
    if (!deferredPrompt) return null;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome;
  }

  return {
    isInstalled,
    canInstall: !!deferredPrompt && !isInstalled,
    promptInstall,
  };
}
