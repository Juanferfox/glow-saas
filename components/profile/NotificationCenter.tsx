"use client";

import { useState } from "react";
import { Bell, BellOff, Check, Trash2, Calendar, Package, Megaphone, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTenantText } from "@/lib/theme";
import type { SystemNotification } from "@/lib/data/notifications";
import type { Tenant } from "@/lib/supabase/types";

interface NotificationCenterProps {
  notifications: SystemNotification[];
  tenant: Tenant;
  locale: string;
}

export function NotificationCenter({ notifications: initialNotifications, tenant, locale }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const unreadCount = notifications.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "appointment": return <Calendar size={14} />;
      case "inventory":   return <Package size={14} />;
      case "marketing":   return <Megaphone size={14} />;
      default:            return <Info size={14} />;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Notificaciones</h2>
        {unreadCount > 0 && (
          <span className="rounded-full bg-[var(--brand-primary)] px-3 py-1 text-[10px] font-bold text-white uppercase tracking-widest">
            {unreadCount} nuevas
          </span>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <BellOff size={32} className="mx-auto mb-2" />
            <p className="text-sm">No tienes notificaciones por el momento.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              className={cn(
                "group relative flex items-start gap-4 overflow-hidden rounded-3xl border p-4 transition-all",
                n.read 
                  ? "border-[var(--brand-border)] bg-[var(--brand-surface)] opacity-70" 
                  : "border-[var(--brand-primary)]/30 bg-[var(--brand-primary)]/5"
              )}
            >
              <div className={cn(
                "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-500/10",
                !n.read && "bg-[var(--brand-primary)] text-white shadow-lg shadow-[var(--brand-primary)]/20"
              )}>
                {getIcon(n.type)}
              </div>

              <div className="flex-1 space-y-1 pr-6">
                <p className="text-xs font-bold leading-tight" style={{ color: "var(--brand-text)" }}>
                  {getTenantText(n.title, locale, tenant.default_locale)}
                </p>
                <p className="text-[11px] leading-relaxed opacity-60" style={{ color: "var(--brand-text)" }}>
                  {getTenantText(n.content, locale, tenant.default_locale)}
                </p>
                <p className="pt-1 text-[9px] font-bold uppercase opacity-30">
                  {new Date(n.created_at).toLocaleDateString(locale, { day: "numeric", month: "long" })}
                </p>
              </div>

              {/* Botón rápido para marcar como leído */}
              {!n.read && (
                <button 
                  className="absolute right-4 top-4 rounded-full bg-[var(--brand-primary)]/10 p-1.5 text-[var(--brand-primary)] transition-transform hover:scale-110 active:scale-95"
                  title="Marcar como leído"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {notifications.length > 0 && (
        <button className="flex items-center justify-center gap-2 rounded-2xl py-4 text-[10px] font-bold uppercase tracking-[0.2em] opacity-30 hover:opacity-100 transition-opacity">
          <Trash2 size={12} />
          Limpiar historial
        </button>
      )}
    </div>
  );
}
