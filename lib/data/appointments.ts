import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Appointment } from "@/lib/supabase/types";

/**
 * Obtiene las citas del usuario autenticado para un tenant, ordenadas por fecha desc.
 * No usa cache() porque el contenido cambia frecuentemente.
 */
export async function getMyAppointments(
  tenantId: string
): Promise<any[]> {
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
    
    return data.map((a: any) => ({
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
