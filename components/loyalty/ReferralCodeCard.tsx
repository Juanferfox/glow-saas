"use client";

import { useState } from "react";
import { Copy, Check, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReferralCodeCardProps {
  referralCode: string | null;
  referralBonus: number;
  locale: string;
}

export function ReferralCodeCard({ referralCode, referralBonus }: ReferralCodeCardProps) {
  const [copied, setCopied] = useState(false);

  if (!referralCode) return null;

  async function handleCopy() {
    await navigator.clipboard.writeText(referralCode!);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5 space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus size={16} className="opacity-50" style={{ color: "var(--brand-primary)" }} />
        <h3 className="text-sm font-semibold" style={{ color: "var(--brand-text)" }}>
          Tu código de referido
        </h3>
      </div>

      <div className="flex items-center gap-3">
        <code
          className="rounded-lg border border-[var(--brand-border)] bg-[var(--brand-bg)] px-4 py-2.5 text-lg font-mono font-bold tracking-wider"
          style={{ color: "var(--brand-primary)" }}
        >
          {referralCode}
        </code>
        <button
          onClick={handleCopy}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all",
            copied
              ? "bg-green-500/20 text-green-600"
              : "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] hover:bg-[var(--brand-primary)]/20"
          )}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>

      <p className="text-xs opacity-50" style={{ color: "var(--brand-text)" }}>
        Comparte tu código y gana {referralBonus} puntos por cada cliente que agende.
      </p>
    </section>
  );
}
