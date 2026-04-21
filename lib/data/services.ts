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

  // ── Channel Spa — Colombia (placeholder hasta recibir lista real) ──────────
  "dev-channel-spa": [
    { id: "cs-1", name: { es: "Facial de limpieza profunda" },  description: { es: "Limpieza, exfoliación e hidratación intensiva con productos premium" },                         duration_min: 60, price: 85000,  category: "facial",     image_url: null, sort_order: 1 },
    { id: "cs-2", name: { es: "Masaje relajante" },             description: { es: "Masaje de cuerpo completo con aceites esenciales importados" },                                  duration_min: 60, price: 120000, category: "masaje",     image_url: null, sort_order: 2 },
    { id: "cs-3", name: { es: "Masaje descontracturante" },     description: { es: "Técnica de tejido profundo para liberar tensión muscular acumulada" },                           duration_min: 90, price: 150000, category: "masaje",     image_url: null, sort_order: 3 },
    { id: "cs-4", name: { es: "Manicure permanente" },          description: { es: "Esmaltado semipermanente de larga duración con tratamiento de cutículas" },                      duration_min: 60, price: 65000,  category: "uñas",       image_url: null, sort_order: 4 },
    { id: "cs-5", name: { es: "Pedicure spa" },                 description: { es: "Baño de pies, exfoliación, masaje y esmaltado" },                                               duration_min: 75, price: 75000,  category: "uñas",       image_url: null, sort_order: 5 },
    { id: "cs-6", name: { es: "Depilación con cera" },          description: { es: "Depilación de piernas, bikini o axilas con cera tibia" },                                        duration_min: 45, price: 55000,  category: "depilacion", image_url: null, sort_order: 6 },
    { id: "cs-7", name: { es: "Lifting de pestañas" },          description: { es: "Rizado y nutrición de pestañas con efecto lifting — plan de sesiones disponible" },              duration_min: 75, price: 95000,  category: "ojos",       image_url: null, sort_order: 7 },
    { id: "cs-8", name: { es: "Tratamiento capilar" },          description: { es: "Hidratación y nutrición profunda para cabello dañado o reseco" },                               duration_min: 60, price: 90000,  category: "cabello",    image_url: null, sort_order: 8 },
  ],

  // ── Gio Spa — USA (placeholder hasta recibir lista real) ─────────────────
  "dev-gio-spa": [
    { id: "gi-1", name: { en: "Hydrating Facial",        es: "Facial hidratante"          }, description: { en: "Deep cleanse, tone and hydration with premium serums",          es: "Limpieza profunda, tónico e hidratación con sérum premium"       }, duration_min: 60, price: 95,  category: "facial",   image_url: null, sort_order: 1 },
    { id: "gi-2", name: { en: "Relaxation Massage",      es: "Masaje relajante"           }, description: { en: "Swedish full-body massage with essential oils",                 es: "Masaje sueco de cuerpo completo con aceites esenciales"         }, duration_min: 60, price: 110, category: "massage",  image_url: null, sort_order: 2 },
    { id: "gi-3", name: { en: "Hot Stone Massage",       es: "Masaje de piedras calientes"}, description: { en: "Thermal stone therapy for deep muscle relaxation",              es: "Terapia de piedras termales para relajación muscular profunda"  }, duration_min: 90, price: 145, category: "massage",  image_url: null, sort_order: 3 },
    { id: "gi-4", name: { en: "Gel Manicure",            es: "Manicure en gel"            }, description: { en: "Long-lasting gel polish with cuticle care and massage",         es: "Esmalte en gel de larga duración con cuidado de cutículas"     }, duration_min: 45, price: 55,  category: "nails",    image_url: null, sort_order: 4 },
    { id: "gi-5", name: { en: "Luxury Pedicure",         es: "Pedicure de lujo"           }, description: { en: "Spa pedicure with scrub, mask, massage and polish",             es: "Pedicure spa con exfoliación, mascarilla, masaje y esmalte"    }, duration_min: 60, price: 75,  category: "nails",    image_url: null, sort_order: 5 },
    { id: "gi-6", name: { en: "Brow & Lash Tinting",    es: "Tinte cejas y pestañas"     }, description: { en: "Semi-permanent tint for defined brows and fuller-looking lashes", es: "Tinte semipermanente para cejas y pestañas definidas"        }, duration_min: 30, price: 45,  category: "eyes",     image_url: null, sort_order: 6 },
    { id: "gi-7", name: { en: "Detox Body Wrap",         es: "Envoltura corporal detox"   }, description: { en: "Full-body detox or hydration wrap with aromatic application",   es: "Envoltura corporal detox o hidratante con aplicación aromática"}, duration_min: 75, price: 120, category: "body",     image_url: null, sort_order: 7 },
    { id: "gi-8", name: { en: "Couples Massage",         es: "Masaje en pareja"           }, description: { en: "Side-by-side Swedish massage for two in a private suite",       es: "Masaje sueco en pareja en suite privada"                       }, duration_min: 60, price: 200, category: "massage",  image_url: null, sort_order: 8 },
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
