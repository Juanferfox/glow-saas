import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";

export interface ServiceRow {
  id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  duration_min: number;
  price: number;
  category: string | null;
  image_url: string | null;
  sort_order: number;
}

// Servicios de dev hardcodeados (sin Supabase)
const DEV_SERVICES: Record<string, ServiceRow[]> = {
  "dev-spa-luna": [
    { id: "sl-1", name: { es: "Facial hidratante" },   description: { es: "Limpieza profunda e hidratación con productos premium" }, duration_min: 60, price: 85000,  category: "facial",     image_url: null, sort_order: 1 },
    { id: "sl-2", name: { es: "Masaje relajante" },    description: { es: "Masaje de cuerpo completo con aceites esenciales" },       duration_min: 75, price: 120000, category: "masaje",     image_url: null, sort_order: 2 },
    { id: "sl-3", name: { es: "Manicure spa" },        description: { es: "Manicure completo con exfoliación y masaje de manos" },    duration_min: 45, price: 45000,  category: "uñas",       image_url: null, sort_order: 3 },
    { id: "sl-4", name: { es: "Pedicure spa" },        description: { es: "Pedicure completo con baño de pies y masaje" },            duration_min: 60, price: 55000,  category: "uñas",       image_url: null, sort_order: 4 },
    { id: "sl-5", name: { es: "Lifting de pestañas" }, description: { es: "Rizado semipermanente con efecto lifting natural" },       duration_min: 75, price: 95000,  category: "ojos",       image_url: null, sort_order: 5 },
    { id: "sl-6", name: { es: "Depilación facial" },   description: { es: "Depilación con hilo o cera para cejas y labio" },          duration_min: 30, price: 35000,  category: "depilacion", image_url: null, sort_order: 6 },
  ],
  "dev-glam-studio": [
    { id: "gs-1", name: { en: "Precision Haircut", es: "Corte de precisión" }, description: { en: "Expert cut tailored to your face shape", es: "Corte experto según tu forma de cara" }, duration_min: 45, price: 65,  category: "hair",  image_url: null, sort_order: 1 },
    { id: "gs-2", name: { en: "Full Color",        es: "Color completo"   }, description: { en: "Single-process permanent color with gloss", es: "Color permanente de proceso único con gloss" }, duration_min: 90, price: 120, category: "color", image_url: null, sort_order: 2 },
    { id: "gs-3", name: { en: "Highlights",        es: "Mechas"           }, description: { en: "Balayage or foil highlights for dimension", es: "Balayage o mechas con papel para volumen" }, duration_min: 120, price: 160, category: "color", image_url: null, sort_order: 3 },
    { id: "gs-4", name: { en: "Blowout & Style",   es: "Secado y peinado" }, description: { en: "Shampoo, blow-dry and finish styling", es: "Champú, secado y peinado final" }, duration_min: 45, price: 55,  category: "hair",  image_url: null, sort_order: 4 },
    { id: "gs-5", name: { en: "Gel Manicure",      es: "Manicure en gel"  }, description: { en: "Long-lasting gel polish with base coat", es: "Esmalte en gel de larga duración con base" }, duration_min: 50, price: 45,  category: "nails", image_url: null, sort_order: 5 },
  ],
};

/**
 * Obtiene los servicios activos de un tenant, ordenados por sort_order.
 * Cachea el resultado por request.
 */
export const getServices = cache(async (tenantId: string): Promise<ServiceRow[]> => {
  // Modo dev sin Supabase
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  ) {
    return DEV_SERVICES[tenantId] ?? [];
  }

  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase
      .from("services")
      .select("id, name, description, duration_min, price, category, image_url, sort_order")
      .eq("tenant_id", tenantId)
      .eq("active", true)
      .order("sort_order", { ascending: true })
      .limit(12);

    if (error || !data) return [];
    return data as ServiceRow[];
  } catch {
    return DEV_SERVICES[tenantId] ?? [];
  }
});
