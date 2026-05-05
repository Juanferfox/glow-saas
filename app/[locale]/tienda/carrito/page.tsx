import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { CartPage } from "@/components/shop/CartPage";
import { ShoppingBag } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function CarritoPage({ params }: PageProps) {
  const { locale } = await params;

  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex items-center gap-2" style={{ color: "var(--brand-primary)" }}>
        <ShoppingBag size={20} />
        <span className="text-xs font-bold uppercase tracking-widest">Carrito</span>
      </div>
      <CartPage tenant={tenant} locale={locale} />
    </div>
  );
}
