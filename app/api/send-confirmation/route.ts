import { NextResponse, type NextRequest } from "next/server";

/**
 * POST /api/send-confirmation
 * Envía email de confirmación (Skeleton).
 * En producción usaría Resend o Amazon SES.
 */
export async function POST(request: NextRequest) {
  try {
    const { appointmentId, tenantSlug } = await request.json();

    console.log(`[Email] Enviando confirmación para cita ${appointmentId} en tenant ${tenantSlug}`);

    // Aquí iría la integración con Resend
    // await resend.emails.send({ ... });

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "Falla al enviar email" }, { status: 500 });
  }
}
