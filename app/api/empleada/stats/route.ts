import { NextRequest, NextResponse } from "next/server";

function getWorkerProfile(request: NextRequest) {
  const cookie = request.cookies.get("dev-session");
  if (!cookie) return null;
  try {
    const profile = JSON.parse(decodeURIComponent(cookie.value));
    return profile?.role === "trabajadora" ? profile : null;
  } catch {
    return null;
  }
}

/** Calcula el lunes de la semana actual a las 00:00 */
function getMondayOfThisWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Dom, 1=Lun…
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/** GET /api/empleada/stats — sesiones hoy y esta semana */
export async function GET(request: NextRequest) {
  const worker = getWorkerProfile(request);
  if (!worker) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  const monday = getMondayOfThisWeek();

  if (isDevMode) {
    // Mock: Ana García tiene 4 citas hoy (fmg-appt-4, 5, 6 asignadas a sp-1/sp-2)
    // y 18 en la semana
    return NextResponse.json({
      today_sessions: 4,
      week_sessions: 18,
      week_start_date: monday.toISOString().split("T")[0],
    });
  }

  // Producción: contar desde DB
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = supabase as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [todayRes, weekRes]: any[] = await Promise.all([
    sb.from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("specialist_id", worker.specialist_id)
      .gte("scheduled_at", todayStart.toISOString())
      .lte("scheduled_at", todayEnd.toISOString())
      .neq("status", "cancelled"),
    sb.from("appointments")
      .select("*", { count: "exact", head: true })
      .eq("specialist_id", worker.specialist_id)
      .gte("scheduled_at", monday.toISOString())
      .neq("status", "cancelled"),
  ]);

  return NextResponse.json({
    today_sessions: (todayRes?.count as number) ?? 0,
    week_sessions: (weekRes?.count as number) ?? 0,
    week_start_date: monday.toISOString().split("T")[0],
  });
}
