import { NextRequest, NextResponse } from "next/server";
import { getSchedules, updateDevSchedule } from "@/lib/data/specialists";
import type { SpecialistSchedule } from "@/lib/supabase/types";

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

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const tenantId = searchParams.get("tenant_id") ?? "dev-fm-glow-studio";
  const specialistId = searchParams.get("specialist_id");

  const schedules = await getSchedules(tenantId);
  const filtered = specialistId
    ? schedules.filter((s) => s.specialist_id === specialistId)
    : schedules;

  return NextResponse.json({ schedules: filtered });
}

export async function PUT(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!isDevMode()) {
    return NextResponse.json({ error: "Solo disponible en modo dev" }, { status: 400 });
  }

  const { specialist_id, schedules } = await request.json();
  if (!specialist_id || !schedules) {
    return NextResponse.json({ error: "Faltan datos" }, { status: 400 });
  }

  updateDevSchedule(specialist_id, schedules as SpecialistSchedule[]);
  return NextResponse.json({ success: true });
}
