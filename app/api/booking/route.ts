import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { getServices } from "@/lib/data/services";
import type { AppointmentStatus } from "@/lib/supabase/types";

interface BookingBody {
  tenantSlug: string;
  serviceId: string;
  specialistId: string;
  date: string;   // "YYYY-MM-DD"
  time: string;   // "HH:MM"
  notes?: string;
  referralCode?: string;
}

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

function getDevUser(cookieHeader: string | null): { id: string } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/dev-session=([^;]+)/);
    if (!match || !match[1]) return null;
    const profile = JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
    return { id: profile.id };
  } catch {
    return null;
  }
}

/**
 * POST /api/booking
 * Crea una nueva cita para el usuario autenticado.
 */
export async function POST(request: NextRequest) {
  const dev = isDevMode();
  let userId = "";

  if (dev) {
    const devUser = getDevUser(request.headers.get("cookie"));
    if (!devUser) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    userId = devUser.id;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    userId = user.id;
  }

  let body: BookingBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { tenantSlug, serviceId, specialistId, date, time, notes } = body;
  if (!tenantSlug || !serviceId || !specialistId || !date || !time) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  const services = await getServices(tenant.id);
  const service  = services.find((s) => s.id === serviceId);
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  const scheduledAt = new Date(`${date}T${time}:00`);
  const endsAt      = new Date(scheduledAt.getTime() + service.duration_min * 60_000);

  if (dev) {
    const mockAppointment = {
      id:             `mock-${Date.now()}`,
      tenant_id:      tenant.id,
      client_id:      userId,
      specialist_id:  specialistId,
      service_id:     serviceId,
      scheduled_at:   scheduledAt.toISOString(),
      ends_at:        endsAt.toISOString(),
      status:         "confirmed" as AppointmentStatus,
      notes:          notes ?? null,
      points_earned:  tenant.points_per_service,
      cancelled_at:   null,
      cancel_reason:  null,
      created_at:     new Date().toISOString(),
    };
    return NextResponse.json({ appointment: mockAppointment }, { status: 201 });
  }

  const supabase = await createClient();

  // Verificar que el usuario tiene profile en este tenant
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .eq("tenant_id", tenant.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "Tu perfil no está asociado a este tenant" },
      { status: 403 }
    );
  }

  const { data, error } = await supabase
    .from("appointments")
    .insert({
      tenant_id:    tenant.id,
      client_id:    userId,
      specialist_id: specialistId,
      service_id:   serviceId,
      scheduled_at: scheduledAt.toISOString(),
      ends_at:      endsAt.toISOString(),
      status:        "confirmed" as AppointmentStatus,
      notes:         notes ?? null,
      points_earned: tenant.points_per_service,
      cancelled_at:  null,
      cancel_reason: null,
    })
    .select()
    .single();

  if (error || !data) {
    console.error("[booking] Error al crear cita:", error);
    return NextResponse.json({ error: "No se pudo crear la cita" }, { status: 500 });
  }

  // Email de confirmación en background (fire-and-forget)
  try {
    fetch(`${request.nextUrl.origin}/api/send-confirmation`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ appointmentId: data.id, tenantSlug }),
    }).catch(() => {});
  } catch {}

  return NextResponse.json({ appointment: data }, { status: 201 });
}
