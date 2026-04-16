import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getServices } from "@/lib/data/services";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesGrid } from "@/components/home/ServicesGrid";
import { LoyaltyBanner } from "@/components/home/LoyaltyBanner";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const { locale } = await params;

  // Cargar tenant y datos
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  const services = tenant ? await getServices(tenant.id) : [];

  // Sin tenant (acceso directo sin subdominio)
  if (!tenant) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] px-6 py-16 text-center">
        <p className="text-4xl">💆‍♀️</p>
        <h1
          className="text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          spa-saas
        </h1>
        <p className="text-sm" style={{ color: "var(--brand-text)", opacity: 0.5 }}>
          Accede mediante el subdominio de tu spa para ver el contenido personalizado.
        </p>
        <code
          className="rounded-lg px-3 py-1.5 text-xs"
          style={{
            backgroundColor: "color-mix(in srgb, var(--brand-primary) 12%, transparent)",
            color: "var(--brand-primary)",
          }}
        >
          spa-luna.localhost:3000/es
        </code>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-10">
      {/* Hero — headline + CTA del tenant */}
      <HeroSection tenant={tenant} locale={locale} />

      {/* Servicios destacados */}
      {services.length > 0 && (
        <ServicesGrid tenant={tenant} locale={locale} services={services} />
      )}

      {/* Banner de fidelización */}
      <LoyaltyBanner tenant={tenant} locale={locale} />
    </div>
  );
}
