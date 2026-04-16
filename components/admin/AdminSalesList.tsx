"use client";

import Image from "next/image";
import { User, Package2, ChevronRight, CheckCircle2, Clock, XCircle } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import type { Tenant } from "@/lib/supabase/types";

interface AdminSalesListProps {
  sales: {
    id: string;
    total: number;
    status: string;
    created_at: string;
    points_used: number;
    client: { full_name: string; avatar_url: string | null };
    items: {
      id: string;
      quantity: number;
      unit_price: number;
      product: { name: Record<string, string> };
    }[];
  }[];
  tenant: Tenant;
  locale: string;
}

export function AdminSalesList({ sales, tenant, locale }: AdminSalesListProps) {
  if (sales.length === 0) {
    return (
      <div className="py-20 text-center opacity-40">
        <p>No se han registrado ventas recientemente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sales.map((order) => (
        <div
          key={order.id}
          className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] transition-all hover:shadow-md"
        >
          {/* Header del pedido */}
          <div className="flex items-center justify-between border-b border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-zinc-500/10">
                {order.client?.avatar_url ? (
                  <Image src={order.client.avatar_url} alt={order.client.full_name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User size={14} className="opacity-40" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-xs font-bold leading-none">{order.client?.full_name || "Cliente"}</p>
                <p className="mt-1 text-[10px] opacity-40">
                  {new Date(order.created_at).toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={cn(
                "rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                order.status === "delivered" ? "bg-green-500/10 text-green-500" :
                order.status === "cancelled" ? "bg-red-500/10 text-red-500" :
                "bg-orange-500/10 text-orange-500"
              )}>
                {order.status === "delivered" ? "Entregado" :
                 order.status === "cancelled" ? "Cancelado" : "Pendiente"}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="px-4 py-4 sm:px-6">
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-500/5 text-xs">
                      <Package2 size={14} className="opacity-40" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold">
                        {getTenantText(item.product?.name || {}, locale, tenant.default_locale)}
                      </p>
                      <p className="text-[10px] opacity-45">Cant: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold opacity-60">
                    {formatCurrency(item.unit_price * item.quantity, locale, tenant.currency)}
                  </p>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-[var(--brand-border)] pt-4">
              <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest opacity-40 text-[var(--brand-text)]">
                Total del pedido
              </div>
              <div className="text-right">
                <p className="text-lg font-black" style={{ color: "var(--brand-primary)" }}>
                  {formatCurrency(order.total, locale, tenant.currency)}
                </p>
                {order.points_used > 0 && (
                  <p className="text-[9px] font-bold text-orange-500">
                    -{order.points_used} pts usados
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Acciones si está pendiente */}
          {order.status === "pending" && (
            <div className="flex border-t border-[var(--brand-border)] bg-zinc-500/5">
              <button className="flex flex-1 items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-green-500 transition-colors hover:bg-green-500/10">
                <CheckCircle2 size={12} />
                Marcar Entregado
              </button>
              <div className="w-[1px] bg-[var(--brand-border)]" />
              <button className="flex flex-1 items-center justify-center gap-2 py-3 text-[10px] font-bold uppercase tracking-wider text-red-500 transition-colors hover:bg-red-500/10">
                <XCircle size={12} />
                Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
