"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Scissors, Plus, Pencil, Eye, EyeOff, X, Check, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  id: string;
  name: Record<string, string>;
  description: Record<string, string> | null;
  duration_min: number;
  price: number;
  category: string | null;
  active: boolean;
  sort_order: number;
}

const CATEGORIES = [
  { value: "", label: "Todas" },
  { value: "uñas", label: "Uñas" },
  { value: "pestañas", label: "Pestañas" },
  { value: "cejas", label: "Cejas" },
  { value: "labios", label: "Labios" },
  { value: "capilar", label: "Capilar" },
  { value: "facial", label: "Facial" },
  { value: "corporal", label: "Corporal" },
];

const EMPTY_FORM = {
  id: "",
  name: { es: "" },
  description: { es: "" },
  duration_min: 60,
  price: 0,
  category: "facial",
  active: true,
};

function formatCOP(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

export default function AdminServiciosPage() {
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get("tenant") ?? "";

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState("");
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function loadServices() {
    setLoading(true);
    const res = await fetch(`/api/admin/servicios?tenant=dev-${tenantSlug || "fm-glow-studio"}`);
    if (res.ok) {
      const data = await res.json();
      setServices(data.services ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { loadServices(); }, [tenantSlug]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function openEdit(svc: Service) {
    setEditingService(svc);
    setForm({
      id: svc.id,
      name: { es: svc.name?.es ?? "" },
      description: { es: svc.description?.es ?? "" },
      duration_min: svc.duration_min,
      price: svc.price,
      category: svc.category ?? "facial",
      active: svc.active,
    });
    setShowForm(true);
  }

  function openNew() {
    setEditingService(null);
    setForm({ ...EMPTY_FORM });
    setShowForm(true);
  }

  async function handleSave() {
    setSaving(true);
    const method = editingService ? "PATCH" : "POST";
    const payload = editingService
      ? { id: form.id, name: form.name, description: form.description, duration_min: form.duration_min, price: form.price, category: form.category, active: form.active }
      : { name: form.name, description: form.description, duration_min: form.duration_min, price: form.price, category: form.category, tenant_id: `dev-${tenantSlug || "fm-glow-studio"}` };

    const res = await fetch("/api/admin/servicios", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      showToast(editingService ? "Servicio actualizado ✓" : "Servicio creado ✓");
      setShowForm(false);
      await loadServices();
    } else {
      showToast("Error al guardar. Intenta de nuevo.");
    }
    setSaving(false);
  }

  async function toggleActive(svc: Service) {
    await fetch("/api/admin/servicios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: svc.id, active: !svc.active }),
    });
    showToast(svc.active ? "Servicio desactivado" : "Servicio activado");
    await loadServices();
  }

  const filtered = filterCat
    ? services.filter((s) => s.category === filterCat)
    : services;

  return (
    <div className="space-y-6 pb-10">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-[var(--brand-text)] px-5 py-3 text-sm font-semibold text-[var(--brand-bg)] shadow-xl">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--brand-text)" }}>
            Gestión de Servicios
          </h2>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            Edita precios, duraciones y descripciones. Los cambios se reflejan en el catálogo.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold text-white shadow transition-all hover:-translate-y-0.5 hover:shadow-lg"
          style={{ backgroundColor: "var(--brand-primary)" }}
        >
          <Plus size={16} /> Agregar servicio
        </button>
      </div>

      {/* Filtro por categoría */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setFilterCat(value)}
            className={cn(
              "rounded-full border px-4 py-1.5 text-xs font-semibold transition-all",
              filterCat === value
                ? "border-[var(--brand-primary)] bg-[var(--brand-primary)] text-white"
                : "border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Lista de servicios */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin opacity-30" />
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
          {filtered.length === 0 ? (
            <p className="p-10 text-center text-sm opacity-30 italic">No hay servicios en esta categoría.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--brand-border)]">
                  {["Servicio", "Categoría", "Duración", "Precio", "Estado", ""].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-widest opacity-40"
                      style={{ color: "var(--brand-text)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--brand-border)]">
                {filtered.map((svc) => (
                  <tr key={svc.id} className={cn("transition-colors hover:bg-zinc-500/5", !svc.active && "opacity-40")}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                          <Scissors size={14} />
                        </div>
                        <span className="font-semibold" style={{ color: "var(--brand-text)" }}>
                          {svc.name?.es ?? "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded-full bg-[var(--brand-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--brand-primary)] capitalize">
                        {svc.category ?? "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3 opacity-60" style={{ color: "var(--brand-text)" }}>
                      {svc.duration_min} min
                    </td>
                    <td className="px-5 py-3 font-bold" style={{ color: "var(--brand-text)" }}>
                      {formatCOP(svc.price)}
                    </td>
                    <td className="px-5 py-3">
                      <span className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        svc.active ? "bg-emerald-500/10 text-emerald-600" : "bg-zinc-500/10 text-zinc-500"
                      )}>
                        {svc.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(svc)}
                          className="rounded-lg border border-[var(--brand-border)] p-1.5 transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                          title="Editar"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => toggleActive(svc)}
                          className="rounded-lg border border-[var(--brand-border)] p-1.5 transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                          title={svc.active ? "Desactivar" : "Activar"}
                        >
                          {svc.active ? <EyeOff size={13} /> : <Eye size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Modal de edición / creación */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 shadow-2xl">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-black" style={{ color: "var(--brand-text)" }}>
                {editingService ? "Editar servicio" : "Nuevo servicio"}
              </h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 hover:bg-zinc-500/10">
                <X size={18} style={{ color: "var(--brand-text)" }} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                  Nombre
                </label>
                <input
                  value={form.name.es}
                  onChange={(e) => setForm((f) => ({ ...f, name: { es: e.target.value } }))}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  style={{ color: "var(--brand-text)" }}
                  placeholder="Ej: Limpieza Facial Deep"
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                  Descripción
                </label>
                <textarea
                  value={form.description.es}
                  onChange={(e) => setForm((f) => ({ ...f, description: { es: e.target.value } }))}
                  rows={3}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  style={{ color: "var(--brand-text)" }}
                  placeholder="Descripción breve del servicio..."
                />
              </div>

              {/* Categoría + Duración */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                    Categoría
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    style={{ color: "var(--brand-text)" }}
                  >
                    {CATEGORIES.filter((c) => c.value).map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.duration_min}
                    onChange={(e) => setForm((f) => ({ ...f, duration_min: Number(e.target.value) }))}
                    className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                    style={{ color: "var(--brand-text)" }}
                  />
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="mb-1 block text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                  Precio (COP)
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  style={{ color: "var(--brand-text)" }}
                />
              </div>

              {/* Activo toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold opacity-60" style={{ color: "var(--brand-text)" }}>
                  Servicio activo
                </span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                  className={cn(
                    "relative h-6 w-11 rounded-full transition-colors",
                    form.active ? "bg-[var(--brand-primary)]" : "bg-zinc-300"
                  )}
                >
                  <span className={cn(
                    "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                    form.active ? "translate-x-5" : "translate-x-0.5"
                  )} />
                </button>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-2xl border border-[var(--brand-border)] py-2.5 text-sm font-semibold transition-colors hover:bg-zinc-500/5"
                style={{ color: "var(--brand-text)" }}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.name.es}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl py-2.5 text-sm font-bold text-white shadow transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--brand-primary)" }}
              >
                {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                {editingService ? "Guardar cambios" : "Crear servicio"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
