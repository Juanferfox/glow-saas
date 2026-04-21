import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Profile, UserRole } from "@/lib/supabase/types";

// ─── Tipo extendido para listado de usuarios ─────────────────────────────────

export type ProfileWithEmail = Profile & {
  email: string | null;
  specialist_id: string | null;
  specialist_name: string | null;
};

// ─── Dev data ────────────────────────────────────────────────────────────────

const DEV_USERS: ProfileWithEmail[] = [
  {
    id: "dev-admin",
    tenant_id: "dev-spa-luna",
    full_name: "Lucía Herrera",
    avatar_url: null,
    role: "admin",
    email: "lucia@spaluna.com",
    referral_code: "LUCIA01",
    referred_by: null,
    loyalty_points: 0,
    preferred_theme: "system",
    preferred_locale: "es",
    notifications_promo: true,
    notifications_tips: true,
    push_subscription: null,
    calendar_sync_token: "dev-ical-admin",
    created_at: new Date(Date.now() - 90 * 86_400_000).toISOString(),
    specialist_id: null,
    specialist_name: null,
  },
  {
    id: "dev-worker-1",
    tenant_id: "dev-spa-luna",
    full_name: "Valentina Ríos",
    avatar_url: null,
    role: "trabajadora",
    email: "valentina@spaluna.com",
    referral_code: "VALE01",
    referred_by: null,
    loyalty_points: 0,
    preferred_theme: "system",
    preferred_locale: "es",
    notifications_promo: false,
    notifications_tips: true,
    push_subscription: null,
    calendar_sync_token: "dev-ical-worker1",
    created_at: new Date(Date.now() - 60 * 86_400_000).toISOString(),
    specialist_id: "sl-sp-1",
    specialist_name: "Valentina Ríos",
  },
  {
    id: "dev-worker-2",
    tenant_id: "dev-spa-luna",
    full_name: "Camila Torres",
    avatar_url: null,
    role: "trabajadora",
    email: "camila@spaluna.com",
    referral_code: "CAMI01",
    referred_by: null,
    loyalty_points: 0,
    preferred_theme: "system",
    preferred_locale: "es",
    notifications_promo: false,
    notifications_tips: true,
    push_subscription: null,
    calendar_sync_token: "dev-ical-worker2",
    created_at: new Date(Date.now() - 45 * 86_400_000).toISOString(),
    specialist_id: "sl-sp-2",
    specialist_name: "Camila Torres",
  },
  {
    id: "dev-worker-3",
    tenant_id: "dev-spa-luna",
    full_name: "Isabella Mora",
    avatar_url: null,
    role: "trabajadora",
    email: "isabella@spaluna.com",
    referral_code: "ISA01",
    referred_by: null,
    loyalty_points: 0,
    preferred_theme: "system",
    preferred_locale: "es",
    notifications_promo: false,
    notifications_tips: false,
    push_subscription: null,
    calendar_sync_token: null,
    created_at: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    specialist_id: "sl-sp-3",
    specialist_name: "Isabella Mora",
  },
  {
    id: "dev-user",
    tenant_id: "dev-spa-luna",
    full_name: "María García",
    avatar_url: null,
    role: "cliente",
    email: "maria@example.com",
    referral_code: "MARI01",
    referred_by: null,
    loyalty_points: 350,
    preferred_theme: "light",
    preferred_locale: "es",
    notifications_promo: true,
    notifications_tips: true,
    push_subscription: null,
    calendar_sync_token: "dev-ical-client",
    created_at: new Date(Date.now() - 20 * 86_400_000).toISOString(),
    specialist_id: null,
    specialist_name: null,
  },
  {
    id: "dev-user-2",
    tenant_id: "dev-spa-luna",
    full_name: "Ana López",
    avatar_url: null,
    role: "cliente",
    email: "ana@example.com",
    referral_code: "ANA01",
    referred_by: "dev-user",
    loyalty_points: 120,
    preferred_theme: "system",
    preferred_locale: "es",
    notifications_promo: true,
    notifications_tips: false,
    push_subscription: null,
    calendar_sync_token: null,
    created_at: new Date(Date.now() - 10 * 86_400_000).toISOString(),
    specialist_id: null,
    specialist_name: null,
  },
];

// ─── Funciones ───────────────────────────────────────────────────────────────

/**
 * Lista todos los usuarios del tenant, con email y specialist vinculado.
 */
export async function getTenantUsers(tenantId: string): Promise<ProfileWithEmail[]> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return DEV_USERS.filter((u) => u.tenant_id === tenantId || tenantId.startsWith("dev-"));
  }

  const supabase = await createClient();

  // Profiles con join a specialists para saber cuál especialista está vinculado
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*, specialists(id, name)")
    .eq("tenant_id", tenantId)
    .order("role")
    .order("full_name");

  if (!profiles) return [];

  // Obtener emails via auth.admin — requiere service role key
  // En producción esto funciona con SUPABASE_SERVICE_ROLE_KEY
  const userIds = profiles.map((p) => p.id as string);
  const emailMap: Record<string, string> = {};

  try {
    for (const id of userIds) {
      const { data: authUser } = await supabase.auth.admin.getUserById(id);
      if (authUser?.user?.email) emailMap[id] = authUser.user.email;
    }
  } catch {
    // service role no disponible — emails vacíos
  }

  return profiles.map((p) => {
    const sp = (p as Record<string, unknown>).specialists as { id: string; name: string } | null;
    return {
      ...(p as Profile),
      email: emailMap[p.id as string] ?? null,
      specialist_id: sp?.id ?? null,
      specialist_name: sp?.name ?? null,
    };
  });
}

/**
 * Cambia el rol de un usuario.
 * Solo la dueña (admin) puede hacer esto.
 */
export async function updateUserRole(
  tenantId: string,
  userId: string,
  newRole: UserRole
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId)
    .eq("tenant_id", tenantId);
}

/**
 * Desactiva un usuario (soft delete): cambia su role a "cliente" y elimina
 * su vinculación a specialists. No borra el auth user ni sus datos.
 */
export async function deactivateUser(tenantId: string, userId: string): Promise<void> {
  const supabase = await createClient();

  // Desvincular de specialists
  await supabase
    .from("specialists")
    .update({ profile_id: null, active: false })
    .eq("profile_id", userId)
    .eq("tenant_id", tenantId);

  // Downgrade a cliente
  await supabase
    .from("profiles")
    .update({ role: "cliente" })
    .eq("id", userId)
    .eq("tenant_id", tenantId);
}

/**
 * Crea un usuario con rol trabajadora y lo vincula a un specialist.
 * En producción, la dueña invita al email — Supabase genera el auth user.
 */
export async function inviteUser(params: {
  tenantId: string;
  email: string;
  fullName: string;
  role: UserRole;
  specialistId?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return { ok: true };
  }

  const supabase = await createClient();

  try {
    // Invitar via Supabase Auth (envía email de invitación)
    const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
      params.email,
      {
        data: {
          full_name: params.fullName,
          tenant_id: params.tenantId,
          role: params.role,
        },
      }
    );

    if (authError) return { ok: false, error: authError.message };

    const userId = authData.user.id;

    // Crear profile
    await supabase.from("profiles").insert({
      id: userId,
      tenant_id: params.tenantId,
      full_name: params.fullName,
      role: params.role,
    });

    // Vincular a specialist si aplica
    if (params.specialistId) {
      await supabase
        .from("specialists")
        .update({ profile_id: userId })
        .eq("id", params.specialistId)
        .eq("tenant_id", params.tenantId);
    }

    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
