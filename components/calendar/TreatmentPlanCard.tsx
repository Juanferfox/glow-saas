import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TreatmentPlan, TreatmentSession, TreatmentSessionStatus } from "@/lib/supabase/types";

interface TreatmentPlanCardProps {
  plan: TreatmentPlan;
  sessions: TreatmentSession[];
  locale?: string;
}

const SESSION_ICONS: Record<TreatmentSessionStatus, typeof CheckCircle2> = {
  completed: CheckCircle2,
  scheduled: Clock,
  skipped:   AlertCircle,
  missed:    AlertCircle,
};

const SESSION_COLORS: Record<TreatmentSessionStatus, string> = {
  completed: "text-emerald-500",
  scheduled: "text-amber-500",
  skipped:   "text-slate-400",
  missed:    "text-red-400",
};

export function TreatmentPlanCard({ plan, sessions, locale = "es" }: TreatmentPlanCardProps) {
  const isES = locale === "es";
  const name = plan.name[locale] ?? plan.name.es ?? plan.name.en ?? "Plan";
  const progress = (plan.completed_sessions / plan.total_sessions) * 100;

  const expiresAt = plan.expires_at ? new Date(plan.expires_at) : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)
    : null;

  return (
    <div
      className="rounded-xl border border-[var(--brand-border)] p-4 space-y-3"
      style={{ backgroundColor: "var(--brand-surface)" }}
    >
      {/* Encabezado */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold leading-tight" style={{ color: "var(--brand-text)" }}>
            {name}
          </h3>
          <p className="text-xs opacity-50 mt-0.5" style={{ color: "var(--brand-text)" }}>
            {plan.completed_sessions}/{plan.total_sessions} {isES ? "sesiones completadas" : "sessions completed"}
          </p>
        </div>
        {daysLeft !== null && (
          <span
            className={cn(
              "flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold",
              daysLeft > 30
                ? "bg-emerald-500/10 text-emerald-600"
                : daysLeft > 7
                ? "bg-amber-500/10 text-amber-600"
                : "bg-red-500/10 text-red-500"
            )}
          >
            {daysLeft > 0
              ? `${daysLeft} ${isES ? "días" : "days"}`
              : isES ? "Vencido" : "Expired"}
          </span>
        )}
      </div>

      {/* Barra de progreso */}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--brand-border)" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progress}%`, backgroundColor: "var(--brand-primary)" }}
        />
      </div>

      {/* Sesiones individuales */}
      {sessions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sessions.map((s) => {
            const Icon = SESSION_ICONS[s.status] ?? Circle;
            const color = SESSION_COLORS[s.status] ?? "text-slate-400";
            return (
              <div
                key={s.id}
                className="flex flex-col items-center gap-0.5"
                title={s.scheduled_at
                  ? new Date(s.scheduled_at).toLocaleDateString(locale)
                  : s.status}
              >
                <Icon size={18} className={color} />
                <span className="text-[9px] opacity-50" style={{ color: "var(--brand-text)" }}>
                  {s.session_number}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota */}
      {plan.notes && (
        <p className="text-xs italic opacity-50" style={{ color: "var(--brand-text)" }}>
          {plan.notes}
        </p>
      )}
    </div>
  );
}
