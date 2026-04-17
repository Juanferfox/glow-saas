"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  Home,
  CalendarDays,
  ShoppingBag,
  Star,
  User,
  Sun,
  LayoutDashboard,
  Users,
  Package,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTenant } from "@/components/tenant/TenantProvider";
import { useFeature } from "@/components/tenant/FeatureGuard";

/**
 * Sidebar de navegación lateral para desktop (visible en lg+).
 * Muestra la navegación del cliente y, si el usuario tiene rol admin,
 * una sección adicional de administración.
 */
export function Sidebar() {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tenant = useTenant();
  const hasSolar = useFeature("feature_solar");
  const hasStore = useFeature("feature_store");

  type NavItem = {
    href: string;
    icon: typeof Home;
    label: string;
    id: string;
  };

  const clientNav: NavItem[] = [
    { href: `/${locale}`, icon: Home, label: t("home"), id: "sidebar-home" },
    {
      href: `/${locale}/agendar`,
      icon: CalendarDays,
      label: t("appointments"),
      id: "sidebar-appointments",
    },
    ...(hasStore
      ? [
          {
            href: `/${locale}/tienda`,
            icon: ShoppingBag,
            label: t("store"),
            id: "sidebar-store",
          },
        ]
      : []),
    ...(hasSolar
      ? [
          {
            href: `/${locale}/bronceo`,
            icon: Sun,
            label: t("solar"),
            id: "sidebar-solar",
          },
        ]
      : []),
    {
      href: `/${locale}/puntos`,
      icon: Star,
      label: t("points"),
      id: "sidebar-points",
    },
    {
      href: `/${locale}/perfil`,
      icon: User,
      label: t("profile"),
      id: "sidebar-profile",
    },
  ];

  const adminNav: NavItem[] = [
    {
      href: `/${locale}/admin`,
      icon: BarChart3,
      label: "Dashboard",
      id: "sidebar-admin-dashboard",
    },
    {
      href: `/${locale}/admin/agenda`,
      icon: CalendarDays,
      label: t("appointments"),
      id: "sidebar-admin-agenda",
    },
    {
      href: `/${locale}/admin/clientes`,
      icon: Users,
      label: "Clientes",
      id: "sidebar-admin-clients",
    },
    {
      href: `/${locale}/admin/inventario`,
      icon: Package,
      label: "Inventario",
      id: "sidebar-admin-inventory",
    },
    {
      href: `/${locale}/admin/ventas`,
      icon: BarChart3,
      label: "Ventas",
      id: "sidebar-admin-sales",
    },
    {
      href: `/${locale}/admin/configuracion`,
      icon: Settings,
      label: "Configuración",
      id: "sidebar-admin-config",
    },
  ];

  function NavLink({ href, icon: Icon, label, id }: NavItem) {
    const isActive =
      href === `/${locale}` ? pathname === href : pathname.startsWith(href);

    return (
      <Link
        id={id}
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)]",
          isActive
            ? "bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]"
            : "text-[var(--brand-text)] opacity-60 hover:bg-[var(--brand-surface)] hover:opacity-100"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <aside
      className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0"
      role="navigation"
      aria-label="Navegación lateral"
    >
      <div className="sticky top-14 flex flex-col gap-1 overflow-y-auto px-3 py-4">
        {/* Nombre del tenant en sidebar */}
        {tenant && (
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-[var(--brand-text)] opacity-30">
            {tenant.name}
          </p>
        )}

        {/* Nav cliente */}
        {clientNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}

        {/* Separador + nav admin (solo si tiene el rol, por ahora siempre visible en dev) */}
        <div className="my-2 border-t border-[var(--brand-border)]" />
        <p className="px-3 text-xs font-semibold uppercase tracking-widest text-[var(--brand-text)] opacity-30">
          Admin
        </p>
        {adminNav.map((item) => (
          <NavLink key={item.href} {...item} />
        ))}
      </div>
    </aside>
  );
}
