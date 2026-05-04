"use client";

import { useState } from "react";
import { Gift, Copy, Check } from "lucide-react";

interface Props {
  referralCode: string | null;
  points: number;
}

export function ReferralSection({ referralCode, points }: Props) {
  const [copied, setCopied] = useState(false);

  if (!referralCode) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(referralCode!);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <section aria-labelledby="referral-heading" className="space-y-3">
      <h2
        id="referral-heading"
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--brand-text)", opacity: 0.45 }}
      >
        <Gift size={13} />
        Tu código de referido
      </h2>

      <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
        {/* Código */}
        <div className="flex items-center justify-between gap-4 p-5">
          <div>
            <p className="text-2xl font-black tracking-widest" style={{ color: "var(--brand-primary)" }}>
              {referralCode}
            </p>
            <p className="mt-1 text-xs" style={{ color: "var(--brand-text)", opacity: 0.5 }}>
              Comparte este código y gana <strong>50 puntos</strong> por cada cliente que agende contigo.
            </p>
          </div>
          <button
            onClick={handleCopy}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-border)] transition-all hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
            style={{ color: "var(--brand-text)" }}
            title="Copiar código"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-[var(--brand-border)] border-t border-[var(--brand-border)]">
          <div className="p-4 text-center">
            <p className="text-xl font-black" style={{ color: "var(--brand-text)" }}>0</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40" style={{ color: "var(--brand-text)" }}>
              Referidos
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-xl font-black" style={{ color: "var(--brand-primary)" }}>{points}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-40" style={{ color: "var(--brand-text)" }}>
              Puntos acumulados
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
