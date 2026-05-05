"use client";

import { useState } from "react";
import Image from "next/image";
import { ShoppingCart, Tag, AlertCircle, Check } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import { useCart } from "@/contexts/CartContext";
import type { ProductRow } from "@/lib/data/products";
import type { Tenant } from "@/lib/supabase/types";

interface ProductCardProps {
  product: ProductRow;
  tenant: Tenant;
  locale: string;
}

export function ProductCard({ product, tenant, locale }: ProductCardProps) {
  const name = getTenantText(product.name, locale, tenant.default_locale);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= product.stock_alert_threshold;
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const inCart = items.some((i) => i.product.id === product.id);

  function handleAdd() {
    if (outOfStock) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  }

  return (
    <div
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] transition-all duration-200 hover:shadow-lg",
        outOfStock && "opacity-60"
      )}
    >
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.image_url ? (
          <Image
            src={product.image_url}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-3xl opacity-20">
            🧴
          </div>
        )}
        
        {/* Badge Stock */}
        {outOfStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-black">
              Agotado
            </span>
          </div>
        ) : lowStock && (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-orange-500/90 px-2 py-0.5 text-[9px] font-bold text-white">
            <AlertCircle size={10} />
            ÚLTIMAS UNIDADES
          </div>
        )}

        {/* Badge Categoría */}
        {product.category && (
          <div className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9px] font-medium uppercase tracking-tighter text-white">
            {product.category}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <h3
          className="line-clamp-2 text-sm font-bold leading-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          {name}
        </h3>
        
        <div className="mt-auto pt-3">
          <div className="flex items-center justify-between">
            <span className="text-base font-black" style={{ color: "var(--brand-primary)" }}>
              {formatCurrency(
                product.price,
                `${locale}-${tenant.currency === "COP" ? "CO" : "US"}`,
                tenant.currency
              )}
            </span>
            <button
              id={`add-to-cart-${product.id}`}
              onClick={handleAdd}
              disabled={outOfStock}
              className={cn(
                "rounded-full p-2 text-white shadow-md transition-all hover:scale-110 active:scale-95 disabled:opacity-0",
                added || inCart
                  ? "bg-green-500"
                  : "bg-[var(--brand-primary)]"
              )}
            >
              {added || inCart ? <Check size={16} /> : <ShoppingCart size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
