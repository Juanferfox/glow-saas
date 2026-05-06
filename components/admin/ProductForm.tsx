"use client";

import { useState, useEffect } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/supabase/types";
import type { ProductRow } from "@/lib/data/products";

interface ProductFormProps {
  tenant: Tenant;
  locale: string;
  editProduct?: ProductRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductForm({ tenant, locale, editProduct, onClose, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: { es: "", en: "" } as Record<string, string>,
    description: { es: "", en: "" } as Record<string, string>,
    price: 0,
    stock: 0,
    category: "",
    stock_alert_threshold: 5,
    active: true,
  });

  const isEditing = !!editProduct;

  useEffect(() => {
    if (editProduct) {
      setFormData({
        name: editProduct.name ?? { es: "" },
        description: (editProduct.description as Record<string, string>) ?? { es: "" },
        price: editProduct.price,
        stock: editProduct.stock,
        category: editProduct.category ?? "",
        stock_alert_threshold: editProduct.stock_alert_threshold,
        active: editProduct.active,
      });
    }
  }, [editProduct]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const tenantSlug = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("tenant") ?? tenant.slug
      : tenant.slug;

    try {
      if (isEditing) {
        const res = await fetch(`/api/admin/productos?tenant=${tenantSlug}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editProduct!.id, ...formData }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Error al actualizar");
      } else {
        const res = await fetch(`/api/admin/productos?tenant=${tenantSlug}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, tenant_id: tenant.id }),
        });
        const data = await res.json();
        if (!res.ok || !data.success) throw new Error(data.error || "Error al crear");
      }
      onSuccess();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-6 py-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}>
            {isEditing ? "Editar Producto" : "Nuevo Producto"}
          </h3>
          <button onClick={onClose} className="rounded-full p-2 opacity-40 hover:bg-zinc-500/10 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-40">Nombre (ES)</label>
              <input
                required
                type="text"
                value={formData.name.es}
                onChange={e => setFormData(prev => ({ ...prev, name: { ...prev.name, es: e.target.value } }))}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-40">Categoría</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase opacity-40">Descripción (ES)</label>
            <textarea
              rows={2}
              value={formData.description.es}
              onChange={e => setFormData(prev => ({ ...prev, description: { ...prev.description, es: e.target.value } }))}
              className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-40">Precio</label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-40">Stock Inicial</label>
              <input
                type="number"
                value={formData.stock}
                onChange={e => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase opacity-40">Alerta Stock</label>
              <input
                type="number"
                value={formData.stock_alert_threshold}
                onChange={e => setFormData(prev => ({ ...prev, stock_alert_threshold: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-zinc-500/5 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              />
            </div>
          </div>

          <div className="rounded-xl border border-dashed border-[var(--brand-border)] p-8 text-center bg-zinc-500/5">
            <Upload className="mx-auto mb-2 opacity-20" size={24} />
            <p className="text-xs opacity-40">Haz clic para subir imagen del producto</p>
          </div>

          {isEditing && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 rounded accent-[var(--brand-primary)]"
              />
              <span className="text-xs font-semibold opacity-60" style={{ color: "var(--brand-text)" }}>
                Producto activo (visible en tienda)
              </span>
            </label>
          )}

          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--brand-border)] bg-zinc-500/5 px-6 py-4">
          <button
            onClick={onClose}
            className="text-xs font-bold uppercase opacity-40 hover:opacity-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {loading ? "Guardando..." : isEditing ? "Actualizar Producto" : "Guardar Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
