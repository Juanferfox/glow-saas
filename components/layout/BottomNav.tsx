"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  CalendarDays,
  Calendar,
  ShoppingBag,
  Star,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useFeature } from "@/components/tenant/FeatureGuard";

interface NavItem {
  key: string;
  href: string;
  icon: typeof Home;
  labelKey: string;
}

/**
 * Navegación inferior para móvil (visible en pantallas < lg).
 * Muestra exactamente 5 items o 4 si algún módulo está desactivado.
 */
export function BottomNav() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const hasStore = useFeature("feature_store");

  const navItems: NavItem[] = [
    {
      key: "home",
      href: `/${locale}`,
      icon: Home,
      labelKey: "home",
    },
    {
      key: "appointments",
      href: `/${locale}/agendar`,
      icon: CalendarDays,
      labelKey: "appointments",
    },
    {
      key: "calendar",
      href: `/${locale}/calendario`,
      icon: Calendar,
      labelKey: "calendar",
    },
    ...(hasStore
      ? [
          {
            key: "store",
            href: `/${locale}/tienda`,
            icon: ShoppingBag,
            labelKey: "store",
          },
        ]
      : []),
    {
      key: "points",
      href: `/${locale}/puntos`,
      icon: Star,
      labelKey: "points",
    },
    {
      key: "profile",
      href: `/${locale}/perfil`,
      icon: User,
      labelKey: "profile",
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      role="navigation"
      aria-label="Navegación principal"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="border-t border-[var(--brand-border)] bg-[var(--brand-bg)]/95 backdrop-blur-md">
        <ul className="mx-auto flex max-w-lg items-center justify-around px-2 py-1">
          {navItems.map(({ key, href, icon: Icon, labelKey }) => {
            const isActive =
              href === `/${locale}`
                ? pathname === href
                : pathname.startsWith(href);

            return (
              <li key={key} className="flex-1">
                <Link
                  id={`bottom-nav-${key}`}
                  href={href}
                  className={cn(
                    "flex min-h-[44px] flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5",
                    "transition-all duration-200",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
                    isActive
                      ? "text-[var(--brand-primary)]"
                      : "text-[var(--brand-text)] opacity-40 hover:opacity-70"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className={cn(
                      "transition-transform duration-200",
                      isActive && "scale-110"
                    )}
                  />
                  <span className="text-[10px] font-medium leading-none">
                    {t(labelKey as Parameters<typeof t>[0])}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
