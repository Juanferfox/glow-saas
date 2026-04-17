import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/supabase/types";

/**
 * Tipo extendido para citas que incluye datos de joins (UI-friendly).
 */
export type AppointmentWithDetails = Appointment & {
  service_name: Record<string, string>;
  specialist_name: string;
};

/**
 * Obtiene las citas del usuario autenticado para un tenant, ordenadas por fecha desc.
 */
export async function getMyAppointments(
  tenantId: string
): Promise<AppointmentWithDetails[]> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("appointments")
      .select(`
        *,
        service_name:services(name),
        specialist_name:specialists(name)
      `)
      .eq("tenant_id", tenantId)
      .eq("client_id", user.id)
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(20);

    if (error || !data) return [];
    
    type RawAppointment = Appointment & {
      service_name: { name: Record<string, string> } | null;
      specialist_name: { name: string } | null;
    };

    return (data as unknown as RawAppointment[]).map((a) => ({
      ...a,
      service_name: a.service_name?.name ?? { es: "Servicio" },
      specialist_name: a.specialist_name?.name ?? "Especialista",
    }));
  } catch {
    return [];
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
