"use client";

import { useState } from "react";
import { Gift, Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const REDEEM_OPTIONS = [
  { id: "r1", label: "Descuento 10% en próximo servicio", points_cost: 100, type: "service_discount" },
  { id: "r2", label: "Descuento 20% en tienda",           points_cost: 200, type: "store_discount" },
  { id: "r3", label: "Manicura Tradicional gratis",       points_cost: 500, type: "free_service" },
  { id: "r4", label: "Producto de tienda hasta $50.000",  points_cost: 750, type: "store_credit" },
];

interface RedeemSectionProps {
  balance: number;
}

export function RedeemSection({ balance }: RedeemSectionProps) {
  const [redeemed, setRedeemed] = useState<string | null>(null);
  const [redeemCode, setRedeemCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleRedeem(option: typeof REDEEM_OPTIONS[number]) {
    const code = `${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setRedeemed(option.id);
    setRedeemCode(code);
  }

  async function copyCode() {
    if (!redeemCode) return;
    await navigator.clipboard.writeText(redeemCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (redeemed && redeemCode) {
    return (
      <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 text-center space-y-3">
        <Check size={40} className="mx-auto text-green-500" />
        <h3 className="text-lg font-bold" style={{ color: "var(--brand-text)" }}>
          Canje exitoso
        </h3>
        <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
          Presenta este código en tu próxima visita
        </p>
        <div className="flex items-center justify-center gap-3">
          <code
            className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2 text-lg font-mono font-bold tracking-wider"
            style={{ color: "var(--brand-primary)" }}
          >
            {redeemCode}
          </code>
          <button
            onClick={copyCode}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold",
              copied
                ? "bg-green-500/20 text-green-600"
                : "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20"
            )}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <button
          onClick={() => { setRedeemed(null); setRedeemCode(null); }}
          className="text-xs font-medium underline underline-offset-4"
          style={{ color: "var(--brand-primary)" }}
        >
          Seguir canjeando
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Gift size={16} className="opacity-50" style={{ color: "var(--brand-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
          Canjear puntos
        </h3>
      </div>

      <div className="space-y-2">
        {REDEEM_OPTIONS.map((opt) => {
          const disabled = balance < opt.points_cost;
          return (
            <div
              key={opt.id}
              className="flex items-center justify-between rounded-xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                  {opt.label}
                </p>
                <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
                  {opt.points_cost} puntos
                </p>
              </div>
              <button
                onClick={() => handleRedeem(opt)}
                disabled={disabled}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-semibold transition-opacity",
                  disabled
                    ? "bg-[var(--brand-border)] text-[var(--brand-text)] opacity-30 cursor-not-allowed"
                    : "bg-[var(--brand-primary)] text-white hover:opacity-90"
                )}
              >
                Canjear
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
