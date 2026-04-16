import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getSalesHistory } from "@/lib/data/inventory";
import { AdminSalesList } from "@/components/admin/AdminSalesList";
import { ReceiptText, Download } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function VentasPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar historial de ventas
  const sales = await getSalesHistory(tenant.id);

  const totalToday = sales
    .filter(s => new Date(s.created_at).toDateString() === new Date().toDateString())
    .reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ReceiptText size={20} className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Historial de Ventas</h2>
        </div>
        <button
          className="flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-2 text-xs font-bold transition-all hover:bg-zinc-500/10 active:scale-95"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Resumen de hoy */}
      <div className="rounded-2xl bg-[var(--brand-primary)] p-6 text-white shadow-xl">
        <p className="text-xs font-bold uppercase tracking-widest opacity-80">Ventas de hoy</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-3xl font-black">{tenant.currency === "COP" ? "$" : ""}{totalToday.toLocaleString()}</span>
          <span className="text-sm opacity-80">{tenant.currency}</span>
        </div>
      </div>

      <AdminSalesList
        sales={sales}
        tenant={tenant}
        locale={locale}
      />
    </div>
  );
}
