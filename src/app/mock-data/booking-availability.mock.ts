import { BookingAvailability, BookingDay, BookingSlot } from '@core/models/booking.model';
import { Weekday } from '@core/models/hospital.model';
import {
  addDays,
  addMinutes,
  formatDayLabel,
  formatTimeOfDay,
  timeKey,
  weekdayOf,
} from '@core/utils/booking-slots';

/**
 * Phase 1 mock data — replaced by GET /api/doctors/{id}/availability later.
 * Never import this directly from a component; go through BookingService.
 *
 * The window is a fixed constant rather than "the next seven days", for the same
 * reason review dates are fixed (ADR-020): a moving window would make every
 * assertion in the suite depend on the day it runs.
 */

/** A Monday, so a Mon–Sat schedule produces six open days and one closed. */
export const BOOKING_WINDOW_START = '2026-08-10';
export const BOOKING_WINDOW_DAYS = 7;

const SLOT_MINUTES = 15;

interface TimeSeed {
  readonly hour: number;
  readonly minute: number;
}

interface AvailabilitySeed {
  readonly doctorId: number;
  readonly weekdays: readonly Weekday[];
  readonly times: readonly TimeSeed[];
  /** '<date>-<timeKey>' entries already taken, e.g. '2026-08-10-1000'. */
  readonly booked?: readonly string[];
}

const MON_TO_SAT: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_TO_FRI: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const ALTERNATE_DAYS: readonly Weekday[] = ['Mon', 'Wed', 'Fri'];

const MORNING: readonly TimeSeed[] = [
  { hour: 10, minute: 0 },
  { hour: 10, minute: 15 },
  { hour: 10, minute: 30 },
  { hour: 10, minute: 45 },
  { hour: 11, minute: 0 },
];

const EVENING: readonly TimeSeed[] = [
  { hour: 17, minute: 0 },
  { hour: 17, minute: 30 },
  { hour: 18, minute: 0 },
];

const FULL_DAY: readonly TimeSeed[] = [...MORNING, ...EVENING];

function buildSlot(doctorId: number, date: string, time: TimeSeed, isBooked: boolean): BookingSlot {
  const end = addMinutes(time.hour, time.minute, SLOT_MINUTES);

  return {
    id: `${doctorId}-${date}-${timeKey(time.hour, time.minute)}`,
    date,
    startsAt: formatTimeOfDay(time.hour, time.minute),
    endsAt: formatTimeOfDay(end.hour, end.minute),
    isAvailable: !isBooked,
  };
}

function buildAvailability(seed: AvailabilitySeed): BookingAvailability {
  const booked = new Set(seed.booked ?? []);
  const days: BookingDay[] = [];

  for (let offset = 0; offset < BOOKING_WINDOW_DAYS; offset++) {
    const date = addDays(BOOKING_WINDOW_START, offset);

    if (!seed.weekdays.includes(weekdayOf(date))) {
      continue;
    }

    const slots = seed.times.map((time) =>
      buildSlot(
        seed.doctorId,
        date,
        time,
        booked.has(`${date}-${timeKey(time.hour, time.minute)}`),
      ),
    );

    days.push({
      date,
      label: formatDayLabel(date),
      slots,
      availableSlotCount: slots.filter((slot) => slot.isAvailable).length,
    });
  }

  return { doctorId: seed.doctorId, days };
}

const SEEDS: readonly AvailabilitySeed[] = [
  {
    doctorId: 1,
    weekdays: MON_TO_SAT,
    times: FULL_DAY,
    // A popular cardiologist: the first morning is nearly gone.
    booked: [
      '2026-08-10-1000',
      '2026-08-10-1015',
      '2026-08-10-1030',
      '2026-08-10-1045',
      '2026-08-11-1000',
      '2026-08-12-1700',
    ],
  },
  { doctorId: 2, weekdays: MON_TO_SAT, times: FULL_DAY, booked: ['2026-08-10-1730'] },
  { doctorId: 3, weekdays: MON_TO_SAT, times: MORNING, booked: ['2026-08-11-1015'] },
  { doctorId: 4, weekdays: MON_TO_SAT, times: FULL_DAY },
  { doctorId: 5, weekdays: MON_TO_SAT, times: MORNING },
  { doctorId: 6, weekdays: MON_TO_SAT, times: FULL_DAY, booked: ['2026-08-13-1100'] },
  { doctorId: 7, weekdays: MON_TO_FRI, times: EVENING },
  { doctorId: 8, weekdays: ALTERNATE_DAYS, times: MORNING },
  { doctorId: 9, weekdays: MON_TO_SAT, times: FULL_DAY },
  { doctorId: 10, weekdays: MON_TO_FRI, times: MORNING },
  {
    doctorId: 11,
    weekdays: ALTERNATE_DAYS,
    times: MORNING,
    // Wednesday is completely gone, so a date picker has a day to disable.
    booked: [
      '2026-08-12-1000',
      '2026-08-12-1015',
      '2026-08-12-1030',
      '2026-08-12-1045',
      '2026-08-12-1100',
    ],
  },
  // Doctor 12 is deliberately absent: a doctor who publishes no slots at all.
];

export const BOOKING_AVAILABILITY: readonly BookingAvailability[] = SEEDS.map(buildAvailability);
