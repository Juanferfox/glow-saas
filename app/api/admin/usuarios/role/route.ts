import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { updateUserRole } from "@/lib/data/users";
import type { UserRole } from "@/lib/supabase/types";

export async function POST(req: NextRequest) {
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return NextResponse.json({ ok: true, dev: true });
  }

  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return NextResponse.json({ ok: false, error: "Tenant no encontrado" }, { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ ok: false, error: "Sin permisos" }, { status: 403 });
  }

  const { userId, role } = await req.json() as { userId: string; role: UserRole };
  if (!userId || !role) return NextResponse.json({ ok: false, error: "Datos incompletos" }, { status: 400 });

  await updateUserRole(tenant.id, userId, role);
  return NextResponse.json({ ok: true });
}
