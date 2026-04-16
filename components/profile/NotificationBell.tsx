"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  unreadCount?: number;
  locale: string;
}

/**
 * Icono de campana con badge de notificaciones no leídas.
 * Redirige a la sección de notificaciones en el perfil.
 */
export function NotificationBell({ unreadCount = 0, locale }: NotificationBellProps) {
  return (
    <Link
      href={`/${locale}/perfil#notificaciones`}
      className="relative rounded-full p-2 text-[var(--brand-text)] hover:bg-zinc-500/10 transition-colors"
      aria-label="Ver notificaciones"
    >
      <Bell size={20} className={cn(unreadCount > 0 && "animate-tada")} />
      
      {unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] text-[9px] font-bold text-white ring-2 ring-[var(--brand-bg)]">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
