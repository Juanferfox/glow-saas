import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { Settings, Palette, Globe, CreditCard, Save, Image as ImageIcon } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Página de Configuración del Tenant (Admin).
 * Permite cambiar colores, logos e idiomas.
 */
export default async function AdminConfigPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar contexto
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={20} className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Configuración de Empresa</h2>
        </div>
        <button className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-6 py-2.5 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95">
          <Save size={14} />
          Guardar cambios
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Navegación lateral de Ajustes */}
        <div className="space-y-1">
          <button className="flex w-full items-center gap-3 rounded-xl bg-[var(--brand-primary)]/10 px-4 py-3 text-xs font-bold text-[var(--brand-primary)]">
            <Palette size={16} />
            Identidad Visual
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold opacity-40 hover:bg-zinc-500/5 transition-colors">
            <Globe size={16} />
            Idiomas y Región
          </button>
          <button className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold opacity-40 hover:bg-zinc-500/5 transition-colors">
            <CreditCard size={16} />
            Plan y Facturación
          </button>
        </div>

        {/* Formulario de Configuración */}
        <div className="lg:col-span-2 space-y-6">
          {/* Identidad de Marca */}
          <section className="rounded-[2.5rem] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 space-y-8">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Identidad de Marca</h3>
              <p className="text-xs opacity-50">Personaliza cómo ven tus clientes tu SPA.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Nombre del Negocio</label>
                <input 
                  type="text" 
                  defaultValue={tenant.name}
                  className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Color Primario (MARCA)</label>
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 shrink-0 rounded-xl border border-white/20 shadow-inner"
                    style={{ backgroundColor: tenant.brand_color_primary }}
                  />
                  <input
                    type="text"
                    defaultValue={tenant.brand_color_primary}
                    className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Logo de la Empresa</label>
               <div className="group relative flex aspect-video w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-[2rem] border-2 border-dashed border-[var(--brand-border)] bg-zinc-500/5 transition-colors hover:bg-zinc-500/10">
                  {tenant.logo_url ? (
                    <img src={tenant.logo_url} alt="Logo preview" className="h-16 w-auto object-contain" />
                  ) : (
                    <ImageIcon size={32} className="opacity-20" />
                  )}
                  <p className="text-[10px] font-bold opacity-30 group-hover:opacity-100 transition-opacity">Haz clic para subir o arrastra un archivo</p>
                  <input type="file" className="absolute inset-0 cursor-pointer opacity-0" />
               </div>
            </div>
          </section>

          {/* Regional Settings */}
          <section className="rounded-[2.5rem] border border-[var(--brand-border)] bg-[var(--brand-surface)] p-8 space-y-6">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-widest opacity-30">Regional y Moneda</h3>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Moneda Activa</label>
                <select defaultValue={tenant.currency} className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20">
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-40">Idioma por Defecto</label>
                <select defaultValue={tenant.default_locale} className="w-full rounded-2xl border border-[var(--brand-border)] bg-zinc-500/5 px-4 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]/20">
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
