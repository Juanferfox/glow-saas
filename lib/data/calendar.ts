import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment, AppointmentStatus, TreatmentPlan, TreatmentSession } from "@/lib/supabase/types";

// ─── Tipos para calendario ───────────────────────────────────────────────────

export type CalendarEvent = {
  id: string;
  title: string;           // nombre del servicio en el locale del usuario
  start: string;           // ISO
  end: string;             // ISO
  status: AppointmentStatus;
  specialist_name: string | null;
  specialist_id: string | null;
  client_name: string | null;
  color?: string;          // hex opcional (color por especialista en vista equipo)
  treatment_plan_id?: string | null;
  session_number?: number | null;
  total_sessions?: number | null;
}

export type CalendarRange = {
  from: string;  // YYYY-MM-DD
  to: string;    // YYYY-MM-DD
}

// ─── Dev data ────────────────────────────────────────────────────────────────

const now = new Date();
const d = (offset: number, hour: number, minute = 0) => {
  const dt = new Date(now);
  dt.setDate(dt.getDate() + offset);
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
};

const DEV_EVENTS: CalendarEvent[] = [
  {
    id: "ev-1",
    title: "Facial hidratante",
    start: d(1, 10),
    end: d(1, 11),
    status: "confirmed",
    specialist_name: "Valentina Ríos",
    specialist_id: "sl-sp-1",
    client_name: "María García",
    color: "#8b5cf6",
  },
  {
    id: "ev-2",
    title: "Masaje relajante",
    start: d(1, 12),
    end: d(1, 13, 30),
    status: "confirmed",
    specialist_name: "Camila Torres",
    specialist_id: "sl-sp-2",
    client_name: "Ana López",
    color: "#ec4899",
  },
  {
    id: "ev-3",
    title: "Lifting de pestañas",
    start: d(2, 9),
    end: d(2, 10),
    status: "pending",
    specialist_name: "Isabella Mora",
    specialist_id: "sl-sp-3",
    client_name: "Sofia Martínez",
    color: "#06b6d4",
    treatment_plan_id: "plan-1",
    session_number: 3,
    total_sessions: 6,
  },
  {
    id: "ev-4",
    title: "Manicure spa",
    start: d(2, 11),
    end: d(2, 12),
    status: "confirmed",
    specialist_name: "Valentina Ríos",
    specialist_id: "sl-sp-1",
    client_name: "Laura Jiménez",
    color: "#8b5cf6",
  },
  {
    id: "ev-5",
    title: "Depilación láser",
    start: d(3, 14),
    end: d(3, 15),
    status: "confirmed",
    specialist_name: "Camila Torres",
    specialist_id: "sl-sp-2",
    client_name: "Valentina Cruz",
    color: "#ec4899",
    treatment_plan_id: "plan-2",
    session_number: 2,
    total_sessions: 8,
  },
  {
    id: "ev-6",
    title: "Bronceo solar",
    start: d(0, 15),
    end: d(0, 15, 30),
    status: "confirmed",
    specialist_name: "Isabella Mora",
    specialist_id: "sl-sp-3",
    client_name: "Daniela Ruiz",
    color: "#06b6d4",
  },
  {
    id: "ev-7",
    title: "Facial hidratante",
    start: d(7, 10),
    end: d(7, 11),
    status: "pending",
    specialist_name: "Valentina Ríos",
    specialist_id: "sl-sp-1",
    client_name: "Patricia Díaz",
    color: "#8b5cf6",
  },
];

const DEV_TREATMENT_PLANS: TreatmentPlan[] = [
  {
    id: "plan-1",
    tenant_id: "dev-spa-luna",
    client_id: "dev-user",
    service_id: "sl-3",
    name: { es: "Lifting de pestañas — 6 sesiones", en: "Lash Lift — 6 sessions" },
    total_sessions: 6,
    completed_sessions: 2,
    notes: "Usar pinzas curvas, sensibilidad media",
    started_at: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
    expires_at: new Date(now.getTime() + 150 * 86_400_000).toISOString(),
    active: true,
    created_at: new Date(now.getTime() - 30 * 86_400_000).toISOString(),
  },
  {
    id: "plan-2",
    tenant_id: "dev-spa-luna",
    client_id: "dev-user-2",
    service_id: "sl-5",
    name: { es: "Depilación láser — 8 sesiones", en: "Laser Hair Removal — 8 sessions" },
    total_sessions: 8,
    completed_sessions: 1,
    notes: null,
    started_at: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
    expires_at: new Date(now.getTime() + 300 * 86_400_000).toISOString(),
    active: true,
    created_at: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
  },
  // ── Glow Studio ─────────────────────────────────────────────────────────────
  {
    id: "fg-plan-1",
    tenant_id: "dev-glow-studio",
    client_id: "fg-client-1",
    service_id: "fg-9",
    name: { es: "Lifting de pestañas — 4 sesiones", en: "Lash Lift — 4 sessions" },
    total_sessions: 4,
    completed_sessions: 2,
    notes: "Clienta con pestañas finas, usar solución suave",
    started_at: new Date(now.getTime() - 45 * 86_400_000).toISOString(),
    expires_at: new Date(now.getTime() + 90 * 86_400_000).toISOString(),
    active: true,
    created_at: new Date(now.getTime() - 45 * 86_400_000).toISOString(),
  },
  {
    id: "fg-plan-2",
    tenant_id: "dev-glow-studio",
    client_id: "fg-client-2",
    service_id: "fg-5",
    name: { es: "Masaje tejido profundo — 6 sesiones", en: "Deep Tissue Massage — 6 sessions" },
    total_sessions: 6,
    completed_sessions: 1,
    notes: "Contractura lumbar crónica, presión media-alta",
    started_at: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
    expires_at: new Date(now.getTime() + 180 * 86_400_000).toISOString(),
    active: true,
    created_at: new Date(now.getTime() - 14 * 86_400_000).toISOString(),
  },
];

