import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getServices } from "@/lib/data/services";
import { BookingWizard } from "@/components/booking/BookingWizard";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Página de agendamiento de citas.
 * Requiere que el usuario esté autenticado.
 */
export default async function AgendarPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Verificar autenticación
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=/${locale}/agendar`);
  }

  // 2. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  if (!tenant) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
        <p className="text-sm opacity-50">Configura un tenant para poder agendar.</p>
      </div>
    );
  }

  // 3. Cargar servicios
  const services = await getServices(tenant.id);

  return (
    <div className="container mx-auto px-4 py-8">
      <BookingWizard
        tenant={tenant}
        locale={locale}
        services={services}
      />
    </div>
  );
}
