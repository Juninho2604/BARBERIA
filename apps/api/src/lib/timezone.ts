import { DateTime } from "luxon";

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function parseDate(dateIso: string): { year: number; month: number; day: number } {
  const m = DATE_RE.exec(dateIso);
  if (!m) throw new Error(`Fecha inválida: ${dateIso}`);
  return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
}

export function utcAtLocalMinutes(dateIso: string, minutes: number, tz: string): Date {
  const { year, month, day } = parseDate(dateIso);
  const dt = DateTime.fromObject(
    { year, month, day, hour: 0, minute: 0 },
    { zone: tz },
  ).plus({ minutes });
  if (!dt.isValid) throw new Error(`No se pudo convertir ${dateIso}@${minutes} a ${tz}: ${dt.invalidReason}`);
  return dt.toUTC().toJSDate();
}

export function startOfDayUtc(dateIso: string, tz: string): Date {
  return utcAtLocalMinutes(dateIso, 0, tz);
}

export function endOfDayUtc(dateIso: string, tz: string): Date {
  return utcAtLocalMinutes(dateIso, 24 * 60, tz);
}

// 0=Domingo … 6=Sábado (alineado con WorkingHour.weekday).
export function weekdayInTz(dateIso: string, tz: string): number {
  const { year, month, day } = parseDate(dateIso);
  const dt = DateTime.fromObject({ year, month, day }, { zone: tz });
  return dt.weekday % 7;
}
