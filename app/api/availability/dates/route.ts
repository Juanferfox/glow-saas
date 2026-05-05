import { NextResponse, type NextRequest } from "next/server";
import { getTenant } from "@/lib/tenant";
import { getSpecialists, getSchedules } from "@/lib/data/specialists";
import { getServices } from "@/lib/data/services";

/**
 * GET /api/availability/dates?tenant=SLUG&service=SERVICE_ID&month=YYYY-MM
 *
 * Devuelve qué días del mes tienen al menos un slot disponible
 * para el servicio dado, basado en los horarios de especialistas.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant");
  const serviceId  = searchParams.get("service");
  const month      = searchParams.get("month");

  if (!tenantSlug || !serviceId || !month) {
    return NextResponse.json(
      { error: "Parámetros requeridos: tenant, service, month" },
      { status: 400 }
    );
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Formato inválido (YYYY-MM)" }, { status: 400 });
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

  const durationMin = service.duration_min;

  // Días del mes
  const [year, mon] = month.split("-").map(Number);
  const lastDay = new Date(Number(year), Number(mon), 0).getDate();

  const today = new Date();
  const todayYMD = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const availableDates: string[] = [];

  for (let day = 1; day <= lastDay; day++) {
    const ymd = `${year}-${String(mon).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // No mostrar pasado
    if (ymd < todayYMD) continue;

    // No más de 60 días hacia adelante
    const d = new Date(`${ymd}T12:00:00`);
    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + 60);
    if (d > maxDate) continue;

    // Día de la semana en la timezone del tenant
    const localDate = new Date(
      new Intl.DateTimeFormat("en-CA", { timeZone: tenant.timezone }).format(new Date(`${ymd}T12:00:00Z`))
    );
    const dayOfWeek = localDate.getDay();

    // Verificar si al menos un especialista trabaja ese día y ofrece el servicio
    const hasAvailability = specialists.some((sp) => {
      if (!sp.services.includes(serviceId)) return false;

      const schedule = schedules.find(
        (s) => s.specialist_id === sp.id && s.day_of_week === dayOfWeek && s.is_working
      );
      if (!schedule) return false;

      const [startH, startM] = schedule.start_time.split(":").map(Number);
      const [endH, endM]     = schedule.end_time.split(":").map(Number);
      const startMins = (startH ?? 0) * 60 + (startM ?? 0);
      const endMins   = (endH   ?? 0) * 60 + (endM   ?? 0);
      return endMins - startMins >= durationMin;
    });

    if (hasAvailability) {
      availableDates.push(ymd);
    }
  }

  return NextResponse.json({ dates: availableDates });
}
