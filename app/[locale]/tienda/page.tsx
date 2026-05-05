import { headers } from "next/headers";
import Link from "next/link";
import { getTenant } from "@/lib/tenant";
import { getProducts } from "@/lib/data/products";
import { ProductGrid } from "@/components/shop/ProductGrid";
import { CartButton } from "@/components/shop/CartButton";
import { ShoppingBag } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Página de tienda de productos (catálogo público).
 * Los usuarios pueden ver productos y "apartarlos" si tienen sesión.
 */
export default async function TiendaPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  if (!tenant) return null;

  // 2. Cargar productos
  const products = await getProducts(tenant.id);

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[var(--brand-primary)]">
            <ShoppingBag size={20} />
            <span className="text-xs font-bold uppercase tracking-widest">Tienda</span>
          </div>
          <CartButton locale={locale} />
        </div>
        <h1
          className="text-3xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          Nuestros Productos
        </h1>
        <p className="text-sm opacity-50 max-w-md" style={{ color: "var(--brand-text)" }}>
          Productos profesionales seleccionados para el cuidado de tu belleza en casa.
        </p>
      </div>

      {/* Catálogo */}
      <ProductGrid
        products={products}
        tenant={tenant}
        locale={locale}
      />
    </div>
  );
}