// ── Glow Studio dev events ───────────────────────────────────────────────────
const DEV_GLOW_EVENTS: CalendarEvent[] = [
  {
    id: "fg-ev-1",
    title: "Facial Glow Signature",
    start: d(0, 10),
    end: d(0, 11, 15),
    status: "confirmed",
    specialist_name: "Luna Vargas",
    specialist_id: "fg-sp-1",
    client_name: "Sofía Reyes",
    color: "#d4826a",
  },
  {
    id: "fg-ev-2",
    title: "Masaje relajante",
    start: d(0, 12),
    end: d(0, 13),
    status: "confirmed",
    specialist_name: "Catalina Peña",
    specialist_id: "fg-sp-2",
    client_name: "Mariana Ríos",
    color: "#a855f7",
  },
  {
    id: "fg-ev-3",
    title: "Lifting de pestañas",
    start: d(1, 9),
    end: d(1, 10, 15),
    status: "pending",
    specialist_name: "Luna Vargas",
    specialist_id: "fg-sp-1",
    client_name: "Sofía Reyes",
    color: "#d4826a",
    treatment_plan_id: "fg-plan-1",
    session_number: 3,
    total_sessions: 4,
  },
  {
    id: "fg-ev-4",
    title: "Manicure permanente",
    start: d(1, 11),
    end: d(1, 11, 45),
    status: "confirmed",
    specialist_name: "Valentina Mora",
    specialist_id: "fg-sp-3",
    client_name: "Isabella Torres",
    color: "#06b6d4",
  },
  {
    id: "fg-ev-5",
    title: "Masaje de tejido profundo",
    start: d(1, 14),
    end: d(1, 15, 15),
    status: "confirmed",
    specialist_name: "Catalina Peña",
    specialist_id: "fg-sp-2",
    client_name: "Mariana Ríos",
    color: "#a855f7",
    treatment_plan_id: "fg-plan-2",
    session_number: 2,
    total_sessions: 6,
  },
  {
    id: "fg-ev-6",
    title: "Envoltura corporal detox",
    start: d(2, 10),
    end: d(2, 11, 30),
    status: "confirmed",
    specialist_name: "Catalina Peña",
    specialist_id: "fg-sp-2",
    client_name: "Daniela Castro",
    color: "#a855f7",
  },
  {
    id: "fg-ev-7",
    title: "Diseño de cejas con henna",
    start: d(2, 12),
    end: d(2, 12, 45),
    status: "pending",
    specialist_name: "Luna Vargas",
    specialist_id: "fg-sp-1",
    client_name: "Isabella Torres",
    color: "#d4826a",
  },
  {
    id: "fg-ev-8",
    title: "Pedicure spa completo",
    start: d(3, 9),
    end: d(3, 10),
    status: "confirmed",
    specialist_name: "Valentina Mora",
    specialist_id: "fg-sp-3",
    client_name: "Sofía Reyes",
    color: "#06b6d4",
  },
  {
    id: "fg-ev-9",
    title: "Hydrojelly Facial",
    start: d(3, 11),
    end: d(3, 11, 50),
    status: "confirmed",
    specialist_name: "Andrea Salcedo",
    specialist_id: "fg-sp-4",
    client_name: "Daniela Castro",
    color: "#10b981",
  },
  {
    id: "fg-ev-10",
    title: "Masaje de piedras calientes",
    start: d(5, 15),
    end: d(5, 16, 30),
    status: "pending",
    specialist_name: "Catalina Peña",
    specialist_id: "fg-sp-2",
    client_name: "Mariana Ríos",
    color: "#a855f7",
  },
];

// Mapa de eventos por tenant (dev mode)
const DEV_EVENTS_BY_TENANT: Record<string, CalendarEvent[]> = {
  "dev-spa-luna":    DEV_EVENTS,
  "dev-glow-studio": DEV_GLOW_EVENTS,
};

