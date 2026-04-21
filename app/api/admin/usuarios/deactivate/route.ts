import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { deactivateUser } from "@/lib/data/users";

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

  const { userId } = await req.json() as { userId: string };
  if (!userId) return NextResponse.json({ ok: false, error: "userId requerido" }, { status: 400 });

  // Proteger: no se puede desactivar a sí mismo
  if (userId === user.id) {
    return NextResponse.json({ ok: false, error: "No puedes desactivarte a ti mismo" }, { status: 400 });
  }

  await deactivateUser(tenant.id, userId);
  return NextResponse.json({ ok: true });
}
