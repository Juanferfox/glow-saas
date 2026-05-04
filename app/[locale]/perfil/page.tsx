import { redirect } from "next/navigation";
import { headers, cookies } from "next/headers";
import Image from "next/image";
import { User, Palette, Shield, Gift, Activity } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenant";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { LocaleSelector } from "@/components/i18n/LocaleSelector";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { NotificationsRow } from "@/components/profile/NotificationsRow";
import { getMyAppointments } from "@/lib/data/appointments";
import { getMyNotifications } from "@/lib/data/notifications";
import { UpcomingAppointments } from "@/components/profile/UpcomingAppointments";
import { NotificationCenter } from "@/components/profile/NotificationCenter";
import { ReferralSection } from "@/components/profile/ReferralSection";
import { EmpleadaStats } from "@/components/profile/EmpleadaStats";
import { Calendar, Bell } from "lucide-react";
import type { DevProfile } from "@/app/api/dev-auth/route";

interface PageProps {
  params: Promise<{ locale: string }>;
}

const IS_DEV =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("xxxx");

function readDevSession(): DevProfile | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = (cookies() as any).get?.("dev-session")?.value as string | undefined;
    if (!raw || raw === "1") return null;
    return JSON.parse(decodeURIComponent(raw)) as DevProfile;
  } catch {
    return null;
  }
}

export default async function PerfilPage({ params }: PageProps) {
  const { locale } = await params;
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;

  let displayName = "Usuario";
  let email = "";
  let avatarUrl: string | null = null;
  let provider = "dev";
  let devProfile: DevProfile | null = null;
  const availableLocales = tenant?.active_locales ?? [locale];

  if (IS_DEV) {
    devProfile = readDevSession();
    if (!devProfile) {
      const tenantParam = tenantSlug ? `&tenant=${tenantSlug}` : "";
      redirect(`/${locale}/auth/login?next=/${locale}/perfil${tenantParam}`);
    }
    displayName = devProfile.full_name;
    email = devProfile.email;
    provider = "dev";
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const tenantParam = tenantSlug ? `&tenant=${tenantSlug}` : "";
      redirect(`/${locale}/auth/login?next=/${locale}/perfil${tenantParam}`);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meta = user.user_metadata as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appMeta = user.app_metadata as any;
    displayName = meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "Usuario";
    avatarUrl = meta?.avatar_url ?? meta?.picture ?? null;
    email = user.email ?? "";
    provider = appMeta?.provider ?? "email";
  }

  const appointments = tenant ? await getMyAppointments(tenant.id) : [];
  const notifications = tenant ? await getMyNotifications(tenant.id) : [];

  return (
    <div className="mx-auto max-w-lg space-y-6 pb-10">
      {/* Encabezado */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--brand-primary)" }}>
          Mi cuenta
        </p>
        <h1 className="mt-1 text-2xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}>
          Perfil
        </h1>
      </div>

      {/* Tarjeta de usuario */}
      <section
        aria-label="Información del usuario"
        className="flex items-center gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-5"
      >
        <div
          className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full"
          style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary) 20%, transparent)" }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} fill className="object-cover" sizes="64px" referrerPolicy="no-referrer" />
          ) : (
            <User size={28} style={{ color: "var(--brand-primary)" }} strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold" style={{ color: "var(--brand-text)" }}>
            {displayName}
          </p>
          <p className="truncate text-sm" style={{ color: "var(--brand-text)", opacity: 0.55 }}>
            {email}
          </p>
          <span
            className="mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize"
            style={{ backgroundColor: "color-mix(in srgb, var(--brand-primary) 15%, transparent)", color: "var(--brand-primary)" }}
          >
            {devProfile?.role ?? provider}
          </span>
        </div>
      </section>

      {/* ── Sección de referido (solo clientes) ── */}
      {(devProfile?.role === "cliente" || (!IS_DEV)) && (
        <ReferralSection
          referralCode={devProfile?.referral_code ?? null}
          points={devProfile?.points ?? 0}
        />
      )}

      {/* ── Sección de actividad (solo empleadas) ── */}
      {devProfile?.role === "trabajadora" && (
        <EmpleadaStats />
      )}

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

        <div className="flex items-center justify-between rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>Tema</p>
            <p className="text-xs" style={{ color: "var(--brand-text)", opacity: 0.5 }}>Apariencia de la aplicación</p>
          </div>
          <ThemeToggle />
        </div>

        {availableLocales.length > 1 && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>Idioma</p>
              <p className="text-xs" style={{ color: "var(--brand-text)", opacity: 0.5 }}>Idioma de la interfaz</p>
            </div>
            <LocaleSelector currentLocale={locale} availableLocales={availableLocales} className="w-36 shrink-0" />
          </div>
        )}

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
          <a href={`/${locale}/agendar`} className="text-[10px] font-bold uppercase tracking-wider underline-offset-4 hover:underline" style={{ color: "var(--brand-primary)" }}>
            Agendar nueva
          </a>
        </div>
        {tenant && (
          <UpcomingAppointments appointments={appointments} tenant={tenant} locale={locale} />
        )}
      </section>

      {/* Notificaciones */}
      <section id="notificaciones" aria-labelledby="notifs-heading" className="scroll-mt-20 space-y-4">
        {tenant && (
          <NotificationCenter notifications={notifications} tenant={tenant} locale={locale} />
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
              <p className="text-sm font-medium" style={{ color: "var(--brand-text)" }}>Sesión activa</p>
              <p className="text-xs" style={{ color: "var(--brand-text)", opacity: 0.5 }}>
                {IS_DEV ? `Usuario: ${email}` : `Conectado vía ${provider}`}
              </p>
            </div>
            <SignOutButton locale={locale} tenantSlug={tenant?.slug ?? undefined} />
          </div>
        </div>
      </section>
    </div>
  );
}
