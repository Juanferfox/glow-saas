import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Layout de administración.
 * Verifica que el usuario tenga rol 'admin' o 'recepcionista' en el tenant actual.
 */
export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  const supabase = await createClient();

  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login?next=/${locale}/admin/agenda`);

  // 2. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) redirect(`/${locale}`);

  // 3. Verificar rol
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .eq("tenant_id", tenant.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "recepcionista")) {
    // Si no es admin, fuera (en modo dev podemos ser más flexibles)
    const isDevMode =
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");
      
    if (!isDevMode) redirect(`/${locale}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 border-b border-[var(--brand-border)] pb-4">
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          Panel de Control
        </h1>
        <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
          Gestiona las citas y clientes de {tenant.name}.
        </p>
      </div>
      {children}
    </div>
  );
}
