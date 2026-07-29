import { AppointmentTime } from '@core/models/booking.model';
import { WEEKDAYS, Weekday } from '@core/models/hospital.model';

/** How long one appointment slot runs. */
export const SLOT_DURATION_MINUTES = 15;

/**
 * Calendar helpers for booking slots.
 *
 * Everything is derived from an ISO date string and parsed in UTC, so a label
 * never shifts by a day depending on the machine's timezone, and nothing here
 * reads the clock — the mock's window is a fixed constant, which keeps the
 * tests deterministic (ADR-020).
 *
 * Weekday is reused from the hospital domain rather than redeclared; it is a
 * plain calendar type that happens to live there first.
 */

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function toUtc(isoDate: string): Date {
  if (!ISO_DATE.test(isoDate)) {
    throw new Error(`Expected an ISO date (YYYY-MM-DD), received '${isoDate}'`);
  }

  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function toIso(date: Date): string {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, days: number): string {
  const date = toUtc(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function weekdayOf(isoDate: string): Weekday {
  // getUTCDay() is Sunday-first; WEEKDAYS is Monday-first.
  const sundayFirst = toUtc(isoDate).getUTCDay();
  return WEEKDAYS[(sundayFirst + 6) % 7];
}

/** 'Mon 10 Aug' */
export function formatDayLabel(isoDate: string): string {
  const date = toUtc(isoDate);
  return `${weekdayOf(isoDate)} ${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
}

/** 'Mon 10 Aug 2026' — used where the year matters, such as a summary. */
export function formatFullDayLabel(isoDate: string): string {
  return `${formatDayLabel(isoDate)} ${toUtc(isoDate).getUTCFullYear()}`;
}

/** 0, 0 -> '12:00 AM'; 13, 30 -> '01:30 PM' */
export function formatTimeOfDay(hour: number, minute: number): string {
  const suffix = hour < 12 ? 'AM' : 'PM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${`${displayHour}`.padStart(2, '0')}:${`${minute}`.padStart(2, '0')} ${suffix}`;
}

/** '1000' for 10:00, used to build slot ids. */
export function timeKey(hour: number, minute: number): string {
  return `${`${hour}`.padStart(2, '0')}${`${minute}`.padStart(2, '0')}`;
}

/** '09:00 AM – 05:00 PM'. The one place the dash between two times is decided. */
export function formatRange(from: string, to: string): string {
  return `${from} – ${to}`;
}

/** '10:00 AM – 10:15 AM'. Used by the confirmation, the history and the dashboard. */
export function formatTimeRange(time: AppointmentTime): string {
  return formatRange(time.startsAt, time.endsAt);
}

export function addMinutes(
  hour: number,
  minute: number,
  minutes: number,
): { hour: number; minute: number } {
  const total = hour * 60 + minute + minutes;
  return { hour: Math.floor(total / 60) % 24, minute: total % 60 };
}
