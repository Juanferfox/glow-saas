import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export interface PointsMovement {
  id: string;
  type: "ganados" | "canjeados";
  amount: number;
  reason: Record<string, string>;
  created_at: string;
}

/**
 * Obtiene el saldo actual y el historial de puntos de un usuario.
 */
export const getLoyaltyData = cache(async (tenantId: string) => {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return {
      balance: 450,
      history: [
        { id: "m1", type: "ganados", amount: 150, reason: { es: "Cita: Limpieza Facial" }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
        { id: "m2", type: "ganados", amount: 300, reason: { es: "Compra: Óleo de Argán" }, created_at: new Date(Date.now() - 86400000 * 5).toISOString() },
      ] as PointsMovement[],
    };
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { balance: 0, history: [] };

    // 1. Obtener balance del perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("loyalty_points")
      .eq("id", user.id)
      .eq("tenant_id", tenantId)
      .single();

    // 2. Obtener movimientos (asumiendo tabla point_movements existe según roadmap SQL)
    const { data: history, error } = await supabase
      .from("point_movements")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("client_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return {
      balance: profile?.loyalty_points ?? 0,
      history: history as PointsMovement[],
    };
  } catch {
    return { balance: 0, history: [] };
  }
});