// userId → specialist_id (para filtro en modo dev)
const DEV_USER_SPECIALIST: Record<string, string> = {
  "dev-worker-1":  "sl-sp-1",
  "dev-worker-2":  "sl-sp-2",
  "dev-worker-3":  "sl-sp-3",
  "fg-worker-1":   "fg-sp-1",
  "fg-worker-2":   "fg-sp-2",
  "fg-worker-3":   "fg-sp-3",
  "fg-worker-4":   "fg-sp-4",
};

// ─── Funciones de datos ──────────────────────────────────────────────────────

/**
 * Eventos para el calendario personal de un cliente o trabajadora.
 * En dev devuelve eventos de muestra.
 */
export async function getCalendarEvents(
  tenantId: string,
  userId: string,
  range: CalendarRange,
  role: "cliente" | "trabajadora" | "recepcionista" | "admin" = "cliente"
): Promise<CalendarEvent[]> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    const tenantEvents = DEV_EVENTS_BY_TENANT[tenantId] ?? DEV_EVENTS;
    if (role === "trabajadora") {
      const specialistId = DEV_USER_SPECIALIST[userId];
      return specialistId
        ? tenantEvents.filter((e) => e.specialist_id === specialistId)
        : tenantEvents;
    }
    return tenantEvents;
  }

  const supabase = await createClient();

  let query = supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      ends_at,
      status,
      specialist_id,
      services!inner(name),
      specialists(name),
      profiles!appointments_client_id_fkey(full_name)
    `)
    .eq("tenant_id", tenantId)
    .gte("scheduled_at", `${range.from}T00:00:00`)
    .lte("scheduled_at", `${range.to}T23:59:59`);

  if (role === "cliente") {
    query = query.eq("client_id", userId);
  } else if (role === "trabajadora") {
    // Buscar el specialist_id vinculado a este user
    const { data: sp } = await supabase
      .from("specialists")
      .select("id")
      .eq("profile_id", userId)
      .eq("tenant_id", tenantId)
      .single();
    if (sp) query = query.eq("specialist_id", sp.id);
  }

  const { data } = await query;

  return (data as unknown as Record<string, unknown>[]).map((row) => {
    const svc = row.services as { name: Record<string, string> } | null;
    const sp  = row.specialists as { name: string } | null;
    const cl  = row.profiles   as { full_name: string | null } | null;
    return {
      id:              row.id as string,
      title:           svc?.name?.es ?? svc?.name?.en ?? "Servicio",
      start:           row.scheduled_at as string,
      end:             row.ends_at as string,
      status:          row.status as AppointmentStatus,
      specialist_name: sp?.name ?? null,
      specialist_id:   row.specialist_id as string | null,
      client_name:     cl?.full_name ?? null,
    };
  });
}

/**
 * Planes de tratamiento activos de un cliente.
 */
export async function getTreatmentPlans(
  tenantId: string,
  clientId: string
): Promise<TreatmentPlan[]> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return DEV_TREATMENT_PLANS.filter(
      (p) => p.tenant_id === tenantId && p.client_id === clientId
    );
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("client_id", clientId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as TreatmentPlan[];
}

/**
 * Todos los planes de tratamiento activos del tenant (para admin).
 */
export async function getAllTreatmentPlans(tenantId: string): Promise<TreatmentPlan[]> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return DEV_TREATMENT_PLANS;
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_plans")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (data ?? []) as TreatmentPlan[];
}

/**
 * Sesiones de un plan de tratamiento.
 */
export async function getTreatmentSessions(planId: string): Promise<TreatmentSession[]> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return Array.from({ length: 6 }, (_, i) => ({
      id: `sess-${planId}-${i + 1}`,
      plan_id: planId,
      tenant_id: "dev-spa-luna",
      appointment_id: i < 2 ? `appt-${i + 1}` : null,
      session_number: i + 1,
      status: i < 2 ? "completed" : i === 2 ? "scheduled" : "missed",
      notes: null,
      scheduled_at: i === 2 ? new Date(Date.now() + 2 * 86_400_000).toISOString() : null,
      completed_at: i < 2 ? new Date(Date.now() - (2 - i) * 14 * 86_400_000).toISOString() : null,
      created_at: new Date().toISOString(),
    } as TreatmentSession));
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("treatment_sessions")
    .select("*")
    .eq("plan_id", planId)
    .order("session_number");

  return (data ?? []) as TreatmentSession[];
}

/**
 * Token de sincronización iCal de un usuario.
 * Si no tiene token, genera uno y lo guarda.
 */
export async function getOrCreateCalendarToken(userId: string): Promise<string> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return "dev-ical-token-abc123";
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("calendar_sync_token")
    .eq("id", userId)
    .single();

  if (profile?.calendar_sync_token) return profile.calendar_sync_token;

  // Generar token aleatorio seguro
  const token = crypto.randomUUID().replace(/-/g, "");
  await supabase
    .from("profiles")
    .update({ calendar_sync_token: token })
    .eq("id", userId);

  return token;
}
