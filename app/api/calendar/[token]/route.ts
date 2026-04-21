import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Feed iCal privado por usuario.
 * URL: /api/calendar/[token].ics
 *
 * Compatible con:
 *  - Google Calendar  → "Desde URL" → pegar la URL completa
 *  - Apple Calendar   → Archivo → Nueva suscripción de calendario → pegar URL
 *  - Outlook          → Agregar calendario → Suscribirse desde web
 *
 * El token es único por usuario (almacenado en profiles.calendar_sync_token).
 * Regenerarlo invalida todas las suscripciones activas.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  // ── Dev mode: devolver calendario de muestra ─────────────────────────────
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  if (isDevMode || token === "dev-ical-token-abc123" || token.startsWith("dev-ical")) {
    const ics = buildDevIcal();
    return new NextResponse(ics, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": 'attachment; filename="mi-calendario.ics"',
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  }

  // ── Producción: verificar token y obtener citas ──────────────────────────
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tenant_id, full_name, role, calendar_sync_token")
    .eq("calendar_sync_token", token)
    .single();

  if (!profile) {
    return new NextResponse("Token inválido", { status: 401 });
  }

  // Rango: 30 días pasados + 365 días futuros
  const from = new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10);
  const to   = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10);

  let query = supabase
    .from("appointments")
    .select(`
      id,
      scheduled_at,
      ends_at,
      status,
      notes,
      services(name),
      specialists(name)
    `)
    .eq("tenant_id", profile.tenant_id)
    .gte("scheduled_at", `${from}T00:00:00`)
    .lte("scheduled_at", `${to}T23:59:59`)
    .neq("status", "cancelled");

  if (profile.role === "cliente") {
    query = query.eq("client_id", profile.id);
  } else if (profile.role === "trabajadora") {
    const { data: sp } = await supabase
      .from("specialists")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("tenant_id", profile.tenant_id)
      .single();
    if (sp) query = query.eq("specialist_id", sp.id);
  }

  const { data: appointments } = await query;

  const ics = buildIcal(
    profile.full_name ?? "Usuario",
    (appointments ?? []).map((a: Record<string, unknown>) => {
      const svc = a.services as { name: Record<string, string> } | null;
      const sp  = a.specialists as { name: string } | null;
      return {
        id:          a.id as string,
        title:       svc?.name?.es ?? svc?.name?.en ?? "Cita",
        start:       a.scheduled_at as string,
        end:         a.ends_at as string,
        description: sp ? `Con ${sp.name}` : "",
        notes:       (a.notes as string | null) ?? "",
      };
    })
  );

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="calendario-${profile.tenant_id}.ics"`,
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  });
}

// ─── Builders iCal ──────────────────────────────────────────────────────────

function formatIcalDate(iso: string): string {
  // "2025-04-22T10:00:00.000Z" → "20250422T100000Z"
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "").replace("Z", "Z");
}

function escapeIcal(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function buildIcal(
  calName: string,
  events: { id: string; title: string; start: string; end: string; description: string; notes: string }[]
): string {
  const stamp = formatIcalDate(new Date().toISOString());

  const eventBlocks = events
    .map(
      (e) => `BEGIN:VEVENT
UID:${e.id}@spaluna.app
DTSTAMP:${stamp}
DTSTART:${formatIcalDate(e.start)}
DTEND:${formatIcalDate(e.end)}
SUMMARY:${escapeIcal(e.title)}
DESCRIPTION:${escapeIcal([e.description, e.notes].filter(Boolean).join(" — "))}
STATUS:CONFIRMED
END:VEVENT`
    )
    .join("\r\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GlowOS//SPA Calendar//ES",
    `X-WR-CALNAME:${escapeIcal(calName)}`,
    "X-WR-TIMEZONE:America/Bogota",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    eventBlocks,
    "END:VCALENDAR",
  ].join("\r\n");
}

function buildDevIcal(): string {
  const now = new Date();
  const d = (offsetDays: number, hour: number, minute = 0) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + offsetDays);
    dt.setHours(hour, minute, 0, 0);
    return dt.toISOString();
  };

  return buildIcal("Mi Calendario — Spa Luna", [
    { id: "dev-1", title: "Facial hidratante", start: d(1, 10), end: d(1, 11), description: "Con Valentina Ríos", notes: "" },
    { id: "dev-2", title: "Masaje relajante",  start: d(7, 15), end: d(7, 16, 30), description: "Con Camila Torres", notes: "Aceites de lavanda" },
    { id: "dev-3", title: "Lifting de pestañas (Sesión 3/6)", start: d(14, 9), end: d(14, 10), description: "Con Isabella Mora", notes: "" },
  ]);
}
