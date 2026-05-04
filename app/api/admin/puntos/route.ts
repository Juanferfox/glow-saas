import { NextRequest, NextResponse } from "next/server";

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

function getDevProfile(cookieHeader: string | null): { role: string } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/dev-session=([^;]+)/);
    if (!match || !match[1]) return null;
    return JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function requireAdmin(request: NextRequest): NextResponse | null {
  if (isDevMode()) {
    const profile = getDevProfile(request.headers.get("cookie"));
    if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (profile.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return null;
  }
  return null;
}

const DEV_USERS_POINTS = [
  { id: "dev-admin-fmglow", full_name: "Admin FM Glow", email: "admin@fmglow.test", points: 0, role: "admin" },
  { id: "dev-cliente-fmglow", full_name: "Laura Martínez", email: "cliente@fmglow.test", points: 250, role: "cliente" },
  { id: "dev-empleada-fmglow", full_name: "Ana García", email: "empleada@fmglow.test", points: 0, role: "trabajadora" },
];

const pointsAdjustments = new Map<string, number>();

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const users = DEV_USERS_POINTS.map((u) => ({
    ...u,
    points: u.points + (pointsAdjustments.get(u.id) ?? 0),
  }));

  return NextResponse.json({ users });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { user_id, delta, reason } = await request.json();

  if (!user_id || delta === undefined) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  const current = pointsAdjustments.get(user_id) ?? 0;
  const user = DEV_USERS_POINTS.find((u) => u.id === user_id);
  const basePoints = user?.points ?? 0;
  const newTotal = basePoints + current + delta;

  if (newTotal < 0) {
    return NextResponse.json({ error: "El saldo no puede ser negativo" }, { status: 400 });
  }

  pointsAdjustments.set(user_id, current + delta);

  return NextResponse.json({
    success: true,
    user_id,
    previous_balance: basePoints + current,
    new_balance: newTotal,
    reason,
  });
}
