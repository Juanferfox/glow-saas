import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProductRow {
  id: string;
  tenant_id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  price: number;
  stock: number;
  stock_alert_threshold: number;
  image_url: string | null;
  category: string | null;
  active: boolean;
  created_at: string;
}

const DEV_PRODUCTS: Record<string, ProductRow[]> = {
  "dev-spa-luna": [
    { id: "p1", tenant_id: "dev-spa-luna", name: { es: "Óleo facial de argán" }, description: { es: "Aceite puro de argán para hidratación profunda." }, price: 45000, stock: 15, stock_alert_threshold: 5, image_url: null, category: "skincare", active: true, created_at: new Date().toISOString() },
    { id: "p2", tenant_id: "dev-spa-luna", name: { es: "Crema exfoliante café" }, description: { es: "Exfoliante corporal natural con aroma a café." }, price: 35000, stock: 8, stock_alert_threshold: 5, image_url: null, category: "body", active: true, created_at: new Date().toISOString() },
    { id: "p3", tenant_id: "dev-spa-luna", name: { es: "Sérum con Vitamina C" }, description: { es: "Sérum iluminador y antioxidante para el rostro." }, price: 65000, stock: 3, stock_alert_threshold: 5, image_url: null, category: "skincare", active: true, created_at: new Date().toISOString() },
  ],
  "dev-glam-studio": [
    { id: "p4", tenant_id: "dev-glam-studio", name: { en: "Purple Shampoo", es: "Champú matizador" }, description: { en: "Eliminates brassy tones in blonde hair.", es: "Elimina tonos amarillentos en cabello rubio." }, price: 28, stock: 20, stock_alert_threshold: 5, image_url: null, category: "hair", active: true, created_at: new Date().toISOString() },
    { id: "p5", tenant_id: "dev-glam-studio", name: { en: "Argon Oil Serum", es: "Sérum de Argán" }, description: { en: "Heat protection and shine for all hair types.", es: "Protección térmica y brillo para todo tipo de cabello." }, price: 34, stock: 12, stock_alert_threshold: 5, image_url: null, category: "hair", active: true, created_at: new Date().toISOString() },
  ],
};

/**
 * Obtiene los productos activos de un tenant.
 */
export const getProducts = cache(async (tenantId: string): Promise<ProductRow[]> => {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return DEV_PRODUCTS[tenantId] ?? [];
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as ProductRow[];
  } catch {
    return DEV_PRODUCTS[tenantId] ?? [];
  }
});
