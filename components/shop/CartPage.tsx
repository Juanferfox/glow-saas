"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ShoppingBag, Trash2, Minus, Plus, ArrowLeft, Loader2, CheckCircle2, Star } from "lucide-react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { formatCurrency, cn } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import type { Tenant } from "@/lib/supabase/types";

interface CartPageProps {
  tenant: Tenant;
  locale: string;
}

export function CartPage({ tenant, locale }: CartPageProps) {
  const { items, removeItem, updateQuantity, clearCart, itemCount, subtotal, pointsToUse, setPointsToUse } = useCart();
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const currencyLocale = `${locale}-${tenant.currency === "COP" ? "CO" : "US"}`;

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/shop/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantSlug: tenant.slug,
          items: items.map((i) => ({
            productId: i.product.id,
            quantity: i.quantity,
            unitPrice: i.product.price,
          })),
          pointsToUse,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.error) {
        throw new Error(data.error || "Error al procesar el pedido");
      }

      setOrderId(data.orderId);
      setCompleted(true);
      clearCart();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al procesar el pedido");
    } finally {
      setLoading(false);
    }
  }

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <CheckCircle2 size={56} className="text-green-500" strokeWidth={1.5} />
        <div>
          <h3 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}>
            Pedido apartado con éxito
          </h3>
          <p className="mt-2 text-sm opacity-60" style={{ color: "var(--brand-text)" }}>
            Tu pedido #{orderId} ha sido registrado. Paga en el local cuando retires.
          </p>
          <p className="mt-1 text-xs opacity-40" style={{ color: "var(--brand-text)" }}>
            Ganarás {subtotal >= 1 ? Math.floor(subtotal * tenant.points_per_purchase) : 0} puntos por esta compra.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${locale}/tienda`}
            className="rounded-full border border-[var(--brand-border)] px-6 py-2.5 text-sm font-medium text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-border)]"
          >
            Seguir comprando
          </Link>
          <Link
            href={`/${locale}/perfil`}
            className="rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Ir a mi perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/${locale}/tienda`}
            className="flex items-center gap-1 text-sm font-medium opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: "var(--brand-text)" }}
          >
            <ArrowLeft size={14} />
            Volver
          </Link>
        </div>
        <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}>
          Mi carrito ({itemCount})
        </h2>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed py-16 text-center" style={{ borderColor: "var(--brand-border)" }}>
          <ShoppingBag size={32} className="opacity-20" />
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            Tu carrito está vacío.
          </p>
          <Link
            href={`/${locale}/tienda`}
            className="text-sm font-semibold"
            style={{ color: "var(--brand-primary)" }}
          >
            Explorar productos →
          </Link>
        </div>
      )}

      {/* Items */}
      {items.length > 0 && (
        <>
          <div className="space-y-3">
            {items.map((item) => {
              const name = getTenantText(item.product.name, locale, tenant.default_locale);
              return (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-2xl border p-3"
                  style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-2xl">
                    {item.product.image_url ? (
                      <Image src={item.product.image_url} alt={name} width={56} height={56} className="rounded-xl object-cover" />
                    ) : (
                      "🧴"
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
                      {name}
                    </p>
                    <p className="text-xs font-bold" style={{ color: "var(--brand-primary)" }}>
                      {formatCurrency(item.product.price, currencyLocale, tenant.currency)}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                      className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-[var(--brand-border)] disabled:opacity-20"
                      style={{ borderColor: "var(--brand-border)", color: "var(--brand-text)" }}
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="flex h-7 w-7 items-center justify-center rounded-full border transition-colors hover:bg-[var(--brand-border)] disabled:opacity-20"
                      style={{ borderColor: "var(--brand-border)", color: "var(--brand-text)" }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.product.id)}
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-red-500/10"
                    style={{ color: "var(--brand-text)" }}
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Puntos */}
          {tenant.feature_loyalty && (
            <div
              className="rounded-2xl border p-4 space-y-3"
              style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
            >
              <div className="flex items-center gap-1.5">
                <Star size={14} style={{ color: "var(--brand-primary)" }} />
                <span className="text-xs font-semibold" style={{ color: "var(--brand-text)" }}>
                  Usar puntos de fidelidad
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  value={pointsToUse || ""}
                  onChange={(e) => setPointsToUse(Math.max(0, Number(e.target.value)))}
                  placeholder="0"
                  className="w-24 rounded-xl border px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                  style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)", color: "var(--brand-text)" }}
                />
                <span className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                  Cada punto descuenta COP 100 de tu total
                </span>
              </div>
            </div>
          )}

          {/* Subtotal */}
          <div
            className="rounded-2xl border p-4 space-y-2"
            style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
          >
            <div className="flex justify-between text-sm">
              <span className="opacity-60" style={{ color: "var(--brand-text)" }}>Subtotal</span>
              <span className="font-semibold" style={{ color: "var(--brand-text)" }}>
                {formatCurrency(subtotal, currencyLocale, tenant.currency)}
              </span>
            </div>
            {pointsToUse > 0 && (
              <div className="flex justify-between text-sm">
                <span className="opacity-60" style={{ color: "var(--brand-text)" }}>Puntos ({pointsToUse})</span>
                <span className="font-semibold text-green-500">
                  -{formatCurrency(pointsToUse * 100, currencyLocale, tenant.currency)}
                </span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2" style={{ borderColor: "var(--brand-border)" }}>
              <span className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Total</span>
              <span className="text-lg font-black" style={{ color: "var(--brand-primary)" }}>
                {formatCurrency(Math.max(0, subtotal - pointsToUse * 100), currencyLocale, tenant.currency)}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {/* Checkout */}
          <button
            onClick={handleCheckout}
            disabled={loading}
            className={cn(
              "w-full rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all",
              "hover:opacity-90 hover:-translate-y-0.5",
              "disabled:opacity-50 disabled:translate-y-0 disabled:cursor-not-allowed"
            )}
            style={{ backgroundColor: "var(--brand-primary)" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Procesando…
              </span>
            ) : (
              `Apartar pedido · ${formatCurrency(Math.max(0, subtotal - pointsToUse * 100), currencyLocale, tenant.currency)}`
            )}
          </button>

          <button
            onClick={() => clearCart()}
            className="w-full text-center text-xs font-medium opacity-40 hover:opacity-70 transition-opacity"
            style={{ color: "var(--brand-text)" }}
          >
            Vaciar carrito
          </button>
        </>
      )}
    </div>
  );
}
