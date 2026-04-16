import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getActiveCoupons } from "@/lib/data/coupons";
import { AdminMarketingDashboard } from "@/components/admin/AdminMarketingDashboard";
import { Megaphone, Plus } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function MarketingPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar cupones
  const coupons = await getActiveCoupons(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Megaphone size={20} className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Marketing y Campañas</h2>
        </div>
        <button
          className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={14} />
          Crear Cupón
        </button>
      </div>

      <AdminMarketingDashboard
        coupons={coupons}
        tenant={tenant}
        locale={locale}
      />
    </div>
  );
}
