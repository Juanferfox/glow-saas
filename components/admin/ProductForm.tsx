"use client";

import { useState } from "react";
import { X, Upload, Loader2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tenant } from "@/lib/supabase/types";

interface ProductFormProps {
  tenant: Tenant;
  locale: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function ProductForm({ tenant, locale, onClose, onSuccess }: ProductFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: { es: "", en: "" },
    description: { es: "", en: "" },
    price: 0,
    stock: 0,
    category: "",
    stock_alert_threshold: 5,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    
    // Simulación en dev
    setTimeout(() => {
      setLoading(false);
      onSuccess();
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-6 py-4">
          <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}>
            Nuevo Producto
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
            {loading ? "Guardando..." : "Guardar Producto"}
          </button>
        </div>
      </div>
    </div>
  );
}
