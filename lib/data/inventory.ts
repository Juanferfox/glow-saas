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
    
    return (data as unknown as (InventoryMovement & { product: { name: Record<string, string> } | null })[]).map((m) => ({
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
const _now = new Date();
const DEV_SALES: Record<string, OrderWithDetails[]> = {
  "dev-fm-glow-studio": [
    { id: "ord-1", total: 85000,  status: "delivered", created_at: new Date(_now.getTime() - 1 * 3600000).toISOString(),   points_used: 0, client: { full_name: "Laura Martínez",  avatar_url: null }, items: [{ id: "oi-1", quantity: 1, unit_price: 85000,  product: { name: { es: "Sérum Vitamina C Glow" } } }] },
    { id: "ord-2", total: 120000, status: "delivered", created_at: new Date(_now.getTime() - 3 * 3600000).toISOString(),   points_used: 0, client: { full_name: "Sofía Restrepo",   avatar_url: null }, items: [{ id: "oi-2", quantity: 1, unit_price: 120000, product: { name: { es: "Crema Hidratante Luxury" } } }] },
    { id: "ord-3", total: 65000,  status: "delivered", created_at: new Date(_now.getTime() - 86400000).toISOString(),       points_used: 0, client: { full_name: "Paula Vargas",     avatar_url: null }, items: [{ id: "oi-3", quantity: 1, unit_price: 65000,  product: { name: { es: "Aceite Corporal Rosa FM" } } }] },
    { id: "ord-4", total: 113000, status: "delivered", created_at: new Date(_now.getTime() - 2 * 86400000).toISOString(),   points_used: 0, client: { full_name: "Andrea López",     avatar_url: null }, items: [{ id: "oi-4", quantity: 1, unit_price: 95000, product: { name: { es: "Sérum Crecimiento Pestañas" } } }, { id: "oi-5", quantity: 1, unit_price: 18000, product: { name: { es: "Tónico Facial" } } }] },
    { id: "ord-5", total: 55000,  status: "delivered", created_at: new Date(_now.getTime() - 3 * 86400000).toISOString(),   points_used: 200, client: { full_name: "Laura Martínez", avatar_url: null }, items: [{ id: "oi-6", quantity: 1, unit_price: 55000, product: { name: { es: "Mascarilla Capilar Keratina" } } }] },
    { id: "ord-6", total: 45000,  status: "delivered", created_at: new Date(_now.getTime() - 5 * 86400000).toISOString(),   points_used: 0, client: { full_name: "Camila Torres",    avatar_url: null }, items: [{ id: "oi-7", quantity: 1, unit_price: 45000, product: { name: { es: "Kit Manicure Professional" } } }] },
    { id: "ord-7", total: 72000,  status: "delivered", created_at: new Date(_now.getTime() - 7 * 86400000).toISOString(),   points_used: 0, client: { full_name: "Mariana Gómez",    avatar_url: null }, items: [{ id: "oi-8", quantity: 1, unit_price: 72000, product: { name: { es: "Protector Solar SPF 50+" } } }] },
  ],
};

export async function getSalesHistory(tenantId: string): Promise<OrderWithDetails[]> {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
  if (isDevMode) return DEV_SALES[tenantId] ?? [];

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
