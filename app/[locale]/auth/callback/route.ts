import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * OAuth callback — intercambia el code por una sesión de Supabase.
 *
 * Flujo:
 * 1. Supabase redirige al usuario aquí tras login con Google / Facebook
 * 2. Se intercambia el `code` por tokens de sesión
 * 3. Se redirige al home del tenant (o a la URL de origen si hay `next`)
 *
 * URL configurada en Supabase Dashboard:
 *   Authentication → URL Configuration → Redirect URLs
 *   → https://*.tuapp.co/[locale]/auth/callback
 *   → http://*.localhost:3000/[locale]/auth/callback (dev)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const { locale } = await params;
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? `/${locale}`;
  const error = searchParams.get("error");

  // Error enviado por Supabase (ej: usuario canceló)
  if (error) {
    return NextResponse.redirect(
      new URL(`/${locale}/auth/login?error=${encodeURIComponent(error)}`, origin)
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError) {
      // Redirigir a la URL de destino (asegurar que es relativa y segura)
      const redirectUrl = next.startsWith("/") ? next : `/${locale}`;
      return NextResponse.redirect(new URL(redirectUrl, origin));
    }
  }

  // Algo salió mal
  return NextResponse.redirect(
    new URL(`/${locale}/auth/login?error=auth_callback_error`, origin)
  );
}
