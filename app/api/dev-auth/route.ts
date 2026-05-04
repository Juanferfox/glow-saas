import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

const IS_DEV =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

export interface DevProfile {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "trabajadora" | "cliente";
  points: number;
  referral_code: string | null;
  specialist_id: string | null;
  tenant_id: string;
  avatar_url: string | null;
}

const DEV_USERS: (DevProfile & { password: string; username: string })[] = [
  {
    id: "dev-admin-fmglow",
    email: "admin@fmglow.test",
    username: "admin",
    password: "123456789",
    role: "admin",
    full_name: "Admin FM Glow",
    points: 0,
    referral_code: null,
    specialist_id: null,
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
  {
    id: "dev-cliente-fmglow",
    email: "cliente@fmglow.test",
    username: "cliente",
    password: "123456789",
    role: "cliente",
    full_name: "Laura Martínez",
    points: 250,
    referral_code: "FMCLI001",
    specialist_id: null,
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
  {
    id: "dev-empleada-fmglow",
    email: "empleada@fmglow.test",
    username: "empleada",
    password: "123456789",
    role: "trabajadora",
    full_name: "Ana García",
    points: 0,
    referral_code: null,
    specialist_id: "fmg-sp-1",
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
];

/** Inicia sesión de prueba — solo disponible cuando Supabase no está configurado */
export async function POST(request: NextRequest) {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  let identifier = "";
  let password = "";

  try {
    const body = await request.json();
    identifier = body.identifier ?? "";
    password = body.password ?? "";
  } catch {
    // body vacío → login de un solo botón (retrocompatible)
    identifier = "cliente";
    password = "123456789";
  }

  const found = DEV_USERS.find(
    (u) =>
      (u.email === identifier || u.username === identifier) &&
      u.password === password
  );

  if (!found) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const { password: _pw, username: _un, ...profile } = found;

  const res = NextResponse.json({ ok: true, profile });
  res.cookies.set("dev-session", JSON.stringify(profile), COOKIE_OPTS);
  return res;
}

/** Cierra la sesión de prueba */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dev-session");
  return res;
}

/** Lista usuarios de prueba (para dev tooling) */
export async function GET() {
  if (!IS_DEV) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }
  return NextResponse.json({
    users: DEV_USERS.map(({ password: _pw, ...u }) => u),
  });
}
