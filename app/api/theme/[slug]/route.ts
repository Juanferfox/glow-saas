import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { generateCSSBlock } from "@/lib/theme";

/**
 * API route: /api/theme/[slug]
 *
 * Devuelve el bloque de CSS vars del tenant como text/css.
 * Se puede enlazar con <link rel="stylesheet"> como alternativa
 * a la inyección inline del layout.
 *
 * Cacheable: 24h (los temas cambian raramente).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const tenant = await getTenant(slug);

  if (!tenant) {
    return new NextResponse("/* Tenant not found */", {
      status: 404,
      headers: { "Content-Type": "text/css" },
    });
  }

  const css = generateCSSBlock(tenant);

  return new NextResponse(css, {
    headers: {
      "Content-Type": "text/css",
      "Cache-Control":
        "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
