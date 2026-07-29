import { Appointment, AppointmentStatus } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';
import { addMinutes, formatTimeOfDay, SLOT_DURATION_MINUTES } from '@core/utils/booking-slots';
import { DOCTORS } from './doctors.mock';

/**
 * Phase 3 mock data — replaced by GET /api/appointments later.
 * Never import this directly from a component; go through BookingService.
 *
 * Read-only history. These are not produced by createBooking and nothing here is
 * written back: ADR-026 keeps the service stateless, so a booking made in this
 * session does not appear in this list. That is a known limitation, not an
 * oversight.
 *
 * The doctor on each record is the real doctor, resolved by id, so a name or a
 * specialty can never drift from the doctor module (ADR-020).
 */

function doctorById(id: number): DoctorCardData {
  const doctor = DOCTORS.find((candidate) => candidate.id === id);
  if (!doctor) {
    throw new Error(`Mock data error: unknown doctor id ${id}`);
  }
  return doctor;
}

interface AppointmentSeed {
  readonly reference: string;
  readonly doctorId: number;
  /** ISO date. Fixed values only — never derived from the current date. */
  readonly date: string;
  readonly hour: number;
  readonly minute: number;
  readonly status: AppointmentStatus;
}

function buildAppointment(seed: AppointmentSeed): Appointment {
  const end = addMinutes(seed.hour, seed.minute, SLOT_DURATION_MINUTES);

  return {
    reference: seed.reference,
    doctor: doctorById(seed.doctorId),
    time: {
      date: seed.date,
      startsAt: formatTimeOfDay(seed.hour, seed.minute),
      endsAt: formatTimeOfDay(end.hour, end.minute),
    },
    status: seed.status,
  };
}

/**
 * Deliberately not in display order, and references deliberately not in date
 * order, so the sort has something real to do.
 */
const SEEDS: readonly AppointmentSeed[] = [
  {
    reference: 'APT-2026-0002',
    doctorId: 8, // Dr. Anil Gupta, Neurologist
    date: '2026-05-05',
    hour: 11,
    minute: 0,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0009',
    doctorId: 1, // Dr. Asha Verma, Cardiologist
    date: '2026-08-14',
    hour: 10,
    minute: 30,
    status: 'upcoming',
  },
  {
    reference: 'APT-2026-0004',
    doctorId: 11, // Dr. Mohan Lal Srivastava, General Physician
    date: '2026-07-21',
    hour: 17,
    minute: 30,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0001',
    doctorId: 4, // Dr. Imran Ansari, Dentist
    date: '2026-06-02',
    hour: 10,
    minute: 45,
    status: 'cancelled',
  },
  {
    reference: 'APT-2026-0006',
    doctorId: 6, // Dr. Vikram Singh, Orthopedic
    date: '2026-08-12',
    hour: 17,
    minute: 0,
    status: 'upcoming',
  },
  {
    reference: 'APT-2026-0003',
    doctorId: 2, // Dr. Rakesh Mishra, General Physician
    date: '2026-06-18',
    hour: 10,
    minute: 15,
    status: 'completed',
  },
  {
    reference: 'APT-2026-0008',
    doctorId: 10, // Dr. Kavita Pandey, Eye Specialist
    date: '2026-07-28',
    hour: 10,
    minute: 0,
    status: 'cancelled',
  },
  {
    reference: 'APT-2026-0005',
    doctorId: 3, // Dr. Sunita Yadav, Gynecologist
    date: '2026-08-11',
    hour: 10,
    minute: 15,
    status: 'upcoming',
  },
];

export const APPOINTMENT_HISTORY: readonly Appointment[] = SEEDS.map(buildAppointment);
