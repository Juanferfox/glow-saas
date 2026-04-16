import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { getSpecialists, getSchedules } from "@/lib/data/specialists";
import { getServices } from "@/lib/data/services";
import { computeAvailableSlots } from "@/lib/booking/slots";

/**
 * GET /api/availability?tenant=SLUG&service=SERVICE_ID&date=YYYY-MM-DD
 *
 * Devuelve los slots disponibles para una fecha dada.
 * En modo dev (sin Supabase) usa datos hardcodeados y no bloquea slots.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant");
  const serviceId  = searchParams.get("service");
  const date       = searchParams.get("date");

  if (!tenantSlug || !serviceId || !date) {
    return NextResponse.json(
      { error: "Parámetros requeridos: tenant, service, date" },
      { status: 400 }
    );
  }

  // Validar formato de fecha
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Formato de fecha inválido (YYYY-MM-DD)" }, { status: 400 });
  }

  // No mostrar disponibilidad para fechas pasadas
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return NextResponse.json({ slots: [] });
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const [services, specialists, schedules] = await Promise.all([
    getServices(tenant.id),
    getSpecialists(tenant.id),
    getSchedules(tenant.id),
  ]);

  const service = services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  // En modo dev no hay citas reales → existing = []
  let existing: { specialist_id: string | null; scheduled_at: string; ends_at: string }[] = [];

  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (!isDevMode) {
    const { getAppointmentsForDay } = await import("@/lib/data/appointments");
    existing = await getAppointmentsForDay(
      tenant.id,
      date,
      specialists.map((s) => s.id)
    );
  }

  const slots = computeAvailableSlots({
    specialists,
    schedules,
    existing,
    serviceId,
    durationMin: service.duration_min,
    date,
    timezone: tenant.timezone,
  });

  return NextResponse.json({ slots }, { status: 200 });
}
