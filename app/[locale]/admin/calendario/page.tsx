import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { CalendarDays } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { getCalendarEvents } from "@/lib/data/calendar";
import { getSpecialists } from "@/lib/data/specialists";
import { TeamCalendarView } from "@/components/calendar/TeamCalendarView";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const SPECIALIST_PALETTE = [
  "#8b5cf6", "#ec4899", "#06b6d4", "#f59e0b",
  "#10b981", "#ef4444", "#6366f1", "#84cc16",
];

export default async function AdminCalendarioPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "calendar" });

  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  const now  = new Date();
  const from = new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  const to   = new Date(now.getTime() + 60 * 86_400_000).toISOString().slice(0, 10);

  const [specialists, events] = await Promise.all([
    getSpecialists(tenant.id),
    getCalendarEvents(tenant.id, "admin", { from, to }, "admin"),
  ]);

  const specialistsWithColor = specialists.map((sp, i) => ({
    id: sp.id,
    name: sp.name,
    color: SPECIALIST_PALETTE[i % SPECIALIST_PALETTE.length],
  }));

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-3">
        <CalendarDays size={22} style={{ color: "var(--brand-primary)" }} />
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
          >
            {t("teamTitle")}
          </h2>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            {t("teamDesc")}
          </p>
        </div>
      </div>

      {/* Vista de equipo — client component */}
      <TeamCalendarView
        events={events}
        specialists={specialistsWithColor}
        locale={locale}
      />
    </div>
  );
}
