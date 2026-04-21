"use client";

import { useState } from "react";
import { Copy, Check, CalendarDays, ExternalLink } from "lucide-react";

interface SyncCalendarCardProps {
  token: string;
  locale?: string;
}

/**
 * Tarjeta con el link iCal y botones de "Agregar a Google" / "Agregar a Apple".
 */
export function SyncCalendarCard({ token, locale = "es" }: SyncCalendarCardProps) {
  const [copied, setCopied] = useState(false);
  const isES = locale === "es";

  // URL absoluta del feed iCal
  const baseUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_APP_URL ?? "https://app.glowos.co";

  const icalUrl = `${baseUrl}/api/calendar/${token}`;

  // Google Calendar acepta webcal:// o https:// en su UI de suscripción
  const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(icalUrl)}`;

  // Apple Calendar usa webcal:// directamente
  const appleUrl = icalUrl.replace("https://", "webcal://").replace("http://", "webcal://");

  async function copyUrl() {
    await navigator.clipboard.writeText(icalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="rounded-xl border border-[var(--brand-border)] p-4 space-y-3"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      <div className="flex items-center gap-2">
        <CalendarDays size={16} style={{ color: "var(--brand-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
          {isES ? "Sincronizar con tu calendario" : "Sync with your calendar"}
        </h3>
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--brand-text)", opacity: 0.6 }}>
        {isES
          ? "Suscríbete para ver tus citas en Google Calendar o Apple Calendar. Se actualiza automáticamente."
          : "Subscribe to see your appointments in Google Calendar or Apple Calendar. Updates automatically."}
      </p>

      {/* URL del feed */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 truncate rounded-lg border border-[var(--brand-border)] px-3 py-2 font-mono text-[10px]"
          style={{ color: "var(--brand-text)", opacity: 0.7 }}
        >
          {icalUrl}
        </div>
        <button
          onClick={copyUrl}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] transition-colors hover:bg-[var(--brand-border)]"
          style={{ color: "var(--brand-text)" }}
          title={isES ? "Copiar URL" : "Copy URL"}
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>

      {/* Botones de suscripción */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <a
          href={googleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--brand-border)] px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--brand-border)]"
          style={{ color: "var(--brand-text)" }}
        >
          <ExternalLink size={12} />
          Google Calendar
        </a>
        <a
          href={appleUrl}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-[var(--brand-border)] px-3 py-2 text-xs font-medium transition-colors hover:bg-[var(--brand-border)]"
          style={{ color: "var(--brand-text)" }}
        >
          <ExternalLink size={12} />
          Apple Calendar
        </a>
      </div>

      <p className="text-[10px]" style={{ color: "var(--brand-text)", opacity: 0.4 }}>
        {isES
          ? "La URL es privada. No la compartas."
          : "This URL is private. Don't share it."}
      </p>
    </div>
  );
}
