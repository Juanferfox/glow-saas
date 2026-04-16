"use client";

import { useState } from "react";
import { ProductCard } from "@/components/shop/ProductCard";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ProductRow } from "@/lib/data/products";
import type { Tenant } from "@/lib/supabase/types";

interface ProductGridProps {
  products: ProductRow[];
  tenant: Tenant;
  locale: string;
}

export function ProductGrid({ products, tenant, locale }: ProductGridProps) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [...new Set(products.map((p) => p.category ?? "otros"))];

  const filtered = products.filter((p) => {
    const name = (p.name[locale] || p.name[tenant.default_locale] || "").toLowerCase();
    const matchQuery = !query || name.includes(query.toLowerCase());
    const matchCat = !activeCategory || p.category === activeCategory;
    return matchQuery && matchCat;
  });

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda y categorías */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
          <input
            type="search"
            placeholder="Buscar productos…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
          />
        </div>

        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none sm:pb-0">
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                !activeCategory
                  ? "bg-[var(--brand-primary)] text-white"
                  : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
              )}
            >
              Todos
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold capitalize transition-all",
                  activeCategory === cat
                    ? "bg-[var(--brand-primary)] text-white"
                    : "border border-[var(--brand-border)] text-[var(--brand-text)] opacity-60 hover:opacity-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center opacity-40">
          <p>No se encontraron productos en esta categoría.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              tenant={tenant}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
