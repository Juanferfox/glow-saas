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

  // ── Glow Studio ───────────────────────────────────────────────────────────
  "dev-glow-studio": [
    { id: "fg-sp-1", tenant_id: "dev-glow-studio", profile_id: "fg-worker-1", name: "Luna Vargas",     bio: { es: "Esteticista especializada en faciales y tratamientos de ojos con 7 años de experiencia", en: "Esthetician specializing in facials and eye treatments with 7 years experience" }, avatar_url: null, services: ["fg-1","fg-2","fg-3","fg-9","fg-10"], active: true, created_at: "2024-01-01" },
    { id: "fg-sp-2", tenant_id: "dev-glow-studio", profile_id: "fg-worker-2", name: "Catalina Peña",   bio: { es: "Masajista terapéutica certificada en técnicas suecas, tejido profundo y piedras calientes", en: "Certified massage therapist in Swedish, deep tissue and hot stone techniques" }, avatar_url: null, services: ["fg-4","fg-5","fg-6","fg-12"], active: true, created_at: "2024-01-01" },
    { id: "fg-sp-3", tenant_id: "dev-glow-studio", profile_id: "fg-worker-3", name: "Valentina Mora",  bio: { es: "Técnica en uñas y especialista en depilación con cera hipoalergénica", en: "Nail technician and hypoallergenic wax depilation specialist" }, avatar_url: null, services: ["fg-7","fg-8","fg-11"], active: true, created_at: "2024-01-01" },
    { id: "fg-sp-4", tenant_id: "dev-glow-studio", profile_id: "fg-worker-4", name: "Andrea Salcedo",  bio: { es: "Especialista integral en bienestar y belleza — atiende múltiples categorías de servicios", en: "Full-service beauty and wellness specialist across multiple service categories" }, avatar_url: null, services: ["fg-1","fg-2","fg-4","fg-7","fg-9","fg-11"], active: true, created_at: "2024-01-01" },
  ],

  "dev-glam-studio": [
    { id: "gs-sp-1", tenant_id: "dev-glam-studio", profile_id: null, name: "Alex Ramírez",  bio: { en: "Senior stylist with 10 years in the industry", es: "Estilista senior con 10 años en la industria" }, avatar_url: null, services: ["gs-1","gs-2","gs-3","gs-4"], active: true, created_at: "2024-01-01" },
    { id: "gs-sp-2", tenant_id: "dev-glam-studio", profile_id: null, name: "Sofia Nails",   bio: { en: "Nail art specialist", es: "Especialista en nail art" },              avatar_url: null, services: ["gs-5"], active: true, created_at: "2024-01-01" },
  ],

  // ── FM Glow Studio ─────────────────────────────────────────────────────────
  "dev-fm-glow-studio": [
    {
      id: "dev-sp-fmglow-1",
      tenant_id: "dev-fm-glow-studio",
      profile_id: "dev-empleada-fmglow",
      name: "Ana García",
      bio: { es: "Especialista en uñas, pestañas y tratamientos faciales en FM Glow Studio" },
      avatar_url: null,
      services: [
        "fmg-u1","fmg-u2","fmg-u3","fmg-u4","fmg-u5","fmg-u6","fmg-u7","fmg-u8","fmg-u9",
        "fmg-p1","fmg-p2","fmg-p3","fmg-p4","fmg-p5",
        "fmg-c1","fmg-c2","fmg-c3",
        "fmg-l1","fmg-l2","fmg-l3",
        "fmg-k1","fmg-k2","fmg-k3",
        "fmg-f1","fmg-f2","fmg-f3","fmg-f4",
        "fmg-b1","fmg-b2","fmg-b3","fmg-b4","fmg-b5",
      ],
      active: true,
      created_at: "2026-05-01T00:00:00Z",
    },
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
  "dev-glow-studio":  buildSchedules("dev-glow-studio",  DEV_SPECIALISTS["dev-glow-studio"]!),
  "dev-glam-studio":  buildSchedules("dev-glam-studio",  DEV_SPECIALISTS["dev-glam-studio"]!),
  "dev-fm-glow-studio": buildSchedules("dev-fm-glow-studio", DEV_SPECIALISTS["dev-fm-glow-studio"]!),
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

// Map editable en memoria para horarios en dev mode
const editedSchedules = new Map<string, SpecialistSchedule[]>();

export function updateDevSchedule(specialistId: string, schedules: SpecialistSchedule[]) {
  editedSchedules.set(specialistId, schedules);
}

export function getDevSchedule(specialistId: string): SpecialistSchedule[] | undefined {
  return editedSchedules.get(specialistId);
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
    if (isDevMode()) {
      const base = DEV_SCHEDULES[tenantId] ?? [];
      return base.map((s) => {
        const edits = editedSchedules.get(s.specialist_id);
        if (!edits) return s;
        const found = edits.find((e) => e.id === s.id);
        return found ?? s;
      });
    }

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
      const base = DEV_SCHEDULES[tenantId] ?? [];
      return base.map((s) => {
        const edits = editedSchedules.get(s.specialist_id);
        if (!edits) return s;
        const found = edits.find((e) => e.id === s.id);
        return found ?? s;
      });
    }
  }
);
