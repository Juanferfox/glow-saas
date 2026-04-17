import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AppointmentStatus } from "@/lib/supabase/types";

/**
 * POST /api/booking/cancel
 * Cancela una cita del usuario autenticado (ID en el body).
 * Alternativa sin ID en la URL para compatibilidad con clientes legacy.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let body: { appointmentId: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { appointmentId, reason } = body;
  if (!appointmentId) {
    return NextResponse.json({ error: "appointmentId es requerido" }, { status: 400 });
  }

  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return NextResponse.json({ success: true });
  }

  const { error } = await supabase
    .from("appointments")
    .update({
      status:        "cancelled" as AppointmentStatus,
      cancelled_at:  new Date().toISOString(),
      cancel_reason: reason ?? "Cancelada por el usuario",
    })
    .eq("id", appointmentId)
    .eq("client_id", user.id);

  if (error) {
    return NextResponse.json({ error: "No se pudo cancelar la cita" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
