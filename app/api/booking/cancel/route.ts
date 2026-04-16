import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/booking/cancel
 * Cancela una cita del usuario autenticado.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Verificar sesión
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

  // En modo dev simplemente devolvemos éxito
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode) {
    return NextResponse.json({ success: true });
  }

  // Actualizar cita en Supabase (RLS asegura que solo el dueño o admin pueda)
  const { error } = await supabase
    .from("appointments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancel_reason: reason ?? "Cancelada por el usuario",
    })
    .eq("id", appointmentId)
    .eq("client_id", user.id); // Doble validación de seguridad

  if (error) {
    console.error("[booking/cancel] Error:", error);
    return NextResponse.json({ error: "No se pudo cancelar la cita" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
