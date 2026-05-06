"use client";

import { AlertTriangle, ArrowDown, ArrowUp, Pencil, Power, PowerOff, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import type { ProductRow } from "@/lib/data/products";
import type { InventoryMovement } from "@/lib/data/inventory";
import type { Tenant } from "@/lib/supabase/types";

interface AdminInventoryTableProps {
  products: ProductRow[];
  movements: InventoryMovement[];
  tenant: Tenant;
  locale: string;
  onEdit?: (product: ProductRow) => void;
  onToggleActive?: (product: ProductRow) => void;
}

export function AdminInventoryTable({ products, movements, tenant, locale, onEdit, onToggleActive }: AdminInventoryTableProps) {
  return (
    <div className="space-y-8">
      {/* Alertas de Stock Bajo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {products.filter(p => p.stock <= p.stock_alert_threshold).map(p => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/5 p-4"
          >
            <AlertTriangle className="text-orange-500" size={18} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Stock Bajo</p>
              <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
                {getTenantText(p.name, locale, tenant.default_locale)}
              </p>
              <p className="text-xs opacity-60" style={{ color: "var(--brand-text)" }}>Quedan {p.stock} unidades</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabla de Productos */}
      <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--brand-border)] bg-zinc-500/5 text-[10px] font-bold uppercase tracking-widest opacity-60">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4 text-center">Stock</th>
                <th className="px-6 py-4 text-center">Alert a</th>
                <th className="px-6 py-4 text-right">Precio</th>
                <th className="px-6 py-4 text-center">Estado</th>
                <th className="px-6 py-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--brand-border)]">
              {products.map((p) => (
                <tr key={p.id} className="transition-colors hover:bg-zinc-500/5">
                  <td className="px-6 py-4 font-bold" style={{ color: "var(--brand-text)" }}>
                    <div>
                      {getTenantText(p.name, locale, tenant.default_locale)}
                      {p.description && (
                        <p className="text-[10px] opacity-40 font-normal mt-0.5 line-clamp-1">
                          {getTenantText(p.description as Record<string, string>, locale, tenant.default_locale)}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-zinc-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tighter">
                      {p.category ?? "sin cat"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "inline-block rounded-lg px-3 py-1 font-mono font-bold",
                        p.stock <= p.stock_alert_threshold
                          ? "bg-red-500/10 text-red-500"
                          : "bg-green-500/10 text-green-500"
                      )}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center opacity-40">
                    {p.stock_alert_threshold}
                  </td>
                  <td className="px-6 py-4 text-right font-black" style={{ color: "var(--brand-primary)" }}>
                    ${p.price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold",
                        p.active
                          ? "bg-green-500/10 text-green-500"
                          : "bg-red-500/10 text-red-400"
                      )}
                    >
                      {p.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEdit?.(p)}
                        className="rounded-lg p-1.5 opacity-40 hover:opacity-100 hover:bg-zinc-500/10 transition-all"
                        title="Editar producto"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => onToggleActive?.(p)}
                        className={cn(
                          "rounded-lg p-1.5 transition-all",
                          p.active
                            ? "opacity-40 hover:opacity-100 hover:bg-red-500/10 text-red-400"
                            : "opacity-40 hover:opacity-100 hover:bg-green-500/10 text-green-500"
                        )}
                        title={p.active ? "Desactivar" : "Activar"}
                      >
                        {p.active ? <PowerOff size={14} /> : <Power size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historial de Movimientos de hoy */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Movimientos recientes</h3>
        <div className="space-y-2">
          {movements.length === 0 ? (
            <p className="py-4 text-center text-xs opacity-30 italic">No hay movimientos registrados hoy.</p>
          ) : (
            movements.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-3"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "rounded-full p-2",
                    m.type === "entrada" ? "bg-green-500/10 text-green-500" :
                    m.type === "salida" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                  )}>
                    {m.type === "entrada" ? <ArrowUp size={14} /> :
                     m.type === "salida" ? <ArrowDown size={14} /> : <RefreshCcw size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold" style={{ color: "var(--brand-text)" }}>
                      {getTenantText(m.product_name, locale, tenant.default_locale)}
                    </p>
                    <p className="text-[10px] opacity-40">{m.reason || "Sin motivo"}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-xs font-black",
                    m.quantity > 0 ? "text-green-500" : "text-red-500"
                  )}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </p>
                  <p className="text-[9px] opacity-30">
                    {new Date(m.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
