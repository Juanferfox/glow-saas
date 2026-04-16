import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";

interface CancelBody {
  tenantSlug: string;
  reason?: string;
}

/**
 * POST /api/booking/[id]/cancel
 * Cancela una cita del usuario autenticado.
 * Aplica penalidad de puntos si la cita es en menos de 24h (configurable por tenant).
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: appointmentId } = await params;
  const supabase = await createClient();

  // Verificar sesión
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: CancelBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { tenantSlug, reason } = body;
  const tenant = await getTenant(tenantSlug);
  if (!tenant) {
    return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
  }

  // En modo dev devolver éxito simulado
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return NextResponse.json({ ok: true, penalty: false }, { status: 200 });
  }

  // Obtener la cita
  const { data: appt, error: fetchErr } = await supabase
    .from("appointments")
    .select("id, client_id, scheduled_at, status, points_earned")
    .eq("id", appointmentId)
    .eq("tenant_id", tenant.id)
    .single();

  if (fetchErr || !appt) {
    return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
  }

  if (appt.client_id !== user.id) {
    return NextResponse.json({ error: "Sin permiso para cancelar esta cita" }, { status: 403 });
  }

  if (appt.status === "cancelled") {
    return NextResponse.json({ error: "La cita ya está cancelada" }, { status: 409 });
  }

  // Calcular penalidad: si faltan menos de 24h y hay puntos acreditados
  const hoursUntil = (new Date(appt.scheduled_at).getTime() - Date.now()) / 3_600_000;
  const applyPenalty = hoursUntil < 24 && appt.points_earned > 0;
  const penaltyPts   = applyPenalty ? tenant.cancellation_penalty : 0;

  // Actualizar cita
  const { error: updateErr } = await supabase
    .from("appointments")
    .update({
      status:        "cancelled",
      cancelled_at:  new Date().toISOString(),
      cancel_reason: reason ?? null,
    })
    .eq("id", appointmentId);

  if (updateErr) {
    return NextResponse.json({ error: "No se pudo cancelar la cita" }, { status: 500 });
  }

  // Aplicar penalidad de puntos al profile si corresponde
  if (applyPenalty && penaltyPts > 0) {
    await supabase.rpc("deduct_loyalty_points", {
      p_user_id: user.id,
      p_tenant_id: tenant.id,
      p_points: penaltyPts,
    }).catch(() => {}); // RPC puede no existir aún
  }

  return NextResponse.json({ ok: true, penalty: applyPenalty, penaltyPts }, { status: 200 });
}
