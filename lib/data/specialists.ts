import "server-only";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import type { Specialist, SpecialistSchedule } from "@/lib/supabase/types";

// ─── Dev data ────────────────────────────────────────────────────────────────

const DEV_SPECIALISTS: Record<string, Specialist[]> = {
  "dev-spa-luna": [
    { id: "sl-sp-1", tenant_id: "dev-spa-luna", profile_id: null, name: "Valentina Ríos",   bio: { es: "Especialista en tratamientos faciales con 8 años de experiencia" }, avatar_url: null, services: ["sl-1","sl-5","sl-6"], active: true, created_at: "2024-01-01" },
    { id: "sl-sp-2", tenant_id: "dev-spa-luna", profile_id: null, name: "Camila Torres",    bio: { es: "Masajista terapéutica certificada" },                               avatar_url: null, services: ["sl-2","sl-1"], active: true, created_at: "2024-01-01" },
    { id: "sl-sp-3", tenant_id: "dev-spa-luna", profile_id: null, name: "Isabella Mora",    bio: { es: "Experta en nail art y tratamientos de uñas" },                      avatar_url: null, services: ["sl-3","sl-4"], active: true, created_at: "2024-01-01" },
  ],
  // ── Channel Spa ────────────────────────────────────────────────────────────
  "dev-channel-spa": [
    { id: "cs-sp-1", tenant_id: "dev-channel-spa", profile_id: null, name: "Sofía Restrepo",  bio: { es: "Especialista en tratamientos faciales y lifting con 6 años de experiencia" }, avatar_url: null, services: ["cs-1","cs-7"], active: true, created_at: "2024-01-01" },
    { id: "cs-sp-2", tenant_id: "dev-channel-spa", profile_id: null, name: "Mariana Castillo", bio: { es: "Masajista certificada en técnicas suecas y tejido profundo" },               avatar_url: null, services: ["cs-2","cs-3"], active: true, created_at: "2024-01-01" },
    { id: "cs-sp-3", tenant_id: "dev-channel-spa", profile_id: null, name: "Daniela Ospina",   bio: { es: "Técnica en uñas con especialización en semipermanente" },                    avatar_url: null, services: ["cs-4","cs-5"], active: true, created_at: "2024-01-01" },
  ],

  // ── Gio Spa ────────────────────────────────────────────────────────────────
  "dev-gio-spa": [
    { id: "gi-sp-1", tenant_id: "dev-gio-spa", profile_id: null, name: "Giovanna Ferrara", bio: { en: "Lead esthetician specializing in facial treatments and wellness", es: "Esteticista líder especializada en tratamientos faciales" }, avatar_url: null, services: ["gi-1","gi-6","gi-7"], active: true, created_at: "2024-01-01" },
    { id: "gi-sp-2", tenant_id: "dev-gio-spa", profile_id: null, name: "Mia Chen",         bio: { en: "Certified massage therapist, Swedish and hot stone specialist",   es: "Masajista certificada en sueco y piedras calientes"          }, avatar_url: null, services: ["gi-2","gi-3","gi-8"], active: true, created_at: "2024-01-01" },
    { id: "gi-sp-3", tenant_id: "dev-gio-spa", profile_id: null, name: "Valeria Santos",   bio: { en: "Nail technician and lash/brow specialist",                        es: "Técnica en uñas y especialista en cejas/pestañas"          }, avatar_url: null, services: ["gi-4","gi-5","gi-6"], active: true, created_at: "2024-01-01" },
  ],

  "dev-glam-studio": [
    { id: "gs-sp-1", tenant_id: "dev-glam-studio", profile_id: null, name: "Alex Ramírez",  bio: { en: "Senior stylist with 10 years in the industry", es: "Estilista senior con 10 años en la industria" }, avatar_url: null, services: ["gs-1","gs-2","gs-3","gs-4"], active: true, created_at: "2024-01-01" },
    { id: "gs-sp-2", tenant_id: "dev-glam-studio", profile_id: null, name: "Sofia Nails",   bio: { en: "Nail art specialist", es: "Especialista en nail art" },              avatar_url: null, services: ["gs-5"], active: true, created_at: "2024-01-01" },
  ],
};

// Schedules: lun-sáb 09:00-18:00, domingo cerrado (day_of_week: 0)
function buildSchedules(
  tenantId: string,
  specialists: Specialist[]
): SpecialistSchedule[] {
  const schedules: SpecialistSchedule[] = [];
  let idx = 1;
  for (const sp of specialists) {
    for (let day = 1; day <= 6; day++) { // lunes=1 … sábado=6
      schedules.push({
        id: `${sp.id}-day${day}`,
        specialist_id: sp.id,
        tenant_id: tenantId,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "18:00:00",
        is_working: true,
      });
      idx++;
    }
    // Domingo cerrado
    schedules.push({
      id: `${sp.id}-day0`,
      specialist_id: sp.id,
      tenant_id: tenantId,
      day_of_week: 0,
      start_time: "09:00:00",
      end_time: "09:00:00",
      is_working: false,
    });
  }
  return schedules;
}

const DEV_SCHEDULES: Record<string, SpecialistSchedule[]> = {
  "dev-spa-luna":     buildSchedules("dev-spa-luna",     DEV_SPECIALISTS["dev-spa-luna"]!),
  "dev-channel-spa":  buildSchedules("dev-channel-spa",  DEV_SPECIALISTS["dev-channel-spa"]!),
  "dev-gio-spa":      buildSchedules("dev-gio-spa",      DEV_SPECIALISTS["dev-gio-spa"]!),
  "dev-glam-studio":  buildSchedules("dev-glam-studio",  DEV_SPECIALISTS["dev-glam-studio"]!),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

// ─── Exports ────────────────────────────────────────────────────────────────

/**
 * Devuelve los especialistas activos de un tenant ordenados por nombre.
 */
export const getSpecialists = cache(
  async (tenantId: string): Promise<Specialist[]> => {
    if (isDevMode()) return DEV_SPECIALISTS[tenantId] ?? [];

    try {
      const supabase = await createServiceClient();
      const { data, error } = await supabase
        .from("specialists")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("active", true)
        .order("name");
      if (error || !data) return [];
      return data as Specialist[];
    } catch {
      return DEV_SPECIALISTS[tenantId] ?? [];
    }
  }
);

/**
 * Devuelve los horarios de todos los especialistas de un tenant.
 */
export const getSchedules = cache(
  async (tenantId: string): Promise<SpecialistSchedule[]> => {
    if (isDevMode()) return DEV_SCHEDULES[tenantId] ?? [];

    try {
      const supabase = await createServiceClient();
      const { data, error } = await supabase
        .from("specialist_schedules")
        .select("*")
        .eq("tenant_id", tenantId)
        .eq("is_working", true);
      if (error || !data) return [];
      return data as SpecialistSchedule[];
    } catch {
      return DEV_SCHEDULES[tenantId] ?? [];
    }
  }
);
