import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export interface SystemNotification {
  id: string;
  type: "appointment" | "inventory" | "marketing" | "system";
  title: Record<string, string>;
  content: Record<string, string>;
  read: boolean;
  created_at: string;
}

/**
 * Obtiene las notificaciones del usuario actual.
 */
export const getMyNotifications = cache(async (tenantId: string) => {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return [
      {
        id: "n1",
        type: "appointment",
        title: { es: "Recordatorio de Cita", en: "Appointment Reminder" },
        content: { es: "Tienes una cita mañana a las 10:00 AM.", en: "You have an appointment tomorrow at 10:00 AM." },
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "n2",
        type: "inventory",
        title: { es: "Producto Agotado", en: "Product Out of Stock" },
        content: { es: "El producto 'Óleo de Argán' se ha agotado.", en: "Product 'Argan Oil' is out of stock." },
        read: true,
        created_at: new Date(Date.now() - 86400000).toISOString(),
      }
    ] as SystemNotification[];
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;
    return data as SystemNotification[];
  } catch {
    return [];
  }
});
