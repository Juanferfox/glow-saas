import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * POST /api/send-confirmation
 * Envía email de confirmación de cita al cliente.
 * Llamado internamente desde POST /api/booking (fire-and-forget).
 */
export async function POST(request: NextRequest) {
  // Sin API key → dev mode silencioso
  if (!process.env.RESEND_API_KEY) {
    console.log("[send-confirmation] RESEND_API_KEY no configurada — omitiendo email");
    return NextResponse.json({ ok: true, skipped: true });
  }

  let appointmentId: string;
  let tenantSlug: string;

  try {
    const body = await request.json();
    appointmentId = body.appointmentId;
    tenantSlug    = body.tenantSlug;
    if (!appointmentId || !tenantSlug) throw new Error("Faltan parámetros");
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();

    // Obtener cita con joins
    const { data: appt, error: apptErr } = await supabase
      .from("appointments")
      .select(`
        id, scheduled_at, ends_at, notes,
        service:services(name),
        specialist:specialists(name),
        client:profiles(full_name, id)
      `)
      .eq("id", appointmentId)
      .single();

    if (apptErr || !appt) {
      console.error("[send-confirmation] Cita no encontrada:", apptErr);
      return NextResponse.json({ error: "Cita no encontrada" }, { status: 404 });
    }

    // Obtener email del usuario desde auth.users
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const clientId = (appt as any).client?.id as string | undefined;
    const { data: userData } = await supabase.auth.admin.getUserById(clientId ?? "");
    const clientEmail = userData?.user?.email;

    if (!clientEmail) {
      console.warn("[send-confirmation] Email del cliente no disponible");
      return NextResponse.json({ ok: true, skipped: true });
    }

    const tenant = await getTenant(tenantSlug);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = appt as any;
    const serviceName    = raw.service?.name?.es ?? raw.service?.name?.en ?? "Servicio";
    const specialistName = raw.specialist?.name  ?? "Tu especialista";
    const clientName     = raw.client?.full_name  ?? "Cliente";

    const scheduledDate = new Date(appt.scheduled_at);
    const dateStr = scheduledDate.toLocaleDateString("es-CO", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });
    const timeStr = scheduledDate.toLocaleTimeString("es-CO", {
      hour: "2-digit", minute: "2-digit",
    });

    const fromDomain  = process.env.NEXT_PUBLIC_APP_DOMAIN ?? "tuapp.co";
    const fromAddress = `${tenant.name} <noreply@${fromDomain}>`;

    const { error: sendErr } = await resend.emails.send({
      from:    fromAddress,
      to:      clientEmail,
      subject: `✅ Cita confirmada — ${serviceName} el ${dateStr}`,
      html:    buildEmailHtml({
        tenantName:    tenant.name,
        brandColor:    tenant.brand_color_primary,
        clientName,
        serviceName,
        specialistName,
        dateStr,
        timeStr,
        notes:         appt.notes,
      }),
    });

    if (sendErr) {
      console.error("[send-confirmation] Error Resend:", sendErr);
      return NextResponse.json({ error: "Fallo al enviar email" }, { status: 500 });
    }

    console.log(`[send-confirmation] Email enviado a ${clientEmail}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[send-confirmation] Error inesperado:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

// ─── Template HTML del email ──────────────────────────────────────────────────

function buildEmailHtml(data: {
  tenantName:    string;
  brandColor:    string;
  clientName:    string;
  serviceName:   string;
  specialistName: string;
  dateStr:       string;
  timeStr:       string;
  notes:         string | null;
}) {
  const { tenantName, brandColor, clientName, serviceName, specialistName, dateStr, timeStr, notes } = data;

  return /* html */`<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cita confirmada</title>
</head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0"
          style="background:#fff;border-radius:16px;overflow:hidden;
                 box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">

          <!-- Header con color del tenant -->
          <tr>
            <td style="background:${brandColor};padding:28px 36px;text-align:center;">
              <h1 style="margin:0;color:#fff;font-size:20px;font-weight:700;">
                ${escapeHtml(tenantName)}
              </h1>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 36px 0;text-align:center;">
              <div style="font-size:40px;line-height:1;">✅</div>
              <h2 style="margin:12px 0 4px;font-size:18px;color:#111;font-weight:700;">
                ¡Cita confirmada!
              </h2>
              <p style="margin:0 0 24px;color:#666;font-size:14px;line-height:1.5;">
                Hola <strong>${escapeHtml(clientName)}</strong>, aquí están los detalles de tu reserva.
              </p>
            </td>
          </tr>

          <!-- Detalles -->
          <tr>
            <td style="padding:0 36px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#f7f7f7;border-radius:12px;overflow:hidden;">
                ${emailRow("💆 Servicio",     escapeHtml(serviceName))}
                ${emailRow("👩 Especialista", escapeHtml(specialistName))}
                ${emailRow("📅 Fecha",        escapeHtml(dateStr))}
                ${emailRow("⏰ Hora",         escapeHtml(timeStr))}
                ${notes ? emailRow("📝 Notas", escapeHtml(notes)) : ""}
              </table>
            </td>
          </tr>

          <!-- Aviso recordatorio -->
          <tr>
            <td style="padding:0 36px 24px;">
              <p style="margin:0;font-size:13px;color:#888;text-align:center;line-height:1.6;">
                Recibirás un recordatorio <strong>24 horas antes</strong> de tu cita.<br/>
                Las cancelaciones tardías (menos de 2h) pueden generar penalidades de puntos.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f2f2f2;padding:16px 36px;text-align:center;border-top:1px solid #e8e8e8;">
              <p style="margin:0;font-size:11px;color:#aaa;">
                Email enviado automáticamente por ${escapeHtml(tenantName)} · No respondas este mensaje.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function emailRow(label: string, value: string) {
  return `<tr>
    <td style="padding:12px 16px;border-bottom:1px solid #eee;">
      <span style="display:block;font-size:11px;color:#999;margin-bottom:2px;">${label}</span>
      <span style="font-size:14px;color:#111;font-weight:600;">${value}</span>
    </td>
  </tr>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
