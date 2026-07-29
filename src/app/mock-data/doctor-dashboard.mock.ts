import {
  DashboardAppointment,
  DashboardSummary,
  DoctorAppointmentStatus,
  DoctorDashboardAvailability,
} from '@core/models/doctor-dashboard.model';
import { addMinutes, formatTimeOfDay } from '@core/utils/booking-slots';

/**
 * Phase 4 mock data — replaced by GET /api/doctor/dashboard later.
 * Never import this directly from a component; go through DoctorDashboardService.
 *
 * Not connected to the booking flow, as instructed: these appointments are not
 * produced by createBooking and none of the slots here relate to
 * booking-availability.mock.ts. The dashboard is a separate read of a separate
 * endpoint.
 *
 * "Today" is a fixed constant, like every other date in the mocks (ADR-020), so
 * the dashboard reads the same on any day the suite runs.
 */

/** The signed-in doctor. There is no authentication, so the mock names one. */
export const DASHBOARD_DOCTOR_ID = 1;

/** A Monday, matching the booking window's start. */
export const DASHBOARD_TODAY = '2026-08-10';

/** The doctor's own configured slot length, unrelated to the booking grid's. */
const SLOT_DURATION_MINUTES = 30;

interface AppointmentSeed {
  readonly reference: string;
  readonly patientName: string;
  readonly hour: number;
  readonly minute: number;
  readonly status: DoctorAppointmentStatus;
}

function buildAppointment(seed: AppointmentSeed): DashboardAppointment {
  const end = addMinutes(seed.hour, seed.minute, SLOT_DURATION_MINUTES);

  return {
    reference: seed.reference,
    patientName: seed.patientName,
    time: {
      date: DASHBOARD_TODAY,
      startsAt: formatTimeOfDay(seed.hour, seed.minute),
      endsAt: formatTimeOfDay(end.hour, end.minute),
    },
    status: seed.status,
  };
}

/** In clock order: the morning is done, one consultation is running, two to come. */
const SEEDS: readonly AppointmentSeed[] = [
  {
    reference: 'APT-2026-0031',
    patientName: 'Ramesh Gupta',
    hour: 9,
    minute: 0,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0032',
    patientName: 'Sunita Devi',
    hour: 9,
    minute: 30,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0033',
    patientName: 'Arun Pratap Singh',
    hour: 10,
    minute: 0,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0034',
    patientName: 'Meena Kumari',
    hour: 10,
    minute: 30,
    status: 'in-progress',
  },
  {
    reference: 'APT-2026-0035',
    patientName: 'Shivam Jaiswal',
    hour: 11,
    minute: 0,
    status: 'upcoming',
  },
  {
    reference: 'APT-2026-0036',
    patientName: 'Kamla Prasad',
    hour: 11,
    minute: 30,
    status: 'upcoming',
  },
  {
    reference: 'APT-2026-0037',
    patientName: 'Farhan Ali',
    hour: 12,
    minute: 0,
    status: 'upcoming',
  },
];

export const DASHBOARD_TODAY_APPOINTMENTS: readonly DashboardAppointment[] =
  SEEDS.map(buildAppointment);

export const DASHBOARD_AVAILABILITY: DoctorDashboardAvailability = {
  workingHours: { opensAt: '09:00 AM', closesAt: '05:00 PM' },
  slotDurationMinutes: SLOT_DURATION_MINUTES,
  isAvailableToday: true,
};

/**
 * Today's figures are derived from the list above so a card can never disagree
 * with the rows beneath it (ADR-020). The two that a single day's list cannot
 * answer — appointments beyond today, and how much of the diary is still open —
 * are authored.
 */
export const DASHBOARD_SUMMARY: DashboardSummary = {
  todayCount: DASHBOARD_TODAY_APPOINTMENTS.length,
  completedTodayCount: DASHBOARD_TODAY_APPOINTMENTS.filter(
    (appointment) => appointment.status === 'completed',
  ).length,
  upcomingCount: 18,
  availableSlotsRemaining: 5,
};
