import { NextRequest, NextResponse } from "next/server";

// In-memory store for schedule edits in dev mode
const devScheduleEdits = new Map<string, ScheduleDay[]>(); // specialistId → days

export interface ScheduleDay {
  day_of_week: number; // 0=Dom … 6=Sáb
  start_time: string;  // "HH:MM"
  end_time: string;
  is_working: boolean;
}

function isAdmin(request: NextRequest) {
  const cookie = request.cookies.get("dev-session");
  if (!cookie) return false;
  try {
    const profile = JSON.parse(decodeURIComponent(cookie.value));
    return profile?.role === "admin";
  } catch {
    return false;
  }
}

const DEFAULT_SCHEDULE: ScheduleDay[] = [
  { day_of_week: 0, start_time: "09:00", end_time: "09:00", is_working: false },
  { day_of_week: 1, start_time: "09:00", end_time: "18:00", is_working: true },
  { day_of_week: 2, start_time: "09:00", end_time: "18:00", is_working: true },
  { day_of_week: 3, start_time: "09:00", end_time: "18:00", is_working: true },
  { day_of_week: 4, start_time: "09:00", end_time: "18:00", is_working: true },
  { day_of_week: 5, start_time: "09:00", end_time: "16:00", is_working: true },
  { day_of_week: 6, start_time: "09:00", end_time: "13:00", is_working: false },
];

/** GET /api/admin/horarios?specialist_id=xxx */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const specialistId = request.nextUrl.searchParams.get("specialist_id") ?? "";
  const schedule = devScheduleEdits.get(specialistId) ?? DEFAULT_SCHEDULE;

  return NextResponse.json({ schedule });
}

/** PUT /api/admin/horarios — reemplaza el horario de una empleada */
export async function PUT(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as { specialist_id: string; schedule: ScheduleDay[] };
  if (!body.specialist_id || !Array.isArray(body.schedule)) {
    return NextResponse.json({ error: "specialist_id y schedule requeridos" }, { status: 400 });
  }

  devScheduleEdits.set(body.specialist_id, body.schedule);
  return NextResponse.json({ ok: true });
}
