import { NextRequest, NextResponse } from "next/server";
import { getServices, updateDevService, type ServiceRow } from "@/lib/data/services";
import { getTenant } from "@/lib/tenant";

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

function getDevProfile(cookieHeader: string | null): { role: string } | null {
  if (!cookieHeader) return null;
  try {
    const match = cookieHeader.match(/dev-session=([^;]+)/);
    if (!match || !match[1]) return null;
    return JSON.parse(Buffer.from(match[1], "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

function requireAdmin(request: NextRequest): NextResponse | null {
  if (isDevMode()) {
    const profile = getDevProfile(request.headers.get("cookie"));
    if (!profile) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    if (profile.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    return null;
  }
  return null;
}

/** GET /api/admin/servicios?tenant=SLUG — lista servicios del tenant */
export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant");
  if (!tenantSlug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const services = await getServices(tenant.id);
  return NextResponse.json({ services });
}

/** PATCH /api/admin/servicios — actualiza un servicio */
export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!isDevMode()) {
    return NextResponse.json({ error: "Solo disponible en modo dev" }, { status: 400 });
  }

  const { id, ...changes } = await request.json();
  if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

  updateDevService(id, changes);
  return NextResponse.json({ success: true });
}

/** POST /api/admin/servicios — crea nuevo servicio */
export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!isDevMode()) {
    return NextResponse.json({ error: "Solo disponible en modo dev" }, { status: 400 });
  }

  const body = await request.json();
  const newId = `dev-svc-${Date.now()}`;
  const newService: Partial<ServiceRow> = {
    id: newId,
    name: body.name ?? { es: "Nuevo servicio" },
    description: body.description ?? null,
    duration_min: body.duration_min ?? 30,
    price: body.price ?? 0,
    category: body.category ?? null,
    sort_order: body.sort_order ?? 999,
  };
  updateDevService(newId, newService as ServiceRow);
  return NextResponse.json({ success: true, service: newService }, { status: 201 });
}
