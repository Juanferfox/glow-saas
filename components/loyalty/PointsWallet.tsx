"use client";

import { Star, ArrowUpRight, ArrowDownLeft, Clock, Zap, Gift } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PointsMovement } from "@/lib/data/loyalty";
import type { Tenant } from "@/lib/supabase/types";

interface PointsWalletProps {
  balance: number;
  history: PointsMovement[];
  tenant: Tenant;
  locale: string;
}

export function PointsWallet({ balance, history, tenant, locale }: PointsWalletProps) {
  const nextRewardAt = 1000;
  const progress = Math.min((balance / nextRewardAt) * 100, 100);

  return (
    <div className="space-y-6">
      {/* Card de Balance */}
      <div
        className="relative overflow-hidden rounded-[2.5rem] bg-[var(--brand-primary)] p-8 text-white shadow-2xl"
      >
        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">Saldo actual</span>
            <div className="rounded-full bg-white/20 p-2">
              <Zap size={20} className="fill-white" />
            </div>
          </div>
          
          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black tracking-tighter">{balance}</span>
            <span className="text-xl font-bold opacity-80">puntos</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="opacity-70">Próximo beneficio: {nextRewardAt} pts</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full bg-white transition-all duration-1000"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Círculos decorativos */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-black/10 blur-3xl" />
      </div>

      {/* Grid de Acciones/Beneficios */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <BenefitCard
          icon={<Gift className="text-orange-500" />}
          title="Servicio Gratis"
          desc="Canjea 800 puntos por una sesión de hidratación"
          cost={800}
          available={balance >= 800}
        />
        <BenefitCard
          icon={<Star className="text-yellow-500" />}
          title="Descuento 20%"
          desc="Ahorra en cualquier compra de productos"
          cost={300}
          available={balance >= 300}
        />
      </div>

      {/* Historial */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Clock size={16} className="opacity-40" />
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Historial reciente</h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[var(--brand-border)] p-12 text-center">
              <p className="text-sm opacity-40 italic">Aún no tienes movimientos de puntos.</p>
            </div>
          ) : (
            history.map((move) => (
              <div
                key={move.id}
                className="flex items-center justify-between rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4 transition-transform active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-2xl p-3",
                    move.type === "ganados" ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                  )}>
                    {move.type === "ganados" ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>
                      {move.reason[locale] || move.reason["es"] || "Movimiento"}
                    </p>
                    <p className="text-[10px] opacity-40">
                      {new Date(move.created_at).toLocaleDateString(locale, { day: "numeric", month: "long" })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-lg font-black tracking-tighter",
                    move.type === "ganados" ? "text-green-500" : "text-red-500"
                  )}>
                    {move.type === "ganados" ? "+" : "-"}{move.amount}
                  </p>
                  <p className="text-[9px] font-bold uppercase opacity-30">PTS</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
  cost,
  available,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cost: number;
  available: boolean;
}) {
  return (
    <div
      className={cn(
        "group relative flex flex-col gap-3 rounded-[2rem] border p-6 transition-all",
        available
          ? "border-[var(--brand-border)] bg-[var(--brand-surface)] hover:border-[var(--brand-primary)]/50 hover:shadow-xl"
          : "border-zinc-500/10 bg-zinc-500/5 opacity-60"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="rounded-2xl bg-zinc-500/5 p-3">{icon}</div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
          {cost} pts
        </span>
      </div>
      <div>
        <h4 className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>{title}</h4>
        <p className="mt-1 text-[11px] leading-relaxed opacity-50" style={{ color: "var(--brand-text)" }}>
          {desc}
        </p>
      </div>
      <button
        disabled={!available}
        className={cn(
          "mt-2 rounded-2xl py-2.5 text-[10px] font-bold uppercase tracking-widest transition-all",
          available
            ? "bg-[var(--brand-primary)] text-white shadow-lg active:scale-95"
            : "bg-zinc-500/10 text-[var(--brand-text)] opacity-40 cursor-not-allowed"
        )}
      >
        Canjear ahora
      </button>
    </div>
  );
}
