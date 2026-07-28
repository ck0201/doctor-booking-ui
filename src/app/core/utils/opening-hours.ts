import { OpeningHours, WEEKDAYS, Weekday } from '@core/models/hospital.model';

/**
 * 'Mon – Sat' for a contiguous run, 'Mon, Wed, Fri' otherwise.
 *
 * Derived rather than authored alongside the structured days, so the label can
 * never contradict the days the "open today" check uses (ADR-020).
 */
export function weekdayLabel(days: readonly Weekday[]): string {
  if (days.length === 0) {
    return '';
  }
  if (days.length === 1) {
    return days[0];
  }

  const indexes = days.map((day) => WEEKDAYS.indexOf(day)).sort((a, b) => a - b);
  const isContiguous = indexes.every(
    (index, position) => position === 0 || index === indexes[position - 1] + 1,
  );

  if (isContiguous) {
    return `${WEEKDAYS[indexes[0]]} – ${WEEKDAYS[indexes[indexes.length - 1]]}`;
  }

  return indexes.map((index) => WEEKDAYS[index]).join(', ');
}

/** 'Mon – Sat · 09:00 AM – 08:00 PM' */
export function openingHoursLabel(hours: OpeningHours): string {
  return `${weekdayLabel(hours.days)} · ${hours.opensAt} – ${hours.closesAt}`;
}
