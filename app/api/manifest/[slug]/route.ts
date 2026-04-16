import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";

/**
 * API route: /api/manifest/[slug]
 *
 * Genera el Web App Manifest dinámico por tenant.
 * Permite que cada SPA tenga su propio nombre, colores e íconos en la PWA.
 *
 * Cacheable: 1 hora (los manifests cambian poco).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await getTenant(slug);

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const appDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "localhost";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const tenantUrl = appDomain.includes("localhost")
    ? `http://${slug}.localhost:3000`
    : `https://${slug}.${appDomain}`;

  const manifest = {
    name: tenant.name,
    short_name: tenant.name,
    description: `App de ${tenant.name} — Tu spa de confianza`,
    start_url: `${tenantUrl}/${tenant.default_locale}`,
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: tenant.brand_color_bg,
    theme_color: tenant.brand_color_primary,
    lang: tenant.default_locale,
    icons: [
      {
        src: tenant.logo_url ?? `/tenants/${slug}/icon-192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: tenant.logo_url ?? `/tenants/${slug}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: `/tenants/${slug}/screenshot-home.png`,
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    categories: ["beauty", "health", "lifestyle"],
  };

  return NextResponse.json(manifest, {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
