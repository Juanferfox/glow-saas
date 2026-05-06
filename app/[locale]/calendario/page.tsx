import { headers } from "next/headers";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, RefreshCw, Clock, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { getCalendarEvents, getTreatmentPlans, getTreatmentSessions, getOrCreateCalendarToken } from "@/lib/data/calendar";
import { WeekCalendar } from "@/components/calendar/WeekCalendar";
import { SyncCalendarCard } from "@/components/calendar/SyncCalendarCard";
import { TreatmentPlanCard } from "@/components/calendar/TreatmentPlanCard";
import { WorkerActivity } from "@/components/profile/WorkerActivity";
import { getMyAppointments } from "@/lib/data/appointments";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CalendarioPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });

  // ── Tenant ────────────────────────────────────────────────────────────────
  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) redirect(`/${locale}`);

  // ── Auth + rol ────────────────────────────────────────────────────────────
  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  let userId   = "dev-user";
  let specialistId: string | null = null;
  const userRoleArr: ["cliente" | "trabajadora" | "recepcionista" | "admin"] = ["cliente"];

  if (isDevMode) {
    try {
      const cookieStore = await cookies();
      const devCookie = cookieStore.get("dev-session")?.value;
      if (devCookie) {
        const profile = JSON.parse(Buffer.from(devCookie, "base64").toString("utf-8"));
        userId = profile.id || userId;
        userRoleArr[0] = profile.role || "cliente";
        specialistId = profile.specialist_id ?? null;
      }
    } catch {}
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/auth/login?next=/${locale}/calendario`);
    userId = user.id;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .single();

    const role = (profile?.role as "cliente" | "trabajadora" | "recepcionista" | "admin") ?? "cliente";
    userRoleArr[0] = role;

    // Admin tiene su propio calendario completo en /admin/calendario
    if (role === "admin") {
      redirect(`/${locale}/admin/calendario`);
    }
  }

  const userRole = userRoleArr[0];

  // ── Datos ─────────────────────────────────────────────────────────────────
  const now   = new Date();
  const from  = new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
  const to    = new Date(now.getTime() + 90 * 86_400_000).toISOString().slice(0, 10);

  const [events, treatmentPlans, icalToken] = await Promise.all([
    getCalendarEvents(tenant.id, userId, { from, to }, userRole),
    userRole === "cliente" ? getTreatmentPlans(tenant.id, userId) : Promise.resolve([]),
    getOrCreateCalendarToken(userId),
  ]);

  // Citas de hoy para la trabajadora
  const todayAppointments = userRole === "trabajadora"
    ? (await getMyAppointments(tenant.id, userId)).filter((a) => {
        const d = new Date(a.scheduled_at);
        const t = new Date();
        return d.toDateString() === t.toDateString() && a.status !== "cancelled";
      })
    : [];

  // Sesiones de cada plan (solo cliente)
  const plansWithSessions = await Promise.all(
    treatmentPlans.map(async (plan) => ({
      plan,
      sessions: await getTreatmentSessions(plan.id),
    }))
  );

  const isReadOnly = userRole === "trabajadora" || userRole === "recepcionista";

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <CalendarDays size={20} style={{ color: "var(--brand-primary)" }} />
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
            >
              {t("title")}
            </h1>
          </div>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            {isReadOnly ? t("readOnlyDesc") : t("desc")}
          </p>
        </div>
        {isReadOnly && (
          <span
            className="flex-shrink-0 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
              color: "var(--brand-primary)",
            }}
          >
            {t("readOnly")}
          </span>
        )}
      </div>

      {/* Calendario semanal */}
      <WeekCalendar
        events={events}
        readOnly={isReadOnly}
        locale={locale}
      />

      {/* Planes de tratamiento (solo clientes) */}
      {plansWithSessions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} style={{ color: "var(--brand-primary)" }} />
            <h2 className="text-base font-semibold" style={{ color: "var(--brand-text)" }}>
              {t("treatmentPlans")}
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {plansWithSessions.map(({ plan, sessions }) => (
              <TreatmentPlanCard
                key={plan.id}
                plan={plan}
                sessions={sessions}
                locale={locale}
              />
            ))}
          </div>
        </section>
      )}

      {/* Actividad de la trabajadora */}
      {userRole === "trabajadora" && (
        <div className="grid gap-6 sm:grid-cols-2">
          <WorkerActivity />

          {/* Citas de hoy */}
          <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Clock size={16} className="opacity-50" style={{ color: "var(--brand-primary)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
                Mis citas de hoy
              </h3>
            </div>

            {todayAppointments.length === 0 ? (
              <p className="text-xs opacity-40 text-center py-4" style={{ color: "var(--brand-text)" }}>
                No tienes citas agendadas para hoy
              </p>
            ) : (
              <div className="space-y-2">
                {todayAppointments.map((appt) => (
                  <div
                    key={appt.id}
                    className="flex items-center gap-3 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] p-3"
                  >
                    <span className="text-lg font-black" style={{ color: "var(--brand-primary)" }}>
                      {new Date(appt.scheduled_at).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--brand-text)" }}>
                        {typeof appt.service_name === "object"
                          ? (appt.service_name as Record<string, string>).es ?? "Servicio"
                          : "Servicio"}
                      </p>
                      {appt.notes && (
                        <p className="text-[10px] opacity-40 truncate" style={{ color: "var(--brand-text)" }}>
                          {appt.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Sincronización iCal */}
      <SyncCalendarCard token={icalToken} locale={locale} />
    </div>
  );
}
