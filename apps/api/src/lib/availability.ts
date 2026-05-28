import type { Appointment, TimeOff, WorkingHour } from "@prisma/client";
import type { AvailabilitySlot } from "@barberia/shared";
import type { Env } from "../env.js";
import { utcAtLocalMinutes, weekdayInTz } from "./timezone.js";

function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

export interface ComputeSlotsInput {
  env: Env;
  date: string;
  durationMinutes: number;
  workingHours: WorkingHour[];
  timeOff: TimeOff[];
  appointments: Appointment[];
  now: Date;
}

export function computeAvailableSlots(input: ComputeSlotsInput): AvailabilitySlot[] {
  const { env, date, durationMinutes, workingHours, timeOff, appointments, now } = input;
  const tz = env.DEFAULT_TIMEZONE;
  const granularity = env.SLOT_GRANULARITY_MINUTES;
  const weekday = weekdayInTz(date, tz);

  const blocks = workingHours.filter((wh) => wh.weekday === weekday);
  if (blocks.length === 0) return [];

  const activeAppointments = appointments.filter((a) => a.status !== "CANCELLED");
  const slots: AvailabilitySlot[] = [];

  for (const block of blocks) {
    // Iteramos en pasos de `granularity` minutos desde startMin; la cita debe caber antes de endMin.
    for (let minute = block.startMin; minute + durationMinutes <= block.endMin; minute += granularity) {
      const startsAt = utcAtLocalMinutes(date, minute, tz);
      const endsAt = utcAtLocalMinutes(date, minute + durationMinutes, tz);

      if (startsAt <= now) continue;
      if (timeOff.some((t) => overlaps(startsAt, endsAt, t.startsAt, t.endsAt))) continue;
      if (activeAppointments.some((a) => overlaps(startsAt, endsAt, a.startsAt, a.endsAt))) continue;

      slots.push({ startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() });
    }
  }

  return slots;
}
