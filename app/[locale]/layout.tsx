import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { routing } from "@/i18n/routing";
import { getTenant } from "@/lib/tenant";
import { generateCSSBlock } from "@/lib/theme";
import { TenantProvider } from "@/components/tenant/TenantProvider";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "@/components/layout/Sidebar";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { LocaleAttributesSetter } from "@/components/layout/LocaleAttributesSetter";

// ── Metadata dinámica por tenant ──────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  return {
    title: {
      template: `%s | ${tenant?.name ?? "SPA"}`,
      default: tenant?.name ?? "SPA",
    },
    description: tenant
      ? `${tenant.name} — Reserva tus citas y servicios en línea`
      : "Plataforma de gestión para spas y salones de belleza",
    ...(tenant && {
      manifest: `/api/manifest/${tenant.slug}`,
      themeColor: tenant.brand_color_primary,
      appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: tenant.name,
      },
      icons: {
        icon: tenant.logo_url ?? `/tenants/${tenant.slug}/icon-192.png`,
        apple: tenant.logo_url ?? `/tenants/${tenant.slug}/icon-192.png`,
      },
      openGraph: {
        siteName: tenant.name,
        locale,
        type: "website",
      },
    }),
  };
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  // ── 1. Validar locale ────────────────────────────────────────────────────
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    notFound();
  }

  // ── 2. Cargar tenant desde el header inyectado por proxy.ts ─────────────
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  // ── 3. Mensajes i18n ─────────────────────────────────────────────────────
  const messages = await getMessages();

  // ── 4. CSS vars del tenant ────────────────────────────────────────────────
  const tenantCSS = tenant ? generateCSSBlock(tenant) : "";
  const fontBody = tenant?.brand_font_body ?? "system-ui, sans-serif";

  return (
    <>
      {/*
       * React 19 hoistea <style> automáticamente al <head> del documento.
       * Esto inyecta los tokens de color del tenant antes del primer paint.
       */}
      {tenantCSS && (
        <style
          id="tenant-theme"
          // precedence="high" le dice a React en qué orden insertar el estilo
          precedence="high"
          dangerouslySetInnerHTML={{ __html: tenantCSS }}
        />
      )}

      {/* Aplica lang y font-body al <html>/<body> raíz vía effect cliente */}
      <LocaleAttributesSetter locale={locale} fontBody={fontBody} />

      <NextIntlClientProvider locale={locale} messages={messages}>
        <TenantProvider tenant={tenant}>
          {/* Estructura visual: ocupa toda la pantalla con brand colors */}
          <div className="min-h-screen flex flex-col bg-[var(--brand-bg)] text-[var(--brand-text)] antialiased">

            {/* TopBar sticky */}
            <TopBar tenant={tenant} />

            {/* Layout principal: sidebar (lg+) + contenido */}
            <div className="mx-auto flex w-full max-w-6xl flex-1 gap-0 px-0 lg:gap-6 lg:px-6 lg:py-6">
              <Sidebar />
              <main
                id="main-content"
                className="flex-1 min-w-0 px-4 pb-24 pt-4 lg:px-0 lg:pb-0 lg:pt-0"
              >
                {children}
              </main>
            </div>

            {/* Bottom nav solo en móvil */}
            <BottomNav />

            {/* Banner de instalación PWA */}
            <InstallPrompt />

          </div>
        </TenantProvider>
      </NextIntlClientProvider>
    </>
  );
}
