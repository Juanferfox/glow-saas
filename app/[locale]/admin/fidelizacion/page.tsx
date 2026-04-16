import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { AdminLoyaltyConfig } from "@/components/admin/AdminLoyaltyConfig";
import { Settings2 } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function FidelizacionConfigPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings2 size={20} className="text-[var(--brand-primary)]" />
        <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Configuración de Fidelización</h2>
      </div>

      <AdminLoyaltyConfig
        tenant={tenant}
        locale={locale}
      />
    </div>
  );
}
