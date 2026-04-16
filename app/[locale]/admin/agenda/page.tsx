import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getSpecialists } from "@/lib/data/specialists";
import { getAppointmentsForDay } from "@/lib/data/appointments";
import { AdminAgendaView } from "@/components/admin/AdminAgendaView";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ date?: string }>;
}

/**
 * Vista de agenda del día para el staff.
 * Permite filtrar por especialista y ver los bloques ocupados.
 */
export default async function AgendaPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { date: dateParam } = await searchParams;

  const today = new Date().toISOString().slice(0, 10);
  const selectedDate = dateParam || today;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar especialistas y citas del día
  const specialists = await getSpecialists(tenant.id);
  const appointments = await getAppointmentsForDay(
    tenant.id,
    selectedDate,
    specialists.map((s) => s.id)
  );

  return (
    <div className="space-y-6">
      <AdminAgendaView
        tenant={tenant}
        locale={locale}
        date={selectedDate}
        specialists={specialists}
        initialAppointments={appointments}
      />
    </div>
  );
}
