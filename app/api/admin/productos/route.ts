import { NextRequest, NextResponse } from "next/server";
import { getProducts, updateDevProduct, addDevProduct, type ProductRow } from "@/lib/data/products";
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

export async function GET(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant");
  if (!tenantSlug) return NextResponse.json({ error: "Falta slug" }, { status: 400 });

  const tenant = await getTenant(tenantSlug);
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  const products = await getProducts(tenant.id);
  return NextResponse.json({ products });
}

export async function PATCH(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!isDevMode()) {
    return NextResponse.json({ error: "Solo disponible en modo dev" }, { status: 400 });
  }

  const { id, ...changes } = await request.json();
  if (!id) return NextResponse.json({ error: "Falta ID" }, { status: 400 });

  updateDevProduct(id, changes);
  return NextResponse.json({ success: true });
}

export async function POST(request: NextRequest) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  if (!isDevMode()) {
    return NextResponse.json({ error: "Solo disponible en modo dev" }, { status: 400 });
  }

  const body = await request.json();
  const { searchParams } = request.nextUrl;
  const tenantSlug = searchParams.get("tenant") ?? "fm-glow-studio";
  const tenant = await getTenant(tenantSlug);
  const tenantId = tenant?.id ?? "dev-fm-glow-studio";

  const newId = `dev-prod-${Date.now()}`;
  const newProduct: ProductRow = {
    id: newId,
    tenant_id: tenantId,
    name: body.name ?? { es: "Nuevo producto" },
    description: body.description ?? null,
    price: body.price ?? 0,
    stock: body.stock ?? 0,
    stock_alert_threshold: body.stock_alert_threshold ?? 5,
    category: body.category ?? null,
    image_url: body.image_url ?? null,
    active: true,
    created_at: new Date().toISOString(),
  };
  addDevProduct(tenantId, newProduct);
  return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
}
