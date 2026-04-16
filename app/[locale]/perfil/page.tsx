import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import { User, Palette, Shield } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSelector } from "@/components/i18n/LocaleSelector";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NotificationsRow } from "@/components/profile/NotificationsRow";
import { getMyAppointments } from "@/lib/data/appointments";
import { UpcomingAppointments } from "@/components/profile/UpcomingAppointments";
import { Calendar } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Página de perfil del usuario autenticado.
 * Muestra: nombre, avatar, idioma activo, selector de tema y toggle de notificaciones.
 * Redirige al login si no hay sesión.
 */
export default async function PerfilPage({ params }: PageProps) {
  const { locale } = await params;

  // Verificar sesión
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login?next=/${locale}/perfil`);
  }

  // Cargar tenant para branding
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  // Datos del usuario
  const displayName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Usuario";
  const avatarUrl: string | null =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
  const email = user.email ?? "";
  const provider = user.app_metadata?.provider ?? "email";
  const availableLocales = tenant?.active_locales ?? [locale];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      {/* Encabezado */}
      <div>
        <p
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--brand-primary)" }}
        >
          Mi cuenta
        </p>
        <h1
          className="mt-1 text-2xl font-bold"
          style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}
        >
          Perfil
        </h1>
      </div>

      {/* Tarjeta de usuario */}
      <section
        aria-label="Información del usuario"
        className="flex items-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        {/* Avatar */}
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{
            backgroundColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)",
          }}
        >
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="64px"
              referrerPolicy="no-referrer"
            />
          ) : (
            <User
              size={28}
              style={{ color: "var(--brand-primary)" }}
              strokeWidth={1.5}
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p
            className="truncate text-base font-semibold"
            style={{ color: "var(--brand-text)" }}
          >
            {displayName}
          </p>
          <p
            className="truncate text-sm"
            style={{ color: "var(--brand-text)", opacity: 0.55 }}
          >
            {email}
          </p>
          <span
            className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            style={{
              backgroundColor: "color-mix(in srgb, var(--brand-primary) 15%, transparent)",
              color: "var(--brand-primary)",
            }}
          >
            {provider}
          </span>
        </div>
      </section>

      {/* Preferencias */}
      <section aria-labelledby="prefs-heading" className="space-y-3">
        <h2
          id="prefs-heading"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--brand-text)", opacity: 0.45 }}
        >
          <Palette size={13} />
          Preferencias
        </h2>

        {/* Tema */}
        <div className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
              Tema
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--brand-text)", opacity: 0.5 }}
            >
              Apariencia de la aplicación
            </p>
          </div>
          <ThemeToggle />
        </div>

        {/* Idioma */}
        {availableLocales.length > 1 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                Idioma
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--brand-text)", opacity: 0.5 }}
              >
                Idioma de la interfaz
              </p>
            </div>
            <LocaleSelector
              currentLocale={locale}
              availableLocales={availableLocales}
              className="w-36 shrink-0"
            />
          </div>
        )}

        {/* Notificaciones */}
        <NotificationsRow />
      </section>

      {/* Citas */}
      <section aria-labelledby="appointments-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2
            id="appointments-heading"
            className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
            style={{ color: "var(--brand-text)", opacity: 0.45 }}
          >
            <Calendar size={13} />
            Próximas citas
          </h2>
          <a
            href={`/${locale}/agendar`}
            className="text-[10px] font-bold uppercase tracking-wider underline-offset-4 hover:underline"
            style={{ color: "var(--brand-primary)" }}
          >
            Agendar nueva
          </a>
        </div>

        {tenant && (
          <UpcomingAppointments
            appointments={await getMyAppointments(tenant.id)}
            tenant={tenant}
            locale={locale}
          />
        )}
      </section>


      {/* Seguridad */}
      <section aria-labelledby="security-heading" className="space-y-3">
        <h2
          id="security-heading"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          style={{ color: "var(--brand-text)", opacity: 0.45 }}
        >
          <Shield size={13} />
          Seguridad
        </h2>

        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>
                Sesión activa
              </p>
              <p
                className="text-xs"
                style={{ color: "var(--brand-text)", opacity: 0.5 }}
              >
                Conectado vía {provider}
              </p>
            </div>
            <SignOutButton locale={locale} />
          </div>
        </div>
      </section>
    </div>
  );
}
