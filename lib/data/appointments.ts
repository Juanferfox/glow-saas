import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus } from "@/lib/supabase/types";

// ─── Dev data ────────────────────────────────────────────────────────────────

const now = new Date();
const tomorrow = new Date(now.getTime() + 86_400_000);
const nextWeek  = new Date(now.getTime() + 7 * 86_400_000);
const lastWeek  = new Date(now.getTime() - 7 * 86_400_000);
const lastMonth = new Date(now.getTime() - 30 * 86_400_000);

function iso(d: Date, hour: number) {
  const c = new Date(d);
  c.setHours(hour, 0, 0, 0);
  return c.toISOString();
}

const DEV_APPOINTMENTS: Record<string, AppointmentWithDetails[]> = {
  // ── FM Glow Studio ─────────────────────────────────────────────────────────
  "dev-fm-glow-studio": [
    {
      id: "fmg-appt-1",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-cliente-fmglow",
      specialist_id: "fmg-sp-1",
      service_id: "fmg-u2",
      scheduled_at: iso(tomorrow, 10),
      ends_at: iso(tomorrow, 11),
      status: "confirmed" as AppointmentStatus,
      notes: "Diseño personalizado en forma de flor",
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Uñas Semipermanente" },
      specialist_name: "Ana García",
    },
    {
      id: "fmg-appt-2",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-cliente-fmglow",
      specialist_id: "fmg-sp-2",
      service_id: "fmg-f1",
      scheduled_at: iso(nextWeek, 14),
      ends_at: iso(nextWeek, 15),
      status: "pending" as AppointmentStatus,
      notes: null,
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Limpieza Facial Simple" },
      specialist_name: "Valentina López",
    },
    {
      id: "fmg-appt-3",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-cliente-fmglow",
      specialist_id: "fmg-sp-1",
      service_id: "fmg-p1",
      scheduled_at: iso(lastWeek, 11),
      ends_at: iso(lastWeek, 12),
      status: "completed" as AppointmentStatus,
      notes: null,
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: lastMonth.toISOString(),
      service_name: { es: "Pestañas Natural" },
      specialist_name: "Ana García",
    },
    {
      id: "fmg-appt-4",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-admin-fmglow",
      specialist_id: "fmg-sp-2",
      service_id: "fmg-corp1",
      scheduled_at: iso(now, 9),
      ends_at: iso(now, 10),
      status: "confirmed" as AppointmentStatus,
      notes: null,
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Sueroterapia + Masaje" },
      specialist_name: "Valentina López",
    },
    {
      id: "fmg-appt-5",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-admin-fmglow",
      specialist_id: "fmg-sp-1",
      service_id: "fmg-c1",
      scheduled_at: iso(now, 11),
      ends_at: iso(now, 12),
      status: "confirmed" as AppointmentStatus,
      notes: null,
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Diseño y Depilación de Cejas" },
      specialist_name: "Ana García",
    },
    {
      id: "fmg-appt-6",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-empleada-fmglow",
      specialist_id: "fmg-sp-2",
      service_id: "fmg-f2",
      scheduled_at: iso(now, 15),
      ends_at: iso(now, 16),
      status: "confirmed" as AppointmentStatus,
      notes: null,
      points_earned: 10,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Limpieza Facial Profunda" },
      specialist_name: "Valentina López",
    },
    {
      id: "fmg-appt-7",
      tenant_id: "dev-fm-glow-studio",
      client_id: "dev-cliente-fmglow",
      specialist_id: "fmg-sp-3",
      service_id: "fmg-cap3",
      scheduled_at: iso(lastMonth, 10),
      ends_at: iso(lastMonth, 12),
      status: "cancelled" as AppointmentStatus,
      notes: null,
      points_earned: 0,
      cancelled_at: lastMonth.toISOString(),
      cancel_reason: "Cambio de planes",
      created_at: lastMonth.toISOString(),
      service_name: { es: "Keratina Express" },
      specialist_name: "Sofía Herrera",
    },
  ],
  // ── Spa Luna ───────────────────────────────────────────────────────────────
  "dev-spa-luna": [
    {
      id: "appt-1",
      tenant_id: "dev-spa-luna",
      client_id: "dev-user",
      specialist_id: "sl-sp-1",
      service_id: "sl-1",
      scheduled_at: iso(tomorrow, 10),
      ends_at: iso(tomorrow, 11),
      status: "confirmed" as AppointmentStatus,
      notes: null,
      points_earned: 100,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Facial hidratante" },
      specialist_name: "Valentina Ríos",
    },
    {
      id: "appt-2",
      tenant_id: "dev-spa-luna",
      client_id: "dev-user",
      specialist_id: "sl-sp-2",
      service_id: "sl-2",
      scheduled_at: iso(nextWeek, 15),
      ends_at: iso(nextWeek, 16),
      status: "pending" as AppointmentStatus,
      notes: "Por favor calentar aceites de lavanda",
      points_earned: 100,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { es: "Masaje relajante" },
      specialist_name: "Camila Torres",
    },
    {
      id: "appt-3",
      tenant_id: "dev-spa-luna",
      client_id: "dev-user",
      specialist_id: "sl-sp-3",
      service_id: "sl-3",
      scheduled_at: iso(lastWeek, 11),
      ends_at: iso(lastWeek, 12),
      status: "completed" as AppointmentStatus,
      notes: null,
      points_earned: 100,
      cancelled_at: null,
      cancel_reason: null,
      created_at: lastMonth.toISOString(),
      service_name: { es: "Manicure spa" },
      specialist_name: "Isabella Mora",
    },
    {
      id: "appt-4",
      tenant_id: "dev-spa-luna",
      client_id: "dev-user",
      specialist_id: "sl-sp-1",
      service_id: "sl-5",
      scheduled_at: iso(lastMonth, 14),
      ends_at: iso(lastMonth, 15),
      status: "cancelled" as AppointmentStatus,
      notes: null,
      points_earned: 0,
      cancelled_at: lastMonth.toISOString(),
      cancel_reason: "Tenía un compromiso de trabajo",
      created_at: lastMonth.toISOString(),
      service_name: { es: "Lifting de pestañas" },
      specialist_name: "Valentina Ríos",
    },
  ],
  "dev-glam-studio": [
    {
      id: "appt-5",
      tenant_id: "dev-glam-studio",
      client_id: "dev-user",
      specialist_id: "gs-sp-1",
      service_id: "gs-1",
      scheduled_at: iso(tomorrow, 13),
      ends_at: iso(tomorrow, 14),
      status: "confirmed" as AppointmentStatus,
      notes: null,
      points_earned: 100,
      cancelled_at: null,
      cancel_reason: null,
      created_at: now.toISOString(),
      service_name: { en: "Precision Haircut", es: "Corte de precisión" },
      specialist_name: "Alex Ramírez",
    },
  ],
};

