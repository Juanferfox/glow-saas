import "server-only";
import { cookies } from "next/headers";

export const DEV_MOCK_USER = {
  id: "dev-client-001",
  aud: "authenticated",
  role: "authenticated",
  email: "cliente@fmglow.test",
  email_confirmed_at: "2026-01-01T00:00:00Z",
  phone: "",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  user_metadata: { full_name: "Cliente de Prueba", avatar_url: null },
  app_metadata: {},
  identities: [],
} as const;

// Proxy que hace que cualquier cadena de query devuelva datos vacíos
// en lugar de crashear cuando se llama .from() en dev mode.
function makeNoopQuery(): unknown {
  const handler: ProxyHandler<object> = {
    get(_t, prop) {
      if (prop === "then") {
        return (resolve: (v: unknown) => unknown) =>
          resolve({ data: [], error: null });
      }
      // single() devuelve null en lugar del array vacío
      if (prop === "single") {
        return () => Promise.resolve({ data: null, error: { message: "dev mode" } });
      }
      return () => new Proxy({}, handler);
    },
  };
  return new Proxy({}, handler);
}

/**
 * Cliente Supabase simulado para desarrollo sin credenciales reales.
 * Lee la cookie "dev-session" para saber si hay un usuario autenticado.
 */
export async function createDevServerClient() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get("dev-session")?.value === "1";
  const user = hasSession ? DEV_MOCK_USER : null;

  return {
    auth: {
      getUser: async () => ({ data: { user }, error: null }),
      signOut:  async () => ({ error: null }),
    },
    from: (_table: string) => makeNoopQuery(),
  };
}
