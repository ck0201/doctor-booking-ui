import { Appointment, AppointmentFilter, AppointmentStatus } from '@core/models/booking.model';

/**
 * Ordering and labelling for appointment history.
 *
 * Sorting lives here rather than in a template or a component so it can be
 * asserted directly and stays the same wherever history is shown.
 */

/** Upcoming first, then completed, cancelled last. */
const STATUS_ORDER: Readonly<Record<AppointmentStatus, number>> = {
  upcoming: 0,
  completed: 1,
  cancelled: 2,
};

export const APPOINTMENT_STATUS_LABELS: Readonly<Record<AppointmentStatus, string>> = {
  upcoming: 'Upcoming',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

export const APPOINTMENT_FILTER_LABELS: Readonly<Record<AppointmentFilter, string>> = {
  all: 'All',
  ...APPOINTMENT_STATUS_LABELS,
};

/** The filter tabs, in the order they are shown. */
export const APPOINTMENT_FILTERS: readonly AppointmentFilter[] = [
  'all',
  'upcoming',
  'completed',
  'cancelled',
];

/**
 * Groups by status, then newest date first inside each group.
 *
 * ISO dates compare correctly as strings, which is why they are stored that way.
 * Reference is the final tie-break so the order is stable rather than
 * dependent on the input sequence.
 */
export function compareAppointments(first: Appointment, second: Appointment): number {
  const byStatus = STATUS_ORDER[first.status] - STATUS_ORDER[second.status];
  if (byStatus !== 0) {
    return byStatus;
  }

  const byDate = second.time.date.localeCompare(first.time.date);
  if (byDate !== 0) {
    return byDate;
  }

  return second.reference.localeCompare(first.reference);
}

/** Returns a sorted copy; the input is never mutated. */
export function sortAppointments(appointments: readonly Appointment[]): readonly Appointment[] {
  return [...appointments].sort(compareAppointments);
}

export function matchesFilter(appointment: Appointment, filter: AppointmentFilter): boolean {
  return filter === 'all' || appointment.status === filter;
}
