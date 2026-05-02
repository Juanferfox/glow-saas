import { NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

/** Inicia sesión de prueba — solo disponible cuando Supabase no está configurado */
export async function POST() {
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  ) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set("dev-session", "1", COOKIE_OPTS);
  return res;
}

/** Cierra la sesión de prueba */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dev-session");
  return res;
}
