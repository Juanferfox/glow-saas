import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getMyNotifications } from "@/lib/data/notifications";
import { Bell, Search, History, Send } from "lucide-react";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Panel administrativo de Notificaciones.
 * Permite ver el historial de notificaciones enviadas y (en el futuro) enviar masivas.
 */
export default async function AdminNotificacionesPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar tenant
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar historial (aquí cargaríamos globales del tenant)
  const logs = await getMyNotifications(tenant.id); // Usando mock por ahora

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell size={20} className="text-[var(--brand-primary)]" />
          <h2 className="text-xl font-bold" style={{ color: "var(--brand-text)" }}>Gestión de Notificaciones</h2>
        </div>
        <button
          className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-xs font-bold text-white transition-transform hover:scale-105 active:scale-95"
        >
          <Send size={14} />
          Nueva Notificación
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Enviadas hoy</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--brand-text)" }}>128</p>
        </div>
        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Tasa de Apertura</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--brand-text)" }}>84%</p>
        </div>
        <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6">
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Push Activas</p>
          <p className="mt-1 text-2xl font-black" style={{ color: "var(--brand-text)" }}>450</p>
        </div>
      </div>

      {/* Logs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <History size={16} className="opacity-40" />
          <h3 className="text-xs font-bold uppercase tracking-widest opacity-40">Logs de envíos recientes</h3>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-500/5 text-[10px] font-bold uppercase tracking-wider opacity-40">
              <tr>
                <th className="px-6 py-4">Usuario</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4">Asunto</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--brand-border)]">
              {logs.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-zinc-500/5">
                  <td className="px-6 py-4 font-medium" style={{ color: "var(--brand-text)" }}>Usuario Demo</td>
                  <td className="px-6 py-4">
                     <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-bold uppercase opacity-60">
                      {log.type}
                     </span>
                  </td>
                  <td className="px-6 py-4 opacity-70">{log.title[locale] || log.title["es"]}</td>
                  <td className="px-6 py-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500">
                      <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Enviado
                    </span>
                  </td>
                  <td className="px-6 py-4 tabular-nums opacity-40">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
