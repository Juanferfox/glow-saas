import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { getSalesHistory } from "@/lib/data/inventory";
import { getMyAppointments } from "@/lib/data/appointments";
import { getSpecialists, getSchedules } from "@/lib/data/specialists";
import { DashboardActions } from "@/components/admin/DashboardActions";
import { GananciasOverview } from "@/components/admin/GananciasOverview";
import {
  Users,
  Calendar,
  Package,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  TrendingUp,
} from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";

interface PageProps {
  params: Promise<{ locale: string }>;
}

/**
 * Dashboard Central Administrativo.
 * Punto de entrada principal para el staff y dueños.
 */
export default async function AdminDashboardPage({ params }: PageProps) {
  const { locale } = await params;

  // 1. Cargar contexto
  const headersList = await headers();
  const tenantSlug = headersList.get("x-tenant-slug");
  const tenant = tenantSlug ? await getTenant(tenantSlug) : null;
  if (!tenant) return null;

  // 2. Cargar datos para métricas (Mock/Real dependiente de backend)
  const sales = await getSalesHistory(tenant.id);
  const appointments = await getMyAppointments(tenant.id);
  const specialists = await getSpecialists(tenant.id);
  const schedules = await getSchedules(tenant.id);

  // Ocupación de especialistas esta semana
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const weekAppointments = appointments.filter((a) => {
    const d = new Date(a.scheduled_at);
    return d >= monday && a.status !== "cancelled";
  });

  let totalSlotsWeek = 0;
  for (const sp of specialists) {
    for (const sched of schedules) {
      if (sched.specialist_id !== sp.id || !sched.is_working) continue;
      const [sh, sm] = sched.start_time.split(":").map(Number);
      const [eh, em] = sched.end_time.split(":").map(Number);
      totalSlotsWeek += ((eh ?? 18) - (sh ?? 9)) * (60 / 30) + ((em ?? 0) - (sm ?? 0)) / 30;
    }
  }
  const ocupacion = totalSlotsWeek > 0
    ? Math.round((weekAppointments.length / totalSlotsWeek) * 100)
    : 0;

  // Cálculos rápidos
  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const todayAppointments = appointments.filter((a) =>
    new Date(a.scheduled_at).toDateString() === new Date().toDateString()
  );
  
  const stats = [
    { 
      label: "Ingresos Totales", 
      value: formatCurrency(totalRevenue, locale, tenant.currency), 
      trend: "+12.5%", 
      isUp: true,
      icon: <DollarSign className="text-emerald-500" size={20} /> 
    },
    { 
      label: "Citas para Hoy", 
      value: todayAppointments.length.toString(), 
      trend: "+2", 
      isUp: true,
      icon: <Calendar className="text-blue-500" size={20} /> 
    },
    { 
      label: "Clientes Nuevos", 
      value: "42", 
      trend: "+5%", 
      isUp: true,
      icon: <Users className="text-purple-500" size={20} /> 
    },
    { 
      label: "Stock Crítico", 
      value: "3", 
      trend: "-1", 
      isUp: false,
      icon: <Package className="text-amber-500" size={20} /> 
    },
    { 
      label: "Ocupación Semanal", 
      value: `${ocupacion}%`, 
      trend: `${weekAppointments.length} citas`, 
      isUp: ocupacion > 50,
      icon: <TrendingUp className="text-violet-500" size={20} /> 
    },
  ];

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight" style={{ color: "var(--brand-text)" }}>
            Hola de nuevo, {tenant.name}
          </h2>
          <p className="text-sm opacity-50" style={{ color: "var(--brand-text)" }}>
            Aquí tienes el resumen de tu operación para hoy.
          </p>
        </div>
        
        <DashboardActions sales={sales} appointments={appointments} />
      </div>

      {/* Ganancias Overview */}
      <GananciasOverview />

      {/* Grid de Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat, i) => (
          <div 
            key={i}
            className="group relative overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)] p-6 transition-all hover:shadow-xl hover:shadow-[var(--brand-primary)]/5"
          >
            <div className="flex items-start justify-between">
              <div className="rounded-2xl bg-zinc-500/5 p-3 group-hover:bg-[var(--brand-primary)]/10 transition-colors">
                {stat.icon}
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-bold",
                stat.isUp ? "text-emerald-500" : "text-amber-500"
              )}>
                {stat.isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.trend}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest opacity-40">{stat.label}</p>
              <h3 className="mt-1 text-2xl font-black" style={{ color: "var(--brand-text)" }}>{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Próximas Citas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Próximas Citas</h3>
            <button className="text-[10px] font-bold text-[var(--brand-primary)] hover:underline uppercase tracking-wider">Ver agenda</button>
          </div>
          <div className="divide-y divide-[var(--brand-border)] overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
            {todayAppointments.length > 0 ? todayAppointments.slice(0, 5).map((app: any) => (
              <div key={app.id} className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-500/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)]">
                    <Clock size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>Cita de Servicio</p>
                    <p className="text-[10px] opacity-40">{new Date(app.scheduled_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[9px] font-bold text-emerald-600 uppercase">Confirmada</span>
              </div>
            )) : (
              <p className="p-8 text-center text-xs opacity-30 italic">No hay citas para hoy todavía.</p>
            )}
          </div>
        </div>

        {/* Ventas Recientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-widest opacity-40">Últimas Ventas</h3>
            <button className="text-[10px] font-bold text-[var(--brand-primary)] hover:underline uppercase tracking-wider">Historial completo</button>
          </div>
          <div className="divide-y divide-[var(--brand-border)] overflow-hidden rounded-3xl border border-[var(--brand-border)] bg-[var(--brand-surface)]">
            {sales.slice(0, 5).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between p-4 transition-colors hover:bg-zinc-500/5">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 group-hover:bg-zinc-200">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "var(--brand-text)" }}>{sale.client.full_name}</p>
                    <p className="text-[10px] opacity-40">{new Date(sale.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-sm font-black" style={{ color: "var(--brand-text)" }}>
                   {formatCurrency(sale.total, locale, tenant.currency)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
