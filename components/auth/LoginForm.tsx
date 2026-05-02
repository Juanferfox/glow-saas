"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  invalid_credentials: "Correo o contraseña incorrectos.",
  email_not_confirmed: "Confirma tu correo antes de iniciar sesión.",
};

const HAS_SUPABASE =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

type Mode = "login" | "register";

export function LoginForm({ locale, tenant, errorCode, next }: LoginFormProps) {
  const router = useRouter();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [devLoading, setDevLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const supabase = HAS_SUPABASE ? createClient() : null;

  const redirectTo =
    typeof window !== "undefined"
      ? `${window.location.origin}/${locale}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}`
      : `/${locale}/auth/callback`;

  const destination = next ?? `/${locale}`;

  async function handleOAuth(provider: "google" | "facebook") {
    if (!supabase) return;
    setOauthLoading(provider);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        queryParams: tenant ? { tenant_slug: tenant.slug } : {},
      },
    });
    if (error) setOauthLoading(null);
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    setFormError(null);
    setSuccessMsg(null);
    setEmailLoading(true);

    if (mode === "register") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name },
          emailRedirectTo: redirectTo,
        },
      });
      if (error) {
        setFormError(ERROR_MESSAGES[error.message] ?? error.message);
      } else {
        setSuccessMsg("Revisa tu correo para confirmar tu cuenta.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setFormError(ERROR_MESSAGES["invalid_credentials"]);
      } else {
        router.push(destination);
        router.refresh();
      }
    }
    setEmailLoading(false);
  }

  async function handleDevLogin() {
    setDevLoading(true);
    await fetch("/api/dev-auth", { method: "POST" });
    const dest = next
      ? next
      : `/${locale}${tenant ? `?tenant=${tenant.slug}` : ""}`;
    router.push(dest);
    router.refresh();
  }

  const errorMessage = formError ?? (errorCode ? (ERROR_MESSAGES[errorCode] ?? "Error al iniciar sesión.") : null);

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div
        className={cn(
          "w-full max-w-sm rounded-2xl border border-[var(--brand-border)]",
          "bg-[var(--brand-surface)] p-8 shadow-xl"
        )}
      >
        {/* Encabezado */}
        <div className="mb-6 text-center">
          <h1
            className="text-2xl font-bold text-[var(--brand-text)]"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {tenant?.name ?? "SPA"}
          </h1>
          <p className="mt-2 text-sm text-[var(--brand-text)] opacity-60">
            {mode === "login"
              ? "Inicia sesión para agendar citas y acumular puntos"
              : "Crea tu cuenta y empieza a disfrutar nuestros servicios"}
          </p>
        </div>

        {/* Error / éxito */}
        {errorMessage && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3">
            <p className="text-sm text-green-600">{successMsg}</p>
          </div>
        )}

        {/* ── DEV MODE ── */}
        {!HAS_SUPABASE && (
          <div className="space-y-4">
            <div className="rounded-xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-3 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--brand-primary)] opacity-70">
                Modo desarrollo
              </p>
              <p className="mt-1 text-xs text-[var(--brand-text)] opacity-50">
                Supabase no está configurado. Usa la sesión de prueba.
              </p>
            </div>

            <button
              onClick={handleDevLogin}
              disabled={devLoading}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white shadow",
                "transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
              )}
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              {devLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                "✦ Entrar como cliente de prueba"
              )}
            </button>
          </div>
        )}

        {/* ── PRODUCCIÓN: email/password + OAuth ── */}
        {HAS_SUPABASE && (
          <>
            {/* Tabs login / register */}
            <div className="mb-5 flex rounded-xl border border-[var(--brand-border)] p-1">
              {(["login", "register"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setFormError(null); setSuccessMsg(null); }}
                  className={cn(
                    "flex-1 rounded-lg py-2 text-sm font-semibold transition-all duration-150",
                    mode === m
                      ? "bg-[var(--brand-primary)] text-white shadow-sm"
                      : "text-[var(--brand-text)] opacity-50 hover:opacity-80"
                  )}
                >
                  {m === "login" ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              ))}
            </div>

            {/* Formulario email/password */}
            <form onSubmit={handleEmail} className="space-y-3">
              {mode === "register" && (
                <input
                  type="text"
                  placeholder="Nombre completo"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className={cn(
                    "w-full rounded-xl border border-[var(--brand-border)] px-4 py-3 text-sm",
                    "bg-[var(--brand-bg)] text-[var(--brand-text)] placeholder:opacity-40",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  )}
                />
              )}
              <input
                type="email"
                placeholder="Correo electrónico"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={cn(
                  "w-full rounded-xl border border-[var(--brand-border)] px-4 py-3 text-sm",
                  "bg-[var(--brand-bg)] text-[var(--brand-text)] placeholder:opacity-40",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                )}
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                className={cn(
                  "w-full rounded-xl border border-[var(--brand-border)] px-4 py-3 text-sm",
                  "bg-[var(--brand-bg)] text-[var(--brand-text)] placeholder:opacity-40",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                )}
              />
              <button
                type="submit"
                disabled={emailLoading}
                className={cn(
                  "w-full rounded-xl py-3 text-sm font-semibold text-white shadow",
                  "transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                )}
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                {emailLoading
                  ? <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
              </button>
            </form>

            {/* Divisor */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-[var(--brand-border)]" />
              <span className="text-xs text-[var(--brand-text)] opacity-30">o continúa con</span>
              <div className="h-px flex-1 bg-[var(--brand-border)]" />
            </div>

            {/* OAuth */}
            <div className="space-y-3">
              <button
                id="login-google-btn"
                onClick={() => handleOAuth("google")}
                disabled={!!oauthLoading}
                className={cn(
                  "flex w-full items-center justify-center gap-3 rounded-xl border border-[var(--brand-border)]",
                  "bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm",
                  "transition-all duration-200 hover:shadow-md hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                )}
              >
                {oauthLoading === "google"
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  : <GoogleIcon />}
                Continuar con Google
              </button>

              <button
                id="login-facebook-btn"
                onClick={() => handleOAuth("facebook")}
                disabled={!!oauthLoading}
                className={cn(
                  "flex w-full items-center justify-center gap-3 rounded-xl",
                  "bg-[#1877F2] px-4 py-3 text-sm font-semibold text-white shadow-sm",
                  "transition-all duration-200 hover:bg-[#166FE5] hover:shadow-md hover:-translate-y-0.5",
                  "disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-y-0"
                )}
              >
                {oauthLoading === "facebook"
                  ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-white" />
                  : <FacebookIcon />}
                Continuar con Facebook
              </button>
            </div>
          </>
        )}

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
