import { NextRequest, NextResponse } from "next/server";

const MOCK_ANALYTICS = {
  today: { services_revenue: 450000, store_revenue: 85000, total: 535000, appointments_count: 6, orders_count: 2 },
  week:  { services_revenue: 2800000, store_revenue: 520000, total: 3320000, appointments_count: 38, orders_count: 11 },
  month: { services_revenue: 11500000, store_revenue: 2100000, total: 13600000, appointments_count: 152, orders_count: 44 },
  recent_transactions: [
    { type: "service", description: "Limpieza Facial + Hidratación", amount: 80000, client: "Laura M.", date: "hoy 10:30" },
    { type: "store",   description: "Sérum Vitamina C",              amount: 85000, client: "Sofia R.", date: "hoy 09:15" },
    { type: "service", description: "Uñas Semipermanente",           amount: 45000, client: "Ana L.",   date: "ayer 16:00" },
    { type: "store",   description: "Kit Manicure Professional",     amount: 45000, client: "Paula V.", date: "ayer 14:30" },
  ],
};

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const period = searchParams.get("period") ?? "today";

  const data = MOCK_ANALYTICS[period as keyof typeof MOCK_ANALYTICS] ?? MOCK_ANALYTICS.today;
  return NextResponse.json(data);
}
