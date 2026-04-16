"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/supabase/types";

interface LoginFormProps {
  locale: string;
  tenant: Tenant | null;
  errorCode?: string;
  next?: string;
}

const ERROR_MESSAGES: Record<string, string> = {
  auth_callback_error: "Ocurrió un error al iniciar sesión. Intenta de nuevo.",
  access_denied: "Acceso denegado. Cierra sesión en Google e inténtalo de nuevo.",
};

/**
 * Formulario de login con OAuth.
 * Soporta Google y Facebook (los que estén habilitados en Supabase).
 */
export function LoginForm({ locale, tenant, errorCode, next }: LoginFormProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const supabase = createClient();

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
      : `/${locale}/auth/callback`;

  async function handleOAuth(provider: "google" | "facebook") {
    setLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: {
          // Pasar el tenant_slug para el trigger de creación de profile
          ...(tenant && { tenant_slug: tenant.slug }),
        },
      },
    });
    if (error) setLoading(null);
  }

  const errorMessage = errorCode ? ERROR_MESSAGES[errorCode] ?? "Error al iniciar sesión." : null;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl border border-[var(--brand-border)]",
          "bg-[var(--brand-surface)] p-8 shadow-xl"
        )}
      >
        {/* Logo / nombre del tenant */}
        <div className="mb-8 text-center">
          <h1
            className="text-2xl font-bold text-[var(--brand-text)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {tenant?.name ?? "SPA"}
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-text)] opacity-60">
            Inicia sesión para agendar citas y acumular puntos
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <div className="mb-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        )}

        {/* Botones OAuth */}
        <div className="space-y-3">
          {/* Google */}
          <button
            id="login-google-btn"
            onClick={() => handleOAuth("google")}
            disabled={!!loading}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--brand-border)]",
              "bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm",
              "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            )}
          >
            {loading === "google" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            ) : (
              <GoogleIcon />
            )}
            Continuar con Google
          </button>

          {/* Facebook */}
          <button
            id="login-facebook-btn"
            onClick={() => handleOAuth("facebook")}
            disabled={!!loading}
            className={cn(
              "flex w-full items-center justify-center gap-3 rounded-xl",
              "bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white shadow-sm",
              "transition-all duration-200 hover:bg-[#166FE5] hover:shadow-md hover:-translate-y-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1877F2]/50",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
            )}
          >
            {loading === "facebook" ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-white" />
            ) : (
              <FacebookIcon />
            )}
            Continuar con Facebook
          </button>
        </div>

        {/* Nota de privacidad */}
        <p className="mt-6 text-center text-xs text-[var(--brand-text)] opacity-40 leading-relaxed">
          Al continuar aceptas que guardemos tu nombre y correo para gestionar tus citas.
          No compartimos tu información con terceros.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
      <path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z"/>
      <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z"/>
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  );
}
