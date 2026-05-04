import { NextRequest, NextResponse } from "next/server";

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

const MOCK: Record<string, { services_revenue: number; store_revenue: number; appointments_count: number; orders_count: number }> = {
  today: { services_revenue: 450000,   store_revenue: 85000,   appointments_count: 6,   orders_count: 2 },
  week:  { services_revenue: 2800000,  store_revenue: 520000,  appointments_count: 38,  orders_count: 11 },
  month: { services_revenue: 11500000, store_revenue: 2100000, appointments_count: 152, orders_count: 44 },
};

const MOCK_TRANSACTIONS = [
  { type: "service", description: "Limpieza Facial + Hidratación", amount: 80000,  client: "Laura M.",  date: "Hoy 10:30" },
  { type: "store",   description: "Sérum Vitamina C Glow",          amount: 85000,  client: "Sofía R.",  date: "Hoy 09:15" },
  { type: "service", description: "Uñas Semipermanente",             amount: 45000,  client: "Ana L.",    date: "Ayer 16:00" },
  { type: "store",   description: "Crema Hidratante Luxury",         amount: 120000, client: "Paula V.",  date: "Ayer 14:30" },
  { type: "service", description: "Diseño y Depilación de Cejas",    amount: 35000,  client: "Camila T.", date: "Ayer 11:00" },
];

/** GET /api/admin/analytics?period=today|week|month */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const period = (request.nextUrl.searchParams.get("period") ?? "week") as keyof typeof MOCK;
  const data = MOCK[period] ?? MOCK.week;

  return NextResponse.json({
    ...data,
    total: data.services_revenue + data.store_revenue,
    transactions: MOCK_TRANSACTIONS,
  });
}
