import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, XCircle, Circle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { getAllMyAppointments } from "@/lib/data/appointments";
import type { AppointmentWithDetails } from "@/lib/data/appointments";
import { CancelButton } from "@/components/booking/CancelButton";
import type { AppointmentStatus } from "@/lib/supabase/types";
import Link from "next/link";

interface PageProps {
  params: Promise<{ locale: string }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === "en" ? "en-US" : "es-CO", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; icon: React.ReactNode; className: string }
> = {
  pending: {
    label: "Pendiente",
    icon: <Circle size={12} />,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  confirmed: {
    label: "Confirmada",
    icon: <Clock size={12} />,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  completed: {
    label: "Completada",
    icon: <CheckCircle2 size={12} />,
    className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  },
  cancelled: {
    label: "Cancelada",
    icon: <XCircle size={12} />,
    className: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  },
};

// ─── Card de una cita ─────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  tenantSlug,
  locale,
  cancellationPenalty,
  showCancel,
}: {
  appt: AppointmentWithDetails;
  tenantSlug: string;
  locale: string;
  cancellationPenalty: number;
  showCancel: boolean;
}) {
  const st = STATUS_CONFIG[appt.status];
  const serviceName =
    appt.service_name[locale] ?? appt.service_name["es"] ?? "Servicio";

  return (
    <article
      className="rounded-2xl border p-4"
      style={{
        borderColor: "var(--brand-border)",
        backgroundColor: "var(--brand-surface)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="truncate text-base font-semibold"
            style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}
          >
            {serviceName}
          </p>
          <p className="text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
            {appt.specialist_name}
          </p>
        </div>

        {/* Badge de estado */}
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.className}`}
        >
          {st.icon}
          {st.label}
        </span>
      </div>

      {/* Fecha y hora */}
      <div className="mt-3 flex items-center gap-1.5 text-xs opacity-60" style={{ color: "var(--brand-text)" }}>
        <CalendarDays size={13} />
        <span className="capitalize">{formatDate(appt.scheduled_at, locale)}</span>
        <span className="opacity-50">·</span>
        <span>{formatTime(appt.scheduled_at)}</span>
      </div>

      {/* Notas */}
      {appt.notes && (
        <p className="mt-2 text-xs opacity-50 italic" style={{ color: "var(--brand-text)" }}>
          "{appt.notes}"
        </p>
      )}

      {/* Puntos */}
      {appt.status === "completed" && appt.points_earned > 0 && (
        <p className="mt-2 text-xs font-medium" style={{ color: "var(--brand-primary)" }}>
          +{appt.points_earned} puntos ganados
        </p>
      )}

      {/* Razón de cancelación */}
      {appt.status === "cancelled" && appt.cancel_reason && (
        <p className="mt-2 text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
          Motivo: {appt.cancel_reason}
        </p>
      )}

      {/* Cancelar */}
      {showCancel && (
        <CancelButton
          appointmentId={appt.id}
          tenantSlug={tenantSlug}
          scheduledAt={appt.scheduled_at}
          cancellationPenalty={cancellationPenalty}
          locale={locale}
        />
      )}
    </article>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

export default async function CitasPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Autenticación
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?next=/${locale}/citas`);
  }

  // 2. Tenant
  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 3. Citas
  const { upcoming, past } = await getAllMyAppointments(tenant.id);

  const canCancel = (a: AppointmentWithDetails) =>
    a.status === "confirmed" || a.status === "pending";

  return (
    <div className="container mx-auto px-4 py-8 space-y-10">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
            <CalendarDays size={18} />
            <span className="text-xs font-bold uppercase tracking-widest">Agenda</span>
          </div>
          <h1
            className="text-3xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
          >
            Mis citas
          </h1>
        </div>

        <Link
          href={`/${locale}/agendar`}
          className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          + Nueva cita
        </Link>
      </div>

      {/* Próximas */}
      <section>
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}
        >
          Próximas
        </h2>

        {upcoming.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-12 text-center"
            style={{ borderColor: "var(--brand-border)", color: "var(--brand-text)" }}
          >
            <CalendarDays size={32} className="opacity-20" />
            <p className="text-sm opacity-50">No tienes citas próximas.</p>
            <Link
              href={`/${locale}/agendar`}
              className="text-sm font-semibold"
              style={{ color: "var(--brand-primary)" }}
            >
              Agendar ahora →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcoming.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                tenantSlug={tenant.slug}
                locale={locale}
                cancellationPenalty={tenant.cancellation_penalty}
                showCancel={canCancel(a)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Historial */}
      {past.length > 0 && (
        <section>
          <h2
            className="mb-4 text-lg font-semibold opacity-60"
            style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}
          >
            Historial
          </h2>

          <div className="space-y-3">
            {past.map((a) => (
              <AppointmentCard
                key={a.id}
                appt={a}
                tenantSlug={tenant.slug}
                locale={locale}
                cancellationPenalty={tenant.cancellation_penalty}
                showCancel={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
