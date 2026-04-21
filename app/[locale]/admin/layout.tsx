import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import {
  CalendarDays, ShoppingBag, Star, Settings,
  Users, CalendarRange, LayoutDashboard,
  Bell, TrendingUp,
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Layout de administración.
 * - Verifica rol admin | recepcionista | trabajadora
 * - Trabajadora: solo puede ver /admin/calendario (su agenda)
 * - Recepcionista: agenda + citas + inventario
 * - Admin (dueña): todo, incluyendo /admin/usuarios y configuración
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;

  const isDevMode =
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) redirect(`/${locale}`);

  // Dev: role simulado = admin para probar todo
  const userRoleArr: ["admin" | "recepcionista" | "trabajadora"] = ["admin"];

  if (!isDevMode) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect(`/${locale}/auth/login?next=/${locale}/admin/agenda`);

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .eq("tenant_id", tenant.id)
      .single();

    const role = profile?.role;
    if (!role || (role !== "admin" && role !== "recepcionista" && role !== "trabajadora")) {
      redirect(`/${locale}`);
    }
    userRoleArr[0] = role as "admin" | "recepcionista" | "trabajadora";
  }

  const userRole = userRoleArr[0];

  // ── Menú según rol ───────────────────────────────────────────────────────
  type NavItem = { href: string; label: string; icon: typeof CalendarDays; adminOnly?: boolean; workerHidden?: boolean };
  const navItems: NavItem[] = [
    { href: `/${locale}/admin/agenda`,        label: "Agenda hoy",     icon: LayoutDashboard },
    { href: `/${locale}/admin/calendario`,    label: "Calendario",     icon: CalendarRange },
    { href: `/${locale}/admin/notificaciones`,label: "Notificaciones", icon: Bell,         workerHidden: true },
    { href: `/${locale}/admin/inventario`,    label: "Inventario",     icon: ShoppingBag,  workerHidden: true },
    { href: `/${locale}/admin/fidelizacion`,  label: "Fidelización",   icon: Star,         workerHidden: true },
    { href: `/${locale}/admin/ventas`,        label: "Ventas",         icon: TrendingUp,   workerHidden: true, adminOnly: false },
    { href: `/${locale}/admin/usuarios`,      label: "Usuarios",       icon: Users,        adminOnly: true },
    { href: `/${locale}/admin/configuracion`, label: "Configuración",  icon: Settings,     adminOnly: true },
  ];

  const visibleItems = navItems.filter((item) => {
    if (item.adminOnly && userRole !== "admin") return false;
    if (item.workerHidden && userRole === "trabajadora") return false;
    return true;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Encabezado */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
            >
              Panel de Control
            </h1>
            <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
              {tenant.name}
              {userRole === "trabajadora" && (
                <span className="ml-2 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-600">
                  Solo lectura
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Navegación interna del admin */}
        <nav className="mt-4 overflow-x-auto">
          <ul className="flex gap-1 pb-2">
            {visibleItems.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--brand-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  style={{ color: "var(--brand-text)" }}
                >
                  <Icon size={13} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Contenido */}
      <div className="border-t border-[var(--brand-border)] pt-6">
        {children}
      </div>
    </div>
  );
}
