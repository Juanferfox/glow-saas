"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/supabase/types";
import type { DevProfile } from "@/app/api/dev-auth/route";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  /** Perfil simplificado en dev mode (incluye role, points, etc.) */
  devProfile: DevProfile | null;
}

const IS_DEV =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

/** Lee la cookie dev-session del documento (solo client-side) */
function readDevSession(): DevProfile | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("dev-session="));
  if (!match) return null;
  try {
    const raw = decodeURIComponent(match.split("=").slice(1).join("="));
    // retrocompatibilidad: cookie era "1"
    if (raw === "1") return null;
    return JSON.parse(raw) as DevProfile;
  } catch {
    return null;
  }
}

/**
 * Hook para leer el estado de autenticación del usuario actual.
 *
 * - En dev mode (sin Supabase real) lee la cookie `dev-session`.
 * - En producción usa Supabase Auth.
 *
 * Retorna:
 * - `user`       → objeto User de Supabase (null en dev mode)
 * - `profile`    → perfil del tenant desde la tabla `profiles`
 * - `devProfile` → perfil simplificado en dev mode (incluye role, points, referral_code…)
 * - `loading`    → true mientras se verifica la sesión
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    devProfile: null,
    loading: true,
  });

  useEffect(() => {
    if (IS_DEV) {
      // Dev mode: leer cookie dev-session
      const devProfile = readDevSession();
      setState({ user: null, profile: null, devProfile, loading: false });
      return;
    }

    // Producción: usar Supabase Auth
    async function initSupabase() {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      setState((prev) => ({ ...prev, user, loading: false }));

      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, session) => {
          setState((prev) => ({
            ...prev,
            user: session?.user ?? null,
            loading: false,
          }));
        }
      );

      return () => subscription.unsubscribe();
    }

    initSupabase();
  }, []);

  return state;
}
