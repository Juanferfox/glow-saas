"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ServiceRow } from "@/lib/data/services";
import { getTenantText } from "@/lib/theme";

const CATEGORIES = ["uñas", "pestañas", "cejas", "labios", "capilar", "facial", "corporal", "masaje", "ojos", "depilacion", "cabello"];

interface ServiceEditorProps {
  service: ServiceRow | null;
  locale: string;
  defaultLocale: string;
  onSave: (service: Partial<ServiceRow> & { id?: string }) => Promise<void>;
  onClose: () => void;
}

export function ServiceEditor({ service, locale, defaultLocale, onSave, onClose }: ServiceEditorProps) {
  const isNew = !service;
  const [name, setName] = useState(service ? (getTenantText(service.name, locale, defaultLocale)) : "");
  const [category, setCategory] = useState(service?.category ?? "");
  const [duration, setDuration] = useState(service?.duration_min ?? 30);
  const [price, setPrice] = useState(service?.price ?? 0);
  const [description, setDescription] = useState(service?.description ? getTenantText(service.description, locale, defaultLocale) : "");
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onSave({
        id: service?.id,
        name: { [defaultLocale]: name },
        description: description ? { [defaultLocale]: description } : null,
        duration_min: duration,
        price,
        category: category || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 opacity-50 hover:opacity-100"
        >
          <X size={18} />
        </button>

        <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--brand-text)", fontFamily: "var(--font-heading)" }}>
          {isNew ? "Agregar Servicio" : "Editar Servicio"}
        </h3>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
              Nombre
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={cn(
                "w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm",
                "bg-[var(--brand-bg)] text-[var(--brand-text)] placeholder:opacity-40",
                "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              )}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
              Categoría
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={cn(
                "w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm",
                "bg-[var(--brand-bg)] text-[var(--brand-text)]",
                "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              )}
            >
              <option value="">Sin categoría</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
                Duración (min)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min={5}
                required
                className={cn(
                  "w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm",
                  "bg-[var(--brand-bg)] text-[var(--brand-text)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
                Precio (COP)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                min={0}
                required
                className={cn(
                  "w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm",
                  "bg-[var(--brand-bg)] text-[var(--brand-text)]",
                  "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                )}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1 opacity-50" style={{ color: "var(--brand-text)" }}>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={cn(
                "w-full rounded-xl border border-[var(--brand-border)] px-3 py-2 text-sm resize-none",
                "bg-[var(--brand-bg)] text-[var(--brand-text)] placeholder:opacity-40",
                "focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
              )}
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
              Activo
            </label>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                active ? "bg-green-500" : "bg-zinc-600"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
                  active ? "left-[22px]" : "left-0.5"
                )}
              />
            </button>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--brand-border)] py-2.5 text-sm font-medium opacity-60 hover:opacity-100"
              style={{ color: "var(--brand-text)" }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "flex-1 rounded-xl py-2.5 text-sm font-semibold text-white",
                "transition-opacity hover:opacity-90 disabled:opacity-50"
              )}
              style={{ backgroundColor: "var(--brand-primary)" }}
            >
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
