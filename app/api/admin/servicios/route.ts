import { NextRequest, NextResponse } from "next/server";
import { getServices } from "@/lib/data/services";

// ── In-memory store for dev edits ─────────────────────────────────────────────
// Maps serviceId → partial overrides applied on top of the base dev data
const devEdits = new Map<string, Record<string, unknown>>();
// New services created during the session
const devCreated: Record<string, unknown>[] = [];

function isDevMode() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx")
  );
}

function isAdmin(request: NextRequest): boolean {
  const cookie = request.cookies.get("dev-session");
  if (!cookie) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profile = JSON.parse(decodeURIComponent(cookie.value)) as any;
    return profile?.role === "admin";
  } catch {
    return false;
  }
}

/** GET /api/admin/servicios?tenant=slug — lista servicios del tenant */
export async function GET(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tenantId = request.nextUrl.searchParams.get("tenant") ?? "";
  const services = await getServices(tenantId);

  // Aplicar ediciones en dev mode
  const merged = services.map((s) => {
    const edits = devEdits.get(s.id);
    return edits ? { ...s, ...edits } : s;
  });

  return NextResponse.json({ services: [...merged, ...devCreated] });
}

/** PATCH /api/admin/servicios — actualiza un servicio */
export async function PATCH(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { id, ...changes } = body as { id: string; [key: string]: unknown };
  if (!id) return NextResponse.json({ error: "id requerido" }, { status: 400 });

  if (isDevMode()) {
    devEdits.set(id, { ...(devEdits.get(id) ?? {}), ...changes });
    return NextResponse.json({ ok: true });
  }

  // Producción: actualizar en Supabase
  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("services").update(changes).eq("id", id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** POST /api/admin/servicios — crea un nuevo servicio */
export async function POST(request: NextRequest) {
  if (!isAdmin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const newService = {
    id: `dev-svc-${Date.now()}`,
    created_at: new Date().toISOString(),
    active: true,
    sort_order: 999,
    image_url: null,
    ...body,
  };

  if (isDevMode()) {
    devCreated.push(newService);
    return NextResponse.json({ ok: true, service: newService });
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const supabase = await createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).from("services").insert(body).select().single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 });
  return NextResponse.json({ ok: true, service: data });
}
