"use client";

import { useState } from "react";
import { AdminInventoryTable } from "@/components/admin/AdminInventoryTable";
import { ProductForm } from "@/components/admin/ProductForm";
import { Package, Plus } from "lucide-react";
import type { Tenant } from "@/lib/supabase/types";
import type { ProductRow } from "@/lib/data/products";

interface InventarioContentProps {
  tenant: Tenant;
  locale: string;
  products: ProductRow[];
  movements: any[];
}

export default function InventarioContent({ tenant, locale, products: initialProducts, movements }: InventarioContentProps) {
  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRow | null>(null);

  function handleEdit(product: ProductRow) {
    setEditingProduct(product);
    setShowForm(true);
  }

  async function handleToggleActive(product: ProductRow) {
    const tenantSlug = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tenant") ?? tenant.slug
      : tenant.slug;

    await fetch(`/api/admin/productos?tenant=${tenantSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: product.id, active: !product.active }),
    });

    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, active: !p.active } : p))
    );
  }

  function handleClose() {
    setShowForm(false);
    setEditingProduct(null);
  }

  function handleSuccess() {
    window.location.reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={20} className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Inventario</h2>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setShowForm(true); }}
          className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Plus size={14} />
          Nuevo Producto
        </button>
      </div>

      <AdminInventoryTable
        products={products}
        movements={movements}
        tenant={tenant}
        locale={locale}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      {showForm && (
        <ProductForm
          tenant={tenant}
          locale={locale}
          editProduct={editingProduct}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
