import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";
import { getTenantSlug } from "./lib/utils";

// Middleware de internacionalización de next-intl
const intlMiddleware = createMiddleware(routing);

/**
 * Rutas que requieren sesión activa.
 */
const PROTECTED_SEGMENTS = [
  "perfil",
  "puntos",
  "admin",
];

/**
 * Proxy principal de spa-saas (Next.js 16 Middleware).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // 1. Detectar tenant desde subdominio o cookies (usando la utilidad refinada)
  // Intentar primero de query param (solo para dev facilitado)
  const url = new URL(request.url);
  const tenantSlug = url.searchParams.get("tenant") || getTenantSlug(hostname);

  // 2. Rutas estáticas e internas: pasar directo
  const isExcluded =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/tenants") ||
    (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev"));

  if (isExcluded) {
    return NextResponse.next();
  }

  // 3. Refrescar sesión de Supabase (solo si está configurado)
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  const { supabaseResponse, user } = hasSupabase
    ? await updateSession(request)
    : { supabaseResponse: NextResponse.next({ request }), user: null };

  // 4. Protección de rutas autenticadas
  if (hasSupabase && !user) {
    const parts = pathname.split("/");
    const segment = parts[2]; // índice 2 = primer segmento tras el locale

    if (segment && PROTECTED_SEGMENTS.includes(segment)) {
      const locale = parts[1] ?? "es";
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      // Mantener el tenant slug en el redirect si estamos en localhost
      if (tenantSlug) loginUrl.searchParams.set("tenant", tenantSlug);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 5. Procesar i18n con next-intl
  const intlResponse = intlMiddleware(request);

  // 6. Construir respuesta final
  const finalResponse = intlResponse ?? supabaseResponse ?? NextResponse.next();

  // Inyectar tenant slug en headers para Server Components
  if (tenantSlug) {
    finalResponse.headers.set("x-tenant-slug", tenantSlug);
  }
  finalResponse.headers.set("x-hostname", hostname);

  // Propagar cookies de Supabase
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    try {
      finalResponse.cookies.set(
        cookie.name,
        cookie.value,
        cookie as Parameters<typeof finalResponse.cookies.set>[2]
      );
    } catch {
      // Ignorar errores de cookies duplicadas
    }
  });

  return finalResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)",
  ],
};
