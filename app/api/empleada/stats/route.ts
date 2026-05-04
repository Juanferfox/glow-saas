import { NextResponse } from "next/server";

function getMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(now.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export async function GET() {
  const weekStart = getMonday();

  return NextResponse.json({
    today_sessions: 4,
    week_sessions: 18,
    week_start_date: weekStart,
  });
}
