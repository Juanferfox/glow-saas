import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export interface InventoryMovement {
  id: string;
  product_name: Record<string, string>;
  type: "entrada" | "salida" | "ajuste";
  quantity: number;
  reason: string | null;
  created_at: string;
}

/**
 * Obtiene el historial de movimientos de inventario de un tenant.
 */
export async function getInventoryMovements(tenantId: string) {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
  if (isDevMode) return [];

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("inventory_movements")
      .select(`
        *,
        product:products(name)
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    
    return (data as (InventoryMovement & { product: { name: Record<string, string> } | null })[]).map((m) => ({
      ...m,
      product_name: m.product?.name ?? { es: "Producto" },
    }));
  } catch {
    return [];
  }
}

export interface OrderWithDetails {
  id: string;
  total: number;
  status: string;
  created_at: string;
  points_used: number;
  client: { full_name: string; avatar_url: string | null };
  items: {
    id: string;
    quantity: number;
    unit_price: number;
    product: { name: Record<string, string> };
  }[];
}

/**
 * Obtiene el historial de ventas (pedidos confirmados/entregados).
 */
export async function getSalesHistory(tenantId: string): Promise<OrderWithDetails[]> {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
  if (isDevMode) return [];

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        client:profiles(full_name, avatar_url),
        items:order_items(
          *,
          product:products(name)
        )
      `)
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !data) return [];
    return data as unknown as OrderWithDetails[];
  } catch {
    return [];
  }
}
