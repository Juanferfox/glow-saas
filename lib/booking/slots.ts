import type { Specialist, SpecialistSchedule, AvailableSlot } from "@/lib/supabase/types";

interface ExistingBlock {
  specialist_id: string | null;
  scheduled_at: string;
  ends_at: string;
}

/**
 * Calcula los slots disponibles dado:
 * - specialists: lista de especialistas activos del tenant
 * - schedules:   sus horarios semanales
 * - existing:    citas ya agendadas para ese día
 * - serviceId:   para filtrar especialistas que ofrecen ese servicio
 * - durationMin: duración del servicio en minutos
 * - date:        "YYYY-MM-DD"
 * - timezone:    ej. "America/Bogota"
 *
 * Devuelve un array de AvailableSlot ordenado por hora.
 */
export function computeAvailableSlots({
  specialists,
  schedules,
  existing,
  serviceId,
  durationMin,
  date,
  timezone,
}: {
  specialists: Specialist[];
  schedules: SpecialistSchedule[];
  existing: ExistingBlock[];
  serviceId: string;
  durationMin: number;
  date: string;
  timezone: string;
}): AvailableSlot[] {
  // día de semana en la TZ del tenant (0=dom … 6=sáb)
  const localDate = new Date(
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(`${date}T12:00:00Z`))
  );
  const dayOfWeek = localDate.getDay(); // 0=domingo

  const slotStep = 30; // cada 30 min se genera una franja
  const slots: AvailableSlot[] = [];

  for (const sp of specialists) {
    // Solo especialistas que ofrecen este servicio
    if (!sp.services.includes(serviceId)) continue;

    // Horario del especialista para ese día
    const schedule = schedules.find(
      (s) =>
        s.specialist_id === sp.id &&
        s.day_of_week === dayOfWeek &&
        s.is_working
    );
    if (!schedule) continue;

    // Bloques ocupados por este especialista
    const blocks = existing.filter((e) => e.specialist_id === sp.id);

    // Generar slots desde start_time hasta end_time - durationMin
    const [startH, startM] = schedule.start_time.split(":").map(Number);
    const [endH, endM]     = schedule.end_time.split(":").map(Number);
    const startMins = (startH ?? 0) * 60 + (startM ?? 0);
    const endMins   = (endH   ?? 0) * 60 + (endM   ?? 0);

    for (let t = startMins; t + durationMin <= endMins; t += slotStep) {
      const slotStart = new Date(`${date}T${pad(Math.floor(t / 60))}:${pad(t % 60)}:00`);
      const slotEnd   = new Date(slotStart.getTime() + durationMin * 60_000);

      // Verificar que no se solapa con ningún bloque existente
      const overlaps = blocks.some((b) => {
        const bStart = new Date(b.scheduled_at);
        const bEnd   = new Date(b.ends_at);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (!overlaps) {
        const timeLabel = `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
        // Evitar duplicados por la misma hora (puede haber varios especialistas a la misma hora)
        slots.push({
          time: timeLabel,
          specialist_id: sp.id,
          specialist_name: sp.name,
          specialist_avatar: sp.avatar_url,
        });
      }
    }
  }

  // Ordenar por hora
  slots.sort((a, b) => a.time.localeCompare(b.time));
  return slots;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}
