import { Appointment, AppointmentStatus } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';
import {
  APPOINTMENT_FILTERS,
  APPOINTMENT_FILTER_LABELS,
  APPOINTMENT_STATUS_LABELS,
  compareAppointments,
  matchesFilter,
  sortAppointments,
} from './appointment-order';

const DOCTOR: DoctorCardData = {
  id: 1,
  name: 'Dr. Asha Verma',
  primarySpecialty: { id: 1, name: 'Cardiologist' },
};

const appointment = (reference: string, date: string, status: AppointmentStatus): Appointment => ({
  reference,
  doctor: DOCTOR,
  time: { date, startsAt: '10:00 AM', endsAt: '10:15 AM' },
  status,
});

describe('sortAppointments', () => {
  it('puts upcoming first, then completed, then cancelled', () => {
    const sorted = sortAppointments([
      appointment('C', '2026-06-01', 'cancelled'),
      appointment('D', '2026-06-01', 'completed'),
      appointment('U', '2026-06-01', 'upcoming'),
    ]);

    expect(sorted.map((item) => item.status)).toEqual(['upcoming', 'completed', 'cancelled']);
  });

  it('puts the newest date first inside a status', () => {
    const sorted = sortAppointments([
      appointment('A', '2026-05-05', 'completed'),
      appointment('B', '2026-07-21', 'completed'),
      appointment('C', '2026-06-18', 'completed'),
    ]);

    expect(sorted.map((item) => item.time.date)).toEqual([
      '2026-07-21',
      '2026-06-18',
      '2026-05-05',
    ]);
  });

  it('never lets a newer completed appointment jump ahead of an upcoming one', () => {
    const sorted = sortAppointments([
      appointment('NEW', '2026-12-31', 'completed'),
      appointment('SOON', '2026-08-01', 'upcoming'),
    ]);

    expect(sorted.map((item) => item.reference)).toEqual(['SOON', 'NEW']);
  });

  it('falls back to the reference so the order is stable', () => {
    const first = sortAppointments([
      appointment('APT-1', '2026-06-01', 'completed'),
      appointment('APT-2', '2026-06-01', 'completed'),
    ]);
    const second = sortAppointments([
      appointment('APT-2', '2026-06-01', 'completed'),
      appointment('APT-1', '2026-06-01', 'completed'),
    ]);

    expect(first.map((item) => item.reference)).toEqual(['APT-2', 'APT-1']);
    expect(second.map((item) => item.reference)).toEqual(['APT-2', 'APT-1']);
  });

  it('does not mutate the list it is given', () => {
    const input = [
      appointment('C', '2026-06-01', 'cancelled'),
      appointment('U', '2026-06-01', 'upcoming'),
    ];

    sortAppointments(input);

    expect(input.map((item) => item.reference)).toEqual(['C', 'U']);
  });

  it('handles an empty list', () => {
    expect(sortAppointments([])).toEqual([]);
  });
});

describe('compareAppointments', () => {
  it('reports equality only for the same status, date and reference', () => {
    const one = appointment('APT-1', '2026-06-01', 'completed');

    expect(compareAppointments(one, one)).toBe(0);
    expect(
      compareAppointments(one, appointment('APT-2', '2026-06-01', 'completed')),
    ).toBeGreaterThan(0);
  });
});

describe('matchesFilter', () => {
  it('lets everything through for "all"', () => {
    expect(matchesFilter(appointment('A', '2026-06-01', 'cancelled'), 'all')).toBe(true);
  });

  it('matches only its own status otherwise', () => {
    const upcoming = appointment('A', '2026-06-01', 'upcoming');

    expect(matchesFilter(upcoming, 'upcoming')).toBe(true);
    expect(matchesFilter(upcoming, 'completed')).toBe(false);
    expect(matchesFilter(upcoming, 'cancelled')).toBe(false);
  });
});

describe('labels', () => {
  it('offers the four filters in a fixed order', () => {
    expect(APPOINTMENT_FILTERS).toEqual(['all', 'upcoming', 'completed', 'cancelled']);
  });

  it('labels every status and every filter', () => {
    expect(APPOINTMENT_STATUS_LABELS).toEqual({
      upcoming: 'Upcoming',
      completed: 'Completed',
      cancelled: 'Cancelled',
    });

    for (const filter of APPOINTMENT_FILTERS) {
      expect(APPOINTMENT_FILTER_LABELS[filter].length).toBeGreaterThan(0);
    }
  });
});
