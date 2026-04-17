"use client";

import { Download, FileText, Share2 } from "lucide-react";
import { exportToCSV } from "@/lib/export";
import type { OrderWithDetails } from "@/lib/data/inventory";
import type { Appointment } from "@/lib/supabase/types";

interface ExportActionsProps {
  sales: OrderWithDetails[];
  appointments: Appointment[];
}

/**
 * Acciones del Dashboard (Client Component).
 * Maneja la lógica de exportación de reportes.
 */
export function DashboardActions({ sales, appointments }: ExportActionsProps) {
  
  const handleExportSales = () => {
    // Aplanar un poco los datos para el CSV
    const reportData = sales.map(s => ({
      ID: s.id,
      Fecha: new Date(s.created_at).toLocaleDateString(),
      Cliente: s.client.full_name,
      Total: s.total,
      Estado: s.status,
      Items: s.items.length
    }));
    exportToCSV(reportData, "reporte_ventas");
  };

  const handleExportAppointments = () => {
    const reportData = appointments.map(a => ({
      ID: a.id,
      Fecha: new Date(a.scheduled_at).toLocaleDateString(),
      Hora: new Date(a.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      Especialista: a.specialist_id, 
      Estado: a.status
    }));
    exportToCSV(reportData, "reporte_citas");
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button 
        onClick={handleExportSales}
        className="flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-zinc-500/5 active:scale-95"
      >
        <FileText size={14} className="text-blue-500" />
        Ventas CSV
      </button>
      
      <button 
        onClick={handleExportAppointments}
        className="flex items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all hover:bg-zinc-500/5 active:scale-95"
      >
        <Calendar size={14} className="text-emerald-500" />
        Citas CSV
      </button>

      <button 
        className="flex items-center gap-2 rounded-full bg-[var(--brand-primary)] px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg transition-transform hover:scale-105"
      >
        <Download size={14} />
        Reporte PDF
      </button>
    </div>
  );
}

import { Calendar } from "lucide-react";
