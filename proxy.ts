import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";
import { getTenantSlug } from "./lib/utils";

// Middleware de internacionalización de next-intl
const intlMiddleware = createMiddleware(routing);

/**
 * Rutas que requieren sesión activa.
 * Se comparan contra el pathname SIN el prefijo de locale,
 * es decir, el segmento tras /[locale]/...
 *
 * Ejemplos:
 *   /es/perfil    → protected ("perfil")
 *   /en/agendar   → NOT protected (booking es público)
 *   /es/puntos    → protected ("puntos")
 *   /es/admin     → protected ("admin")
 */
const PROTECTED_SEGMENTS = [
  "perfil",
  "puntos",
  "admin",
];

/**
 * Proxy principal de spa-saas (antes "middleware" — renombrado en Next.js 16).
 *
 * Responsabilidades:
 * 1. Extraer el slug del tenant desde el subdominio
 * 2. Inyectar el slug en headers para que los Server Components lo lean
 * 3. Refrescar la sesión de Supabase
 * 4. Proteger rutas autenticadas — redirect a /auth/login si no hay sesión
 * 5. Delegar el routing i18n a next-intl
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // ── 1. Detectar tenant desde subdominio ──────────────────────────────────
  const tenantSlug = getTenantSlug(hostname);

  // ── 2. Rutas estáticas e internas: pasar directo ─────────────────────────
  const isExcluded =
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") ||
    pathname.startsWith("/tenants") ||
    // Rutas de desarrollo: no añadir prefijo de locale
    (process.env.NODE_ENV !== "production" && pathname.startsWith("/dev"));

  if (isExcluded) {
    return NextResponse.next();
  }

  // ── 3. Refrescar sesión de Supabase ──────────────────────────────────────
  const { supabaseResponse, user } = await updateSession(request);

  // ── 4. Protección de rutas autenticadas ──────────────────────────────────
  //
  // El pathname tiene la forma /[locale]/[segment]/...
  // Extraemos el segmento tras el locale para comparar.
  //
  // Nota: solo protegemos cuando Supabase está configurado (no en modo dev sin env).
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (hasSupabase && !user) {
    // Extraer segmento de locale y segmento protegido
    // pathname: /es/perfil  →  parts: ["", "es", "perfil", ...]
    const parts = pathname.split("/");
    const segment = parts[2]; // índice 2 = primer segmento tras el locale

    if (segment && PROTECTED_SEGMENTS.includes(segment)) {
      const locale = parts[1] ?? "es";
      const loginUrl = new URL(`/${locale}/auth/login`, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 5. Procesar i18n con next-intl ───────────────────────────────────────
  const intlResponse = intlMiddleware(request);

  // ── 6. Construir respuesta final ─────────────────────────────────────────
  const finalResponse = intlResponse ?? supabaseResponse ?? NextResponse.next();

  // Inyectar tenant slug en headers de la response
  // → accesible vía `headers()` en Server Components
  if (tenantSlug) {
    finalResponse.headers.set("x-tenant-slug", tenantSlug);
  }
  finalResponse.headers.set("x-hostname", hostname);

  // Propagar cookies de Supabase a la respuesta final
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    try {
      finalResponse.cookies.set(
        cookie.name,
        cookie.value,
        cookie as Parameters<typeof finalResponse.cookies.set>[2]
      );
    } catch {
      // ignorar errores de cookies duplicadas
    }
  });

  return finalResponse;
}

export const config = {
  matcher: [
    /*
     * Procesar todas las rutas excepto:
     * - _next/static (archivos estáticos compilados)
     * - _next/image (optimización de imágenes)
     * - favicon.ico, robots.txt, sitemap.xml
     * - Archivos con extensión (imágenes, fuentes, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)).*)",
  ],
};
