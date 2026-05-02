import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { LoginForm } from "@/components/auth/LoginForm";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}

/**
 * Página de login — redirige si ya hay sesión activa.
 * Muestra los botones de OAuth configurados.
 */
export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { error, next } = await searchParams;

  // Si ya hay sesión, ir al home preservando el tenant
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const headersList = await headers();
    const slug = headersList.get("x-tenant-slug");
    redirect(`/${locale}${slug ? `?tenant=${slug}` : ""}`);
  }

  // Cargar tenant para el branding de la página de login
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  return (
    <LoginForm
      locale={locale}
      tenant={tenant}
      errorCode={error}
      next={next}
    />
  );
}
