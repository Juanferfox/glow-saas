import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getLoyaltyData } from "@/lib/data/loyalty";
import { PointsWallet } from "@/components/loyalty/PointsWallet";
import { Gift } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Página de Wallet de Puntos.
 * Muestra el saldo actual, beneficios disponibles e historial de movimientos.
 */
export default async function PuntosPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar datos de fidelidad
  const { balance, history } = await getLoyaltyData(tenant.id);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 text-[var(--brand-primary)]">
          <Gift size={20} />
          <span className="text-xs font-bold uppercase tracking-widest">Fidelidad</span>
        </div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          Mis Puntos
        </h1>
        <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
          Acumula puntos en cada servicio y canjéalos por beneficios exclusivos.
        </p>
      </div>

      <PointsWallet
        balance={balance}
        history={history}
        tenant={tenant}
        locale={locale}
      />
    </div>
  );
}
