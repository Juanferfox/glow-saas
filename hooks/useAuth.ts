"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/supabase/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
}

/**
 * Hook para leer el estado de autenticación del usuario actual.
 *
 * - `user`: el usuario de Supabase Auth (null si no está autenticado)
 * - `profile`: el perfil del tenant (null si no está autenticado)
 * - `loading`: true mientras se verifica la sesión
 *
 * El flujo de login (OAuth) se implementa en Sprint 2.
 *
 * @example
 * const { user, profile, loading } = useAuth();
 * if (loading) return <Spinner />;
 * if (!user) return <LoginButton />;
 */
export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = createClient();

    // Leer sesión actual
    supabase.auth.getUser().then(({ data: { user } }) => {
      setState((prev) => ({ ...prev, user, loading: false }));
    });

    // Escuchar cambios de sesión (login / logout)
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
  }, []);

  return state;
}
