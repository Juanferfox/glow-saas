import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Users } from "lucide-react";
import { getTenant } from "@/lib/tenant";
import { getTenantUsers } from "@/lib/data/users";
import { UserManagement } from "@/components/admin/UserManagement";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function UsuariosPage({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  const headersList = await headers();
  const tenantSlug  = headersList.get("x-tenant-slug");
  const tenant      = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  const users = await getTenantUsers(tenant.id);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-start gap-3">
        <Users size={22} style={{ color: "var(--brand-primary)" }} />
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
          >
            {t("usersTitle")}
          </h2>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            {t("usersDesc")}
          </p>
        </div>
      </div>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: t("roleAdmin"),        count: users.filter((u) => u.role === "admin").length,        color: "text-amber-600" },
          { label: t("roleWorker"),       count: users.filter((u) => u.role === "trabajadora").length,  color: "text-violet-600" },
          { label: t("roleReceptionist"), count: users.filter((u) => u.role === "recepcionista").length, color: "text-blue-600" },
          { label: t("roleClient"),       count: users.filter((u) => u.role === "cliente").length,      color: "text-slate-500" },
        ].map(({ label, count, color }) => (
          <div
            key={label}
            className="rounded-xl border border-[var(--brand-border)] p-3 text-center"
            style={{ backgroundColor: "var(--brand-surface)" }}
          >
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs opacity-50 mt-0.5" style={{ color: "var(--brand-text)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {/* Gestión de usuarios */}
      <UserManagement users={users} locale={locale} />
    </div>
  );
}
