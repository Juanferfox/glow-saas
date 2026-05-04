import { NextRequest, NextResponse } from "next/server";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 días
};

interface DevUser {
  id: string;
  email: string;
  username: string;
  password: string;
  role: "admin" | "cliente" | "trabajadora";
  full_name: string;
  points: number;
  referral_code: string | null;
  specialist_id: string | null;
  tenant_id: string;
  avatar_url: string | null;
}

const DEV_USERS: DevUser[] = [
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
    specialist_id: "dev-sp-fmglow-1",
    tenant_id: "dev-fm-glow-studio",
    avatar_url: null,
  },
];

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

/** Inicia sesión de prueba — solo disponible cuando Supabase no está configurado */
export async function POST(request: NextRequest) {
  if (!isDevMode()) {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { identifier, password } = await request.json().catch(() => ({}));

  if (!identifier || !password) {
    return NextResponse.json({ error: "Correo/usuario y contraseña requeridos" }, { status: 400 });
  }

  const user = DEV_USERS.find(
    (u) => (u.email === identifier || u.username === identifier) && u.password === password
  );

  if (!user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const profile = {
    id: user.id,
    email: user.email,
    role: user.role,
    full_name: user.full_name,
    points: user.points,
    referral_code: user.referral_code,
    specialist_id: user.specialist_id,
    tenant_id: user.tenant_id,
    avatar_url: user.avatar_url,
    username: user.username,
  };

  const encoded = Buffer.from(JSON.stringify(profile)).toString("base64");

  const redirectTo: Record<string, string> = {
    admin: "/admin",
    trabajadora: "/calendario",
    cliente: "/",
  };

  const res = NextResponse.json({
    success: true,
    profile,
    redirectTo: redirectTo[user.role] ?? "/",
  });
  res.cookies.set("dev-session", encoded, COOKIE_OPTS);
  return res;
}

/** Cierra la sesión de prueba */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("dev-session");
  return res;
}
