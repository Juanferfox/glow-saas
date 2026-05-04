import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { LoginForm } from "@/components/auth/LoginForm";
import type { DevProfile } from "@/app/api/dev-auth/route";

interface PageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string; next?: string }>;
}

const IS_DEV =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

export default async function LoginPage({ params, searchParams }: PageProps) {
  const { locale } = await params;
  const { error, next } = await searchParams;

  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  // En dev mode: verificar si ya hay sesión activa
  if (IS_DEV) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = (cookies() as any).get?.("dev-session")?.value as string | undefined;
      if (raw && raw !== "1") {
        const devProfile = JSON.parse(decodeURIComponent(raw)) as DevProfile;
        if (devProfile?.id) {
          // Ya está autenticado — redirigir
          const dest = next ?? (devProfile.role === "admin"
            ? `/${locale}/admin${tenantSlug ? `?tenant=${tenantSlug}` : ""}`
            : `/${locale}${tenantSlug ? `?tenant=${tenantSlug}` : ""}`);
          redirect(dest);
        }
      }
    } catch {
      // Cookie inválida, mostrar login
    }
  } else {
    // Producción: verificar sesión Supabase
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      redirect(`/${locale}${tenantSlug ? `?tenant=${tenantSlug}` : ""}`);
    }
  }

  return (
    <LoginForm
      locale={locale}
      tenant={tenant}
      errorCode={error}
      next={next}
    />
  );
}
