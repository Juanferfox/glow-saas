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

// Map editable en memoria para dev mode
const editedServices = new Map<string, Partial<ServiceRow>>();

export function updateDevService(id: string, changes: Partial<ServiceRow>) {
  editedServices.set(id, { ...editedServices.get(id), ...changes });
}

export function getEditedServiceChanges(): Map<string, Partial<ServiceRow>> {
  return editedServices;
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

  // ── Glow Studio — POC completo con todos los servicios ───────────────────
  "dev-glow-studio": [
    // ─ Faciales ─────────────────────────────────────────────────────────────
    { id: "fg-1",  name: { es: "Facial Glow Signature",            en: "Glow Signature Facial"        }, description: { es: "Ritual exclusivo de limpieza, sérum vitamina C y mascarilla iluminadora", en: "Exclusive ritual with cleansing, vitamin C serum and brightening mask" }, duration_min: 75, price: 120000, category: "facial",     image_url: null, sort_order: 1 },
    { id: "fg-2",  name: { es: "Limpieza profunda + extracción",   en: "Deep Cleanse & Extraction"    }, description: { es: "Limpieza, exfoliación enzimática y extracción profesional de comedones",  en: "Cleansing, enzyme exfoliation and professional comedone extraction"    }, duration_min: 60, price: 85000,  category: "facial",     image_url: null, sort_order: 2 },
    { id: "fg-3",  name: { es: "Hydrojelly Facial",                en: "Hydrojelly Facial"            }, description: { es: "Mascarilla jelly hidratante con ácido hialurónico y colágeno marino",     en: "Hydrating jelly mask with hyaluronic acid and marine collagen"         }, duration_min: 50, price: 95000,  category: "facial",     image_url: null, sort_order: 3 },
    // ─ Masajes ──────────────────────────────────────────────────────────────
    { id: "fg-4",  name: { es: "Masaje relajante",                 en: "Relaxation Massage"           }, description: { es: "Masaje sueco de cuerpo completo con aceites esenciales de lavanda",      en: "Swedish full-body massage with lavender essential oils"                }, duration_min: 60, price: 120000, category: "masaje",     image_url: null, sort_order: 4 },
    { id: "fg-5",  name: { es: "Masaje de tejido profundo",        en: "Deep Tissue Massage"          }, description: { es: "Técnica de presión profunda para liberar tensión muscular crónica",       en: "Deep pressure technique to release chronic muscle tension"             }, duration_min: 75, price: 145000, category: "masaje",     image_url: null, sort_order: 5 },
    { id: "fg-6",  name: { es: "Masaje de piedras calientes",      en: "Hot Stone Massage"            }, description: { es: "Terapia térmica con piedras de basalto y aceites aromáticos",             en: "Thermal therapy with basalt stones and aromatic oils"                  }, duration_min: 90, price: 180000, category: "masaje",     image_url: null, sort_order: 6 },
    // ─ Uñas ─────────────────────────────────────────────────────────────────
    { id: "fg-7",  name: { es: "Manicure permanente",              en: "Gel Manicure"                 }, description: { es: "Esmaltado semipermanente con tratamiento de cutículas y masaje de manos", en: "Semi-permanent polish with cuticle care and hand massage"              }, duration_min: 45, price: 60000,  category: "uñas",       image_url: null, sort_order: 7 },
    { id: "fg-8",  name: { es: "Pedicure spa completo",            en: "Spa Pedicure"                 }, description: { es: "Baño de pies, exfoliación, masaje de piernas y esmaltado con acabado spa", en: "Foot bath, scrub, leg massage and spa-finish polish"                   }, duration_min: 60, price: 70000,  category: "uñas",       image_url: null, sort_order: 8 },
    // ─ Ojos y cejas ─────────────────────────────────────────────────────────
    { id: "fg-9",  name: { es: "Lifting de pestañas",              en: "Lash Lift"                    }, description: { es: "Rizado semipermanente de pestañas con efecto lifting y nutrición — plan de 4 sesiones disponible", en: "Semi-permanent lash curl with lifting effect and nourishment — 4-session plan available" }, duration_min: 75, price: 95000, category: "ojos", image_url: null, sort_order: 9 },
    { id: "fg-10", name: { es: "Diseño de cejas con henna",        en: "Henna Brow Design"            }, description: { es: "Diseño profesional de cejas con depilación y tintura de henna",           en: "Professional brow shaping with wax removal and henna tint"            }, duration_min: 45, price: 55000,  category: "ojos",       image_url: null, sort_order: 10 },
    // ─ Depilación ───────────────────────────────────────────────────────────
    { id: "fg-11", name: { es: "Depilación con cera (zona media)", en: "Waxing (Half Body)"           }, description: { es: "Depilación de piernas, bikini o axilas con cera tibia hipoalergénica",    en: "Leg, bikini or underarm waxing with hypoallergenic warm wax"           }, duration_min: 45, price: 65000,  category: "depilacion", image_url: null, sort_order: 11 },
    // ─ Corporal ─────────────────────────────────────────────────────────────
    { id: "fg-12", name: { es: "Envoltura corporal detox",         en: "Detox Body Wrap"              }, description: { es: "Envoltura con arcilla volcánica y algas para eliminar toxinas y reafirmar", en: "Volcanic clay and algae wrap to detox and firm the skin"              }, duration_min: 90, price: 160000, category: "corporal",   image_url: null, sort_order: 12 },
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

  // ── FM Glow Studio — Colombia (Portafolio oficial 2026) ──────────────────
  "dev-fm-glow-studio": [
    // UÑAS
    { id: "fmg-u1", name: { es: "Manicura Tradicional" },                    description: { es: "Inmersión en agua, limpieza, maquillaje un solo tono o francés, exfoliación e hidratación" },                                                                                                      duration_min: 45,  price: 20000,  category: "uñas",     image_url: null, sort_order: 1  },
    { id: "fmg-u2", name: { es: "Pedicura Tradicional" },                    description: { es: "Inmersión en agua, limpieza, remoción piel muerta talones, maquillaje un solo tono o francés, exfoliación e hidratación" },                                                                         duration_min: 60,  price: 25000,  category: "uñas",     image_url: null, sort_order: 2  },
    { id: "fmg-u3", name: { es: "Uñas Semipermanente" },                     description: { es: "Inmersión en agua, limpieza, maquillaje a elección, exfoliación e hidratación" },                                                                                                                   duration_min: 60,  price: 40000,  category: "uñas",     image_url: null, sort_order: 3  },
    { id: "fmg-u4", name: { es: "Pedicura Semipermanente" },                 description: { es: "Inmersión en agua, limpieza, remoción piel muerta talones, maquillaje a elección, exfoliación e hidratación" },                                                                                     duration_min: 70,  price: 37000,  category: "uñas",     image_url: null, sort_order: 4  },
    { id: "fmg-u5", name: { es: "Forrado Uña Natural" },                     description: { es: "Inmersión en agua, limpieza, refuerzo con polygel o acrílico, maquillaje a elección, exfoliación e hidratación. Retoque 45K" },                                                                    duration_min: 90,  price: 65000,  category: "uñas",     image_url: null, sort_order: 5  },
    { id: "fmg-u6", name: { es: "Uñas Press On" },                           description: { es: "Inmersión en agua, limpieza, uñas press on sobre la uña natural, maquillaje sencillo a elección, exfoliación e hidratación. Retoque 45K" },                                                       duration_min: 75,  price: 70000,  category: "uñas",     image_url: null, sort_order: 6  },
    { id: "fmg-u7", name: { es: "Reparación Uña Quebrada" },                 description: { es: "Retiro del material, limpieza, reparación y maquillaje. Forrada 10K / Press On 5K" },                                                                                                              duration_min: 20,  price: 10000,  category: "uñas",     image_url: null, sort_order: 7  },
    { id: "fmg-u8", name: { es: "Retiro Semipermanente" },                   description: { es: "Retiro seguro de esmalte semipermanente" },                                                                                                                                                          duration_min: 20,  price: 10000,  category: "uñas",     image_url: null, sort_order: 8  },
    { id: "fmg-u9", name: { es: "Retiro Acrílico (otro lugar)" },            description: { es: "Retiro de acrílico aplicado en otro establecimiento" },                                                                                                                                              duration_min: 30,  price: 15000,  category: "uñas",     image_url: null, sort_order: 9  },
    // PESTAÑAS
    { id: "fmg-p1", name: { es: "Set Natural de Pestañas" },                 description: { es: "Pestañas pelo a pelo, muy naturales. Elevan tu mirada y lucen como si no llevaras pestañas puestas" },                                                                                             duration_min: 90,  price: 60000,  category: "pestañas", image_url: null, sort_order: 10 },
    { id: "fmg-p2", name: { es: "Set Pestañina" },                           description: { es: "Pestañas naturales con efecto como si tuvieras rimel puesto" },                                                                                                                                     duration_min: 90,  price: 70000,  category: "pestañas", image_url: null, sort_order: 11 },
    { id: "fmg-p3", name: { es: "Set Premium de Pestañas" },                 description: { es: "Pestañas con un toque de volumen para que se noten más en tu mirada" },                                                                                                                             duration_min: 90,  price: 80000,  category: "pestañas", image_url: null, sort_order: 12 },
    { id: "fmg-p4", name: { es: "Volumen Ruso" },                            description: { es: "Pestañas con volumen de 2D hasta 5D, abundantes y muy notorias" },                                                                                                                                  duration_min: 120, price: 100000, category: "pestañas", image_url: null, sort_order: 13 },
    { id: "fmg-p5", name: { es: "Lifting de Pestañas" },                     description: { es: "Encrespa tus pestañas naturales hasta por 1 mes" },                                                                                                                                                 duration_min: 60,  price: 55000,  category: "pestañas", image_url: null, sort_order: 14 },
    // CEJAS
    { id: "fmg-c1", name: { es: "Diseño, Depilación y Sombreado de Cejas" }, description: { es: "Depilación con cuchilla, hilo o cera más sombreado temporal para cejas definidas" },                                                                                                               duration_min: 30,  price: 25000,  category: "cejas",    image_url: null, sort_order: 15 },
    { id: "fmg-c2", name: { es: "Laminado de Cejas" },                       description: { es: "Alisa las cejas para darles fijación, quedan peinadas y con forma sin necesidad de otro producto" },                                                                                               duration_min: 45,  price: 35000,  category: "cejas",    image_url: null, sort_order: 16 },
    { id: "fmg-c3", name: { es: "Micropigmentación de Cejas" },              description: { es: "Implantación de pigmentos en la piel para mejorar la apariencia, cubrir zonas despobladas y crear efecto de cejas pobladas y definidas. Retoque gratis" },                                         duration_min: 120, price: 150000, category: "cejas",    image_url: null, sort_order: 17 },
    // LABIOS
    { id: "fmg-l1", name: { es: "Baby Lips — Hidratación de Labios" },       description: { es: "Hidratación profunda de labios con dermapen, dando también un toque de color" },                                                                                                                    duration_min: 60,  price: 120000, category: "labios",   image_url: null, sort_order: 18 },
    { id: "fmg-l2", name: { es: "Aumento de Labios" },                       description: { es: "Aplicación de ácido hialurónico para hidratar y aumentar los labios de forma natural. Asesoría personalizada incluida. Baja densidad 100K" },                                                     duration_min: 60,  price: 100000, category: "labios",   image_url: null, sort_order: 19 },
    { id: "fmg-l3", name: { es: "Micropigmentación de Labios" },             description: { es: "Implantación de pigmentos en la capa superficial de los labios para mejorar color, forma y definición" },                                                                                          duration_min: 120, price: 200000, category: "labios",   image_url: null, sort_order: 20 },
    // CAPILAR
    { id: "fmg-k1", name: { es: "Vitaminas para Cuero Cabelludo" },          description: { es: "Aplicación de vitaminas que estimulan el crecimiento y detienen o evitan la caída del cabello" },                                                                                                   duration_min: 45,  price: 80000,  category: "capilar",  image_url: null, sort_order: 21 },
    { id: "fmg-k2", name: { es: "Alisado Progresivo" },                      description: { es: "Tratamiento que reestructura la fibra capilar, elimina el frizz y suaviza el cabello. Cada sesión va alisando más" },                                                                              duration_min: 90,  price: 50000,  category: "capilar",  image_url: null, sort_order: 22 },
    { id: "fmg-k3", name: { es: "Keratina Orgánica" },                       description: { es: "Alisado completo con keratina sin formol ni químicos fuertes. Precio según largo del cabello, desde 80K" },                                                                                        duration_min: 120, price: 80000,  category: "capilar",  image_url: null, sort_order: 23 },
    // FACIAL
    { id: "fmg-f1", name: { es: "Limpieza Facial Sencilla" },                description: { es: "Limpieza profunda, exfoliación, vapor ozono, extracción de comedones, mascarilla descongestiva e hidratante, tónico y antisolar" },                                                               duration_min: 60,  price: 60000,  category: "facial",   image_url: null, sort_order: 24 },
    { id: "fmg-f2", name: { es: "Limpieza Facial Profunda" },                description: { es: "Limpieza, exfoliación, mascarillas, vapor ozono, extracción de comedones, peeling ultrasónico, alta frecuencia o máscara LED, velo hidratante y antisolar" },                                    duration_min: 75,  price: 90000,  category: "facial",   image_url: null, sort_order: 25 },
    { id: "fmg-f3", name: { es: "Plasma Rico en Plaquetas (PRP)" },          description: { es: "Limpieza profunda, exfoliación, extracción de sangre, aplicación de plasma y mascarilla vampiro a elección" },                                                                                     duration_min: 90,  price: 130000, category: "facial",   image_url: null, sort_order: 26 },
    { id: "fmg-f4", name: { es: "Dermapen / BB Glow / Porcelanización" },    description: { es: "Limpieza profunda, exfoliación y aplicación de ampolla según necesidad del cliente con dermapen" },                                                                                                duration_min: 90,  price: 130000, category: "facial",   image_url: null, sort_order: 27 },
    // CORPORAL
    { id: "fmg-b1", name: { es: "Sueroterapia" },                            description: { es: "Suero personalizado según tu necesidad: detox, quema grasa, resaca, defensas, rejuvenecimiento, no toxic o focus. Asesoría gratuita incluida" },                                                  duration_min: 60,  price: 90000,  category: "corporal", image_url: null, sort_order: 28 },
    { id: "fmg-b2", name: { es: "Masaje + Quemador (Reducción)" },           description: { es: "Elimina grasa localizada y mejora la forma corporal con drenaje linfático, maderoterapia y quemador en mesoterapia" },                                                                             duration_min: 60,  price: 70000,  category: "corporal", image_url: null, sort_order: 29 },
    { id: "fmg-b3", name: { es: "Masaje + Peptonas / Tonificante" },         description: { es: "Tonificación de glúteos, abdomen o pierna con masaje, maderoterapia y mesoterapia para piel tersa y suave" },                                                                                      duration_min: 60,  price: 70000,  category: "corporal", image_url: null, sort_order: 30 },
    { id: "fmg-b4", name: { es: "Masaje de Relajación" },                    description: { es: "Sesión para reducción de estrés, tensión muscular y dolor. Mejora estado de ánimo, circulación y sueño" },                                                                                        duration_min: 75,  price: 80000,  category: "corporal", image_url: null, sort_order: 31 },
    { id: "fmg-b5", name: { es: "Paquete Redumax" },                         description: { es: "10 sesiones drenaje linfático + maderoterapia · 8 quemadores · 1 sesión hidrolipoclasia · 3 ampollas alcachofa · 1 purgante Detox · 1 fibra para bajar de peso" },                               duration_min: 60,  price: 750000, category: "corporal", image_url: null, sort_order: 32 },
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
    const base = DEV_SERVICES[tenantId] ?? [];
    return base.map((s) => {
      const edits = editedServices.get(s.id);
      if (!edits) return s;
      return { ...s, ...edits };
    });
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
    const base = DEV_SERVICES[tenantId] ?? [];
    return base.map((s) => {
      const edits = editedServices.get(s.id);
      if (!edits) return s;
      return { ...s, ...edits };
    });
  }
});
