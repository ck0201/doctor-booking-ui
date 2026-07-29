import { TestBed } from '@angular/core/testing';

import { DoctorDashboardService } from './doctor-dashboard.service';
import { DoctorService } from './doctor.service';
import { BookingService } from './booking.service';
import { DASHBOARD_DOCTOR_ID, DASHBOARD_TODAY } from '@mock-data/doctor-dashboard.mock';

describe('DoctorDashboardService', () => {
  let service: DoctorDashboardService;
  let doctors: DoctorService;

  beforeEach(() => {
    service = TestBed.inject(DoctorDashboardService);
    doctors = TestBed.inject(DoctorService);
  });

  describe('getDoctor', () => {
    it('resolves the signed-in doctor from the doctor module', () => {
      expect(service.getDoctor()).toBe(doctors.getById(DASHBOARD_DOCTOR_ID));
    });

    it('gives a real doctor, so the welcome line can never be blank', () => {
      const doctor = service.getDoctor();

      expect(doctor?.name.length).toBeGreaterThan(0);
      expect(doctor?.primarySpecialty.name.length).toBeGreaterThan(0);
    });
  });

  describe('getToday', () => {
    it('reports a fixed date, so the dashboard reads the same every run', () => {
      expect(service.getToday()).toBe(DASHBOARD_TODAY);
      expect(service.getToday()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe('getDashboardSummary', () => {
    it('returns the four figures the cards need', () => {
      const summary = service.getDashboardSummary();

      expect(summary.todayCount).toBeGreaterThan(0);
      expect(summary.upcomingCount).toBeGreaterThan(0);
      expect(summary.completedTodayCount).toBeGreaterThanOrEqual(0);
      expect(summary.availableSlotsRemaining).toBeGreaterThanOrEqual(0);
    });

    it('counts today from the list beneath it, so a card cannot disagree', () => {
      const summary = service.getDashboardSummary();
      const appointments = service.getTodayAppointments();

      expect(summary.todayCount).toBe(appointments.length);
      expect(summary.completedTodayCount).toBe(
        appointments.filter((appointment) => appointment.status === 'completed').length,
      );
    });

    it('never claims more completed than exist today', () => {
      const summary = service.getDashboardSummary();

      expect(summary.completedTodayCount).toBeLessThanOrEqual(summary.todayCount);
    });
  });

  describe('getTodayAppointments', () => {
    it('returns today’s list', () => {
      expect(service.getTodayAppointments().length).toBeGreaterThan(0);
    });

    it('puts everything on the dashboard’s today', () => {
      for (const appointment of service.getTodayAppointments()) {
        expect(appointment.time.date).toBe(service.getToday());
      }
    });

    it('is already in clock order, so no caller has to sort', () => {
      const starts = service.getTodayAppointments().map((appointment) => appointment.time.startsAt);

      expect([...starts].sort()).toEqual(starts);
    });

    it('gives every row a patient, a reference and a time', () => {
      for (const appointment of service.getTodayAppointments()) {
        expect(appointment.patientName.length).toBeGreaterThan(0);
        expect(appointment.reference).toMatch(/^APT-\d{4}-\d{4}$/);
        expect(appointment.time.startsAt).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
        expect(appointment.time.endsAt).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
      }
    });

    it('gives every reference to one patient only', () => {
      const references = service.getTodayAppointments().map((item) => item.reference);

      expect(new Set(references).size).toBe(references.length);
    });

    it('shows all three doctor-facing statuses, and at most one in progress', () => {
      const statuses = service.getTodayAppointments().map((item) => item.status);

      expect(new Set(statuses)).toEqual(new Set(['completed', 'in-progress', 'upcoming']));
      expect(statuses.filter((status) => status === 'in-progress').length).toBe(1);
    });
  });

  describe('getAvailability', () => {
    it('returns working hours, slot duration and today’s state', () => {
      const availability = service.getAvailability();

      expect(availability.workingHours.opensAt).toBe('09:00 AM');
      expect(availability.workingHours.closesAt).toBe('05:00 PM');
      expect(availability.slotDurationMinutes).toBe(30);
      expect(availability.isAvailableToday).toBe(true);
    });
  });

  describe('isolation from the booking flow', () => {
    it('shares no appointment reference with the patient history', () => {
      const dashboardRefs = new Set(
        service.getTodayAppointments().map((appointment) => appointment.reference),
      );
      const historyRefs = TestBed.inject(BookingService)
        .getAppointmentHistory()
        .map((appointment) => appointment.reference);

      for (const reference of historyRefs) {
        expect(dashboardRefs.has(reference)).toBe(false);
      }
    });

    it('is read only: nothing here writes back', () => {
      const before = service.getAvailability().isAvailableToday;

      service.getAvailability();

      expect(service.getAvailability().isAvailableToday).toBe(before);
    });
  });
});
