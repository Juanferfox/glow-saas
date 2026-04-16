import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getProducts } from "@/lib/data/products";
import { getInventoryMovements } from "@/lib/data/inventory";
import InventarioContent from "@/app/[locale]/admin/inventario/InventarioContent";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function InventarioPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar productos y movimientos
  const products = await getProducts(tenant.id);
  const movements = await getInventoryMovements(tenant.id);

  return (
    <InventarioContent
      tenant={tenant}
      locale={locale}
      products={products}
      movements={movements}
    />
  );
}
