import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { NotificationBell } from "@/components/profile/NotificationBell";
import { getMyNotifications } from "@/lib/data/notifications";
import { LOGO_REGISTRY } from "@/components/layout/logo-registry";
import type { Tenant } from "@/lib/supabase/types";

interface TopBarProps {
  tenant: Tenant | null;
}

/**
 * Barra superior de navegación.
 * - Logo del tenant (o nombre como texto si no hay logo)
 * - Selector de idioma (si hay más de 1 idioma)
 * - Toggle dark/light/system
 * - Botón de login (cuando no hay sesión)
 *
 * Server Component — los hijos interactivos (ThemeToggle, LanguageSwitcher) son Client Components.
 */
export async function TopBar({ tenant }: TopBarProps) {
  const locale = await getLocale();
  const notifications = tenant ? await getMyNotifications(tenant.id) : [];
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-[var(--brand-border)] bg-[var(--brand-bg)]/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Nombre del tenant */}
        <Link
          href={`/${locale}`}
          id="topbar-logo"
          className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] rounded-md"
        >
          {tenant?.slug && LOGO_REGISTRY[tenant.slug] ? (
            LOGO_REGISTRY[tenant.slug]({ size: 40 })
          ) : tenant?.logo_url ? (
            <Image
              src={tenant.logo_url}
              alt={tenant.name || "Logo"}
              width={120}
              height={32}
              className="h-8 w-auto object-contain"
              priority
            />
          ) : (
            <span
              className="font-heading text-lg font-semibold tracking-tight text-[var(--brand-text)]"
              style={{ fontFamily: "var(--font-heading)" }}
            >
              {tenant?.name ?? "SPA"}
            </span>
          )}
        </Link>

        {/* Controles derechos */}
        <div className="flex items-center gap-2">
          <NotificationBell locale={locale} unreadCount={unreadCount} />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
