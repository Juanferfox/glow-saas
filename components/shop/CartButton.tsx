"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";

interface CartButtonProps {
  locale: string;
}

export function CartButton({ locale }: CartButtonProps) {
  const { itemCount } = useCart();

  return (
    <Link
      href={`/${locale}/tienda/carrito`}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all",
        "border border-[var(--brand-border)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
      )}
      style={{ color: "var(--brand-text)" }}
      id="cart-button"
    >
      <ShoppingCart size={15} />
      <span className="hidden sm:inline">Carrito</span>
      {itemCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[10px] font-bold text-white">
          {itemCount}
        </span>
      )}
    </Link>
  );
}
