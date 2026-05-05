"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Save, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Specialist {
  id: string;
  name: string;
}

interface Schedule {
  id: string;
  specialist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_working: boolean;
}

const DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"] as const;

export default function HorariosPage() {
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedSp, setSelectedSp] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState("");

  const tenantSlug = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("tenant") ?? "fm-glow-studio"
    : "fm-glow-studio";

  const tenantId = `dev-${tenantSlug}`;

  const fetchData = useCallback(async () => {
    setLoading(true);
    const schedRes = await fetch(`/api/admin/horarios?tenant_id=${tenantId}`);
    const schedData = await schedRes.json();
    const allSchedules: Schedule[] = schedData.schedules ?? [];
    setSchedules(allSchedules);

    const spIds = [...new Set(allSchedules.map((s) => s.specialist_id))];
    setSpecialists(spIds.map((id) => ({ id, name: id })));
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  function getSchedule(spId: string, day: number): Schedule | undefined {
    return schedules.find((s) => s.specialist_id === spId && s.day_of_week === day);
  }

  async function toggleWorking(spId: string, day: number) {
    const existing = getSchedule(spId, day);
    if (!existing) return;

    const updated = schedules.map((s) =>
      s.id === existing.id ? { ...s, is_working: !s.is_working } : s
    );
    setSchedules(updated);
  }

  async function updateTime(spId: string, day: number, field: "start_time" | "end_time", value: string) {
    const existing = getSchedule(spId, day);
    if (!existing) return;

    const updated = schedules.map((s) =>
      s.id === existing.id ? { ...s, [field]: value } : s
    );
    setSchedules(updated);
  }

  async function saveSpecialist(spId: string) {
    setSaving(spId);
    const spSchedules = schedules.filter((s) => s.specialist_id === spId);
    try {
      const res = await fetch("/api/admin/horarios", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialist_id: spId, schedules: spSchedules }),
      });
      if (!res.ok) throw new Error("Error al guardar");
      setSavedMsg(`Horarios de ${spId} guardados`);
      setTimeout(() => setSavedMsg(""), 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--brand-border)] border-t-[var(--brand-primary)]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--brand-text)" }}>
            Horarios de Especialistas
          </h2>
          <p className="text-sm opacity-50 mt-1" style={{ color: "var(--brand-text)" }}>
            Configura los días y horas de trabajo de cada especialista.
          </p>
        </div>
        {savedMsg && (
          <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-600">
            {savedMsg}
          </span>
        )}
      </div>

      {specialists.length === 0 ? (
        <div className="py-16 text-center opacity-40" style={{ color: "var(--brand-text)" }}>
          No hay especialistas cargados.
        </div>
      ) : (
        specialists.map((sp) => {
          const isSelected = selectedSp === sp.id;
          return (
            <div
              key={sp.id}
              className="rounded-2xl border overflow-hidden"
              style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-surface)" }}
            >
              <button
                onClick={() => setSelectedSp(isSelected ? null : sp.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Clock size={18} style={{ color: "var(--brand-primary)" }} />
                  <span className="font-semibold" style={{ color: "var(--brand-text)" }}>
                    {sp.name}
                  </span>
                </div>
                <span className="text-xs opacity-40" style={{ color: "var(--brand-text)" }}>
                  {isSelected ? "▲" : "▼"}
                </span>
              </button>

              {isSelected && (
                <div className="border-t px-5 pb-5 pt-2" style={{ borderColor: "var(--brand-border)" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          {DAYS.map((day) => (
                            <th key={day} className="px-2 py-1.5 text-xs font-semibold opacity-50" style={{ color: "var(--brand-text)" }}>
                              {day}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {DAYS.map((_, dayIdx) => {
                            const sched = getSchedule(sp.id, dayIdx);
                            const isWorking = sched?.is_working ?? false;
                            const startTime = sched?.start_time?.slice(0, 5) ?? "09:00";
                            const endTime = sched?.end_time?.slice(0, 5) ?? "18:00";

                            return (
                              <td key={dayIdx} className="px-2 py-2 text-center">
                                <label className="flex items-center justify-center cursor-pointer mb-1.5">
                                  <input
                                    type="checkbox"
                                    checked={isWorking}
                                    onChange={() => toggleWorking(sp.id, dayIdx)}
                                    className="h-3.5 w-3.5 rounded accent-[var(--brand-primary)]"
                                  />
                                </label>

                                {isWorking && (
                                  <div className="flex flex-col gap-1 items-center">
                                    <input
                                      type="time"
                                      value={startTime}
                                      onChange={(e) => updateTime(sp.id, dayIdx, "start_time", e.target.value + ":00")}
                                      className="w-[72px] rounded-lg border px-1.5 py-0.5 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                                      style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}
                                    />
                                    <span className="text-[9px] opacity-30" style={{ color: "var(--brand-text)" }}>a</span>
                                    <input
                                      type="time"
                                      value={endTime}
                                      onChange={(e) => updateTime(sp.id, dayIdx, "end_time", e.target.value + ":00")}
                                      className="w-[72px] rounded-lg border px-1.5 py-0.5 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                                      style={{ borderColor: "var(--brand-border)", backgroundColor: "var(--brand-bg)", color: "var(--brand-text)" }}
                                    />
                                  </div>
                                )}
                                {!isWorking && (
                                  <span className="text-[10px] opacity-20" style={{ color: "var(--brand-text)" }}>
                                    —
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={() => saveSpecialist(sp.id)}
                    disabled={saving === sp.id}
                    className={cn(
                      "mt-4 flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all",
                      "hover:opacity-90 disabled:opacity-50"
                    )}
                    style={{ backgroundColor: "var(--brand-primary)" }}
                  >
                    {saving === sp.id ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Guardar horarios
                  </button>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
