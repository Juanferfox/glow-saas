/**
 * Edge Function: appointment-reminders
 *
 * Cron: se ejecuta cada día a las 09:00 UTC.
 * Busca citas que ocurren en las próximas 24 horas con status "confirmed"
 * y envía notificaciones push + email de recordatorio.
 *
 * Configurar en Supabase Dashboard → Edge Functions → Cron:
 *   Schedule: 0 9 * * *
 *
 * Variables de entorno requeridas (en Supabase Dashboard → Settings → Secrets):
 *   SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY
 *   APP_URL  (ej: https://tuapp.co)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL          = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY        = Deno.env.get("RESEND_API_KEY")!;
const APP_URL               = Deno.env.get("APP_URL") ?? "https://tuapp.co";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

Deno.serve(async (_req) => {
  try {
    const results = await sendReminders();
    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[appointment-reminders] Error fatal:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Lógica principal ─────────────────────────────────────────────────────────

async function sendReminders() {
  const now       = new Date();
  const in24h     = new Date(now.getTime() + 24 * 3_600_000);
  const in25h     = new Date(now.getTime() + 25 * 3_600_000); // margen de 1h

  // Buscar citas confirmadas en las próximas 24-25 horas
  const { data: appointments, error } = await supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      tenant_id,
      client_id,
      service:services(name),
      specialist:specialists(name),
      tenant:tenants(name, default_locale, brand_color_primary, slug),
      client:profiles(full_name, push_subscription)
    `)
    .eq("status", "confirmed")
    .gte("scheduled_at", in24h.toISOString())
    .lte("scheduled_at", in25h.toISOString());

  if (error) {
    console.error("[appointment-reminders] Error al consultar citas:", error);
    throw error;
  }

  if (!appointments?.length) {
    console.log("[appointment-reminders] Sin citas para recordar hoy.");
    return { sent: 0, skipped: 0 };
  }

  console.log(`[appointment-reminders] Procesando ${appointments.length} citas...`);

  let sent    = 0;
  let skipped = 0;

  for (const appt of appointments) {
    try {
      const raw           = appt as Record<string, unknown>;
      const tenant        = raw["tenant"] as Record<string, string> | null;
      const client        = raw["client"] as Record<string, unknown> | null;
      const service       = raw["service"] as Record<string, Record<string, string>> | null;
      const specialist    = raw["specialist"] as Record<string, string> | null;

      if (!tenant || !client) { skipped++; continue; }

      const locale         = tenant["default_locale"] ?? "es";
      const tenantName     = tenant["name"]            ?? "El spa";
      const brandColor     = tenant["brand_color_primary"] ?? "#7F77DD";
      const clientName     = (client["full_name"] as string) ?? "Cliente";
      const pushSub        = client["push_subscription"] as PushSubscriptionJSON | null;
      const serviceName    = service?.["name"]?.[locale] ?? service?.["name"]?.["es"] ?? "Servicio";
      const specialistName = specialist?.["name"] ?? "Tu especialista";

      const scheduledDate  = new Date(appt.scheduled_at as string);
      const dateStr        = scheduledDate.toLocaleDateString(locale === "en" ? "en-US" : "es-CO", {
        weekday: "long", month: "long", day: "numeric",
      });
      const timeStr = scheduledDate.toLocaleTimeString("es-CO", {
        hour: "2-digit", minute: "2-digit",
      });

      // 1. Email de recordatorio
      await sendReminderEmail({
        tenantName,
        brandColor,
        clientId: appt.client_id as string,
        clientName,
        serviceName,
        specialistName,
        dateStr,
        timeStr,
        appointmentId: appt.id as string,
        tenantSlug: tenant["slug"] ?? "",
      });

      // 2. Web Push (si el cliente tiene suscripción)
      if (pushSub) {
        await sendWebPush(pushSub, {
          title: `⏰ Recordatorio: ${serviceName}`,
          body:  `Mañana a las ${timeStr} en ${tenantName}`,
          url:   `${APP_URL}/${locale}/citas`,
        });
      }

      sent++;
    } catch (err) {
      console.error(`[appointment-reminders] Error en cita ${appt.id}:`, err);
      skipped++;
    }
  }

  console.log(`[appointment-reminders] Completado — enviados: ${sent}, omitidos: ${skipped}`);
  return { sent, skipped };
}

// ─── Email ────────────────────────────────────────────────────────────────────

async function sendReminderEmail(data: {
  tenantName:    string;
  brandColor:    string;
  clientId:      string;
  clientName:    string;
  serviceName:   string;
  specialistName: string;
  dateStr:       string;
  timeStr:       string;
  appointmentId: string;
  tenantSlug:    string;
}) {
  // Obtener email desde auth.users
  const { data: userData } = await supabase.auth.admin.getUserById(data.clientId);
  const email = userData?.user?.email;
  if (!email) return;

  const cancelUrl = `${APP_URL}/api/booking/${data.appointmentId}/cancel`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f9f9f9;font-family:system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0"
        style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);max-width:100%;">
        <tr>
          <td style="background:${data.brandColor};padding:24px 36px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:18px;font-weight:700;">${data.tenantName}</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px;text-align:center;">
            <div style="font-size:36px;">⏰</div>
            <h2 style="margin:12px 0 6px;font-size:18px;color:#111;">Recordatorio de cita</h2>
            <p style="margin:0 0 20px;color:#666;font-size:14px;">
              Hola <strong>${data.clientName}</strong>, te recordamos que mañana tienes una cita.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#f7f7f7;border-radius:12px;overflow:hidden;text-align:left;">
              <tr><td style="padding:12px 16px;border-bottom:1px solid #eee;">
                <span style="font-size:11px;color:#999;">💆 Servicio</span><br/>
                <strong style="font-size:14px;color:#111;">${data.serviceName}</strong>
              </td></tr>
              <tr><td style="padding:12px 16px;border-bottom:1px solid #eee;">
                <span style="font-size:11px;color:#999;">👩 Especialista</span><br/>
                <strong style="font-size:14px;color:#111;">${data.specialistName}</strong>
              </td></tr>
              <tr><td style="padding:12px 16px;border-bottom:1px solid #eee;">
                <span style="font-size:11px;color:#999;">📅 Fecha</span><br/>
                <strong style="font-size:14px;color:#111;">${data.dateStr}</strong>
              </td></tr>
              <tr><td style="padding:12px 16px;">
                <span style="font-size:11px;color:#999;">⏰ Hora</span><br/>
                <strong style="font-size:14px;color:#111;">${data.timeStr}</strong>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 36px 28px;text-align:center;">
            <p style="margin:0 0 16px;font-size:13px;color:#888;">
              ¿No puedes asistir? Cancela con tiempo para evitar penalidades.
            </p>
            <a href="${cancelUrl}"
              style="display:inline-block;padding:10px 24px;border-radius:8px;
                     background:#f44336;color:#fff;font-size:13px;font-weight:600;
                     text-decoration:none;">
              Cancelar cita
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:#f2f2f2;padding:14px 36px;text-align:center;border-top:1px solid #e8e8e8;">
            <p style="margin:0;font-size:11px;color:#aaa;">
              Mensaje automático de ${data.tenantName} · No respondas este correo.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await fetch("https://api.resend.com/emails", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      from:    `${data.tenantName} <noreply@tuapp.co>`,
      to:      email,
      subject: `⏰ Recordatorio: ${data.serviceName} mañana a las ${data.timeStr}`,
      html,
    }),
  });
}

// ─── Web Push ─────────────────────────────────────────────────────────────────

interface PushSubscriptionJSON {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function sendWebPush(
  subscription: PushSubscriptionJSON,
  payload: { title: string; body: string; url: string }
) {
  // Implementación básica con la Web Push Protocol (sin librería VAPID externa).
  // En producción usar supabase/functions/_shared/web-push.ts con VAPID signing.
  // Por ahora solo logueamos — el scaffold está listo para completar.
  console.log(
    `[web-push] → ${subscription.endpoint.slice(0, 60)}… | ${payload.title}`
  );
  // TODO: implementar firma VAPID con WebCrypto API (Deno-compatible)
  // Ver: https://developers.google.com/web/fundamentals/push-notifications/web-push-protocol
}