/**
 * Tipo extendido para citas que incluye datos de joins (UI-friendly).
 */
export type AppointmentWithDetails = Appointment & {
  service_name: Record<string, string>;
  specialist_name: string;
};

type RawRow = Appointment & {
  service_name: { name: Record<string, string> } | null;
  specialist_name: { name: string } | null;
};

function mapRow(a: RawRow): AppointmentWithDetails {
  return {
    ...a,
    service_name: a.service_name?.name ?? { es: "Servicio" },
    specialist_name: a.specialist_name?.name ?? "Especialista",
  };
}

const JOIN_SELECT = `
  *,
  service_name:services(name),
  specialist_name:specialists(name)
`;

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

/**
 * Obtiene las citas próximas del usuario autenticado para un tenant.
 */
export async function getMyAppointments(
  tenantId: string
): Promise<AppointmentWithDetails[]> {
  if (isDevMode()) {
    const all = DEV_APPOINTMENTS[tenantId] ?? [];
    return all.filter((a) => new Date(a.scheduled_at) >= new Date());
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("appointments")
      .select(JOIN_SELECT)
      .eq("tenant_id", tenantId)
      .eq("client_id", user.id)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(20);

    if (error || !data) return [];
    return (data as unknown as RawRow[]).map(mapRow);
  } catch {
    return [];
  }
}

/**
 * Obtiene TODAS las citas del usuario (próximas + historial).
 */
export async function getAllMyAppointments(tenantId: string): Promise<{
  upcoming: AppointmentWithDetails[];
  past: AppointmentWithDetails[];
}> {
  if (isDevMode()) {
    const all = DEV_APPOINTMENTS[tenantId] ?? [];
    const cutoff = new Date();
    return {
      upcoming: all.filter(
        (a) => new Date(a.scheduled_at) >= cutoff && a.status !== "cancelled"
      ),
      past: all.filter(
        (a) => new Date(a.scheduled_at) < cutoff || a.status === "cancelled"
      ),
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { upcoming: [], past: [] };

    const { data, error } = await supabase
      .from("appointments")
      .select(JOIN_SELECT)
      .eq("tenant_id", tenantId)
      .eq("client_id", user.id)
      .order("scheduled_at", { ascending: false })
      .limit(50);

    if (error || !data) return { upcoming: [], past: [] };

    const mapped = (data as unknown as RawRow[]).map(mapRow);
    const cutoff  = new Date();

    return {
      upcoming: mapped.filter(
        (a) => new Date(a.scheduled_at) >= cutoff && a.status !== "cancelled"
      ),
      past: mapped.filter(
        (a) => new Date(a.scheduled_at) < cutoff || a.status === "cancelled"
      ),
    };
  } catch {
    return { upcoming: [], past: [] };
  }
}

/**
 * Obtiene las citas existentes para un día dado (para cálculo de disponibilidad).
 * Usado desde las API routes con el service client.
 */
export async function getAppointmentsForDay(
  tenantId: string,
  date: string, // "YYYY-MM-DD"
  specialistIds: string[]
): Promise<Pick<Appointment, "specialist_id" | "scheduled_at" | "ends_at" | "status">[]> {
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();

  const dayStart = `${date}T00:00:00Z`;
  const dayEnd   = `${date}T23:59:59Z`;

  const { data, error } = await supabase
    .from("appointments")
    .select("specialist_id, scheduled_at, ends_at, status")
    .eq("tenant_id", tenantId)
    .in("specialist_id", specialistIds)
    .gte("scheduled_at", dayStart)
    .lte("scheduled_at", dayEnd)
    .neq("status", "cancelled");

  if (error || !data) return [];
  return data as Pick<Appointment, "specialist_id" | "scheduled_at" | "ends_at" | "status">[];
}
