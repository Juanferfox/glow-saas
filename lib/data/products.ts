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
  "dev-fm-glow-studio": [
    { id: "prod-fmg-1", tenant_id: "dev-fm-glow-studio", name: { es: "Sérum Vitamina C" }, description: { es: "Sérum iluminador con vitamina C para todo tipo de piel" }, price: 85000, stock: 15, stock_alert_threshold: 5, image_url: null, category: "facial", active: true, created_at: new Date().toISOString() },
    { id: "prod-fmg-2", tenant_id: "dev-fm-glow-studio", name: { es: "Crema Hidratante Luxury" }, description: { es: "Crema hidratante de lujo con ácido hialurónico" }, price: 120000, stock: 8, stock_alert_threshold: 5, image_url: null, category: "facial", active: true, created_at: new Date().toISOString() },
    { id: "prod-fmg-3", tenant_id: "dev-fm-glow-studio", name: { es: "Aceite Corporal Glow" }, description: { es: "Aceite corporal con brillo dorado y aroma floral" }, price: 65000, stock: 20, stock_alert_threshold: 5, image_url: null, category: "corporal", active: true, created_at: new Date().toISOString() },
    { id: "prod-fmg-4", tenant_id: "dev-fm-glow-studio", name: { es: "Kit Manicure Professional" }, description: { es: "Kit completo para manicure profesional en casa" }, price: 45000, stock: 12, stock_alert_threshold: 5, image_url: null, category: "uñas", active: true, created_at: new Date().toISOString() },
    { id: "prod-fmg-5", tenant_id: "dev-fm-glow-studio", name: { es: "Sérum Pestañas Crecimiento" }, description: { es: "Sérum fortalecedor para el crecimiento de pestañas" }, price: 95000, stock: 6, stock_alert_threshold: 5, image_url: null, category: "pestañas", active: true, created_at: new Date().toISOString() },
    { id: "prod-fmg-6", tenant_id: "dev-fm-glow-studio", name: { es: "Mascarilla Capilar Keratina" }, description: { es: "Mascarilla reparadora con keratina para cabello dañado" }, price: 55000, stock: 10, stock_alert_threshold: 5, image_url: null, category: "capilar", active: true, created_at: new Date().toISOString() },
  ],
};

// Map editable en memoria para dev mode
const editedProducts = new Map<string, Partial<ProductRow>>();

export function updateDevProduct(id: string, changes: Partial<ProductRow>) {
  editedProducts.set(id, { ...editedProducts.get(id), ...changes });
}

export function getEditedProductChanges(): Map<string, Partial<ProductRow>> {
  return editedProducts;
}

/**
 * Obtiene los productos activos de un tenant.
 */
export const getProducts = cache(async (tenantId: string): Promise<ProductRow[]> => {
  const isDevMode = !process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    const base = DEV_PRODUCTS[tenantId] ?? [];
    return base.map((p) => {
      const edits = editedProducts.get(p.id);
      if (!edits) return p;
      return { ...p, ...edits };
    });
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
    const base = DEV_PRODUCTS[tenantId] ?? [];
    return base.map((p) => {
      const edits = editedProducts.get(p.id);
      if (!edits) return p;
      return { ...p, ...edits };
    });
  }
});
