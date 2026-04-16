import "server-only";
import { createClient } from "@/lib/supabase/server";
import { cache } from "react";

export interface CouponRow {
  id: string;
  tenant_id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  amount: number;
  min_purchase: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

/**
 * Valida un código de cupón para un tenant.
 */
export async function validateCoupon(tenantId: string, code: string): Promise<CouponRow | null> {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    if (code.toUpperCase() === "BIENVENIDA20") {
      return {
        id: "c1",
        tenant_id: tenantId,
        code: "BIENVENIDA20",
        discount_type: "percentage",
        amount: 20,
        min_purchase: 0,
        expires_at: null,
        active: true,
        created_at: new Date().toISOString(),
      };
    }
    return null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("code", code.toUpperCase())
      .eq("active", true)
      .single();

    if (error || !data) return null;

    // Verificar expiración
    if (data.expires_at && new Date(data.expires_at) < new Date()) return null;

    return data as CouponRow;
  } catch {
    return null;
  }
}

/**
 * Obtiene las campañas activas para el Admin.
 */
export const getActiveCoupons = cache(async (tenantId: string) => {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
  if (isDevMode) return [];

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coupons")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    return data as CouponRow[];
  } catch {
    return [];
  }
});
