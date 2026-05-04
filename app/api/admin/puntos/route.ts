import { NextRequest, NextResponse } from "next/server";

// In-memory point adjustments: userId → cumulative delta
const pointsDeltas = new Map<string, number>();
const pointsLog: PointEntry[] = [];

interface PointEntry {
  id: string;
  user_id: string;
  user_name: string;
  delta: number;
  reason: string;
  admin_id: string;
  created_at: string;
}

// Dev users with their base points
const DEV_USERS_POINTS: Record<string, { name: string; base_points: number; email: string }> = {
  "dev-admin-fmglow":    { name: "Admin FM Glow",   base_points: 0,   email: "admin@fmglow.test"    },
  "dev-cliente-fmglow":  { name: "Laura Martínez",  base_points: 250, email: "cliente@fmglow.test"  },
  "dev-empleada-fmglow": { name: "Ana García",      base_points: 0,   email: "empleada@fmglow.test" },
};

function getAdminProfile(request: NextRequest) {
  const cookie = request.cookies.get("dev-session");
  if (!cookie) return null;
  try {
    const profile = JSON.parse(decodeURIComponent(cookie.value));
    return profile?.role === "admin" ? profile : null;
  } catch {
    return null;
  }
}

/** GET /api/admin/puntos — lista usuarios con sus puntos actuales */
export async function GET(request: NextRequest) {
  if (!getAdminProfile(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = Object.entries(DEV_USERS_POINTS).map(([id, u]) => ({
    id,
    name: u.name,
    email: u.email,
    points: u.base_points + (pointsDeltas.get(id) ?? 0),
  }));

  return NextResponse.json({ users, log: pointsLog.slice(-20) });
}

/** POST /api/admin/puntos — ajusta puntos de un usuario */
export async function POST(request: NextRequest) {
  const admin = getAdminProfile(request);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as { user_id: string; delta: number; reason: string };
  const { user_id, delta, reason } = body;

  if (!user_id || delta === undefined || !reason) {
    return NextResponse.json({ error: "user_id, delta y reason requeridos" }, { status: 400 });
  }

  const user = DEV_USERS_POINTS[user_id];
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const currentDelta = pointsDeltas.get(user_id) ?? 0;
  const newTotal = user.base_points + currentDelta + delta;

  if (newTotal < 0) {
    return NextResponse.json({ error: "El saldo de puntos no puede ser negativo" }, { status: 400 });
  }

  pointsDeltas.set(user_id, currentDelta + delta);
  pointsLog.push({
    id: `log-${Date.now()}`,
    user_id,
    user_name: user.name,
    delta,
    reason,
    admin_id: admin.id,
    created_at: new Date().toISOString(),
  });

  return NextResponse.json({ ok: true, new_balance: newTotal });
}
