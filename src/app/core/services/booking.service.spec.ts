import { TestBed } from '@angular/core/testing';

import { BookingService } from './booking.service';
import { DoctorService } from './doctor.service';
import { PatientInfo } from '../models/booking.model';
import { EMPTY_PATIENT_INFO } from '@core/utils/booking-validation';
import { weekdayOf } from '@core/utils/booking-slots';
import { BOOKING_WINDOW_DAYS, BOOKING_WINDOW_START } from '@mock-data/booking-availability.mock';

const VALID_PATIENT: PatientInfo = {
  fullName: 'Ramesh Gupta',
  phoneNumber: '9876543210',
  age: '42',
  gender: 'male',
  reasonForVisit: 'Chest discomfort while walking',
};

describe('BookingService', () => {
  let service: BookingService;
  let doctors: DoctorService;

  const firstFreeSlotFor = (doctorId: number) =>
    service
      .getDoctorAvailability(doctorId)
      .days.flatMap((day) => day.slots)
      .find((slot) => slot.isAvailable)!;

  beforeEach(() => {
    service = TestBed.inject(BookingService);
    doctors = TestBed.inject(DoctorService);
  });

  describe('getDoctorAvailability', () => {
    it('returns days with slots for a doctor who publishes them', () => {
      const availability = service.getDoctorAvailability(1);

      expect(availability.doctorId).toBe(1);
      expect(availability.days.length).toBeGreaterThan(0);
      expect(availability.days[0].slots.length).toBeGreaterThan(0);
    });

    it('starts at the fixed window start', () => {
      expect(service.getDoctorAvailability(1).days[0].date).toBe(BOOKING_WINDOW_START);
    });

    it('never runs past the window', () => {
      for (const listed of doctors.getDoctors()) {
        expect(service.getDoctorAvailability(listed.id).days.length).toBeLessThanOrEqual(
          BOOKING_WINDOW_DAYS,
        );
      }
    });

    it('only publishes days the doctor actually sits', () => {
      // Doctor 7 is Mon – Fri.
      const days = service.getDoctorAvailability(7).days.map((day) => weekdayOf(day.date));

      expect(days).not.toContain('Sat');
      expect(days).not.toContain('Sun');
    });

    it('answers with no days for a doctor who publishes none', () => {
      const availability = service.getDoctorAvailability(12);

      expect(availability.doctorId).toBe(12);
      expect(availability.days).toEqual([]);
    });

    it('answers with no days for an unknown doctor rather than throwing', () => {
      expect(service.getDoctorAvailability(9999).days).toEqual([]);
    });

    it('counts the free slots on each day', () => {
      for (const day of service.getDoctorAvailability(1).days) {
        expect(day.availableSlotCount).toBe(day.slots.filter((slot) => slot.isAvailable).length);
      }
    });

    it('marks booked slots unavailable', () => {
      const monday = service.getDoctorAvailability(1).days[0];
      const taken = monday.slots.filter((slot) => !slot.isAvailable);

      expect(taken.length).toBe(4);
      expect(taken.map((slot) => slot.startsAt)).toEqual([
        '10:00 AM',
        '10:15 AM',
        '10:30 AM',
        '10:45 AM',
      ]);
    });

    it('can present a fully booked day, so a date picker has one to disable', () => {
      const fullyBooked = service
        .getDoctorAvailability(11)
        .days.filter((day) => day.availableSlotCount === 0);

      expect(fullyBooked.length).toBe(1);
      expect(fullyBooked[0].date).toBe('2026-08-12');
    });
  });

  describe('findSlot', () => {
    it('finds a slot the doctor offers', () => {
      const slot = firstFreeSlotFor(2);

      expect(service.findSlot(2, slot.id)).toBe(slot);
    });

    it('does not find another doctor’s slot', () => {
      const slot = firstFreeSlotFor(2);

      expect(service.findSlot(4, slot.id)).toBeUndefined();
    });

    it('does not find an invented slot', () => {
      expect(service.findSlot(2, 'nope')).toBeUndefined();
    });
  });

  describe('createBooking', () => {
    it('confirms a free slot with valid details', () => {
      const slot = firstFreeSlotFor(1);

      const response = service.createBooking({
        doctorId: 1,
        slotId: slot.id,
        patient: VALID_PATIENT,
      });

      expect(response.status).toBe('confirmed');
      expect(response.slot).toBe(slot);
      expect(response.message).toBeUndefined();
    });

    it('issues a sequential reference', () => {
      const slots = service
        .getDoctorAvailability(1)
        .days.flatMap((day) => day.slots)
        .filter((slot) => slot.isAvailable);

      const first = service.createBooking({
        doctorId: 1,
        slotId: slots[0].id,
        patient: VALID_PATIENT,
      });
      const second = service.createBooking({
        doctorId: 1,
        slotId: slots[1].id,
        patient: VALID_PATIENT,
      });

      expect(first.reference).toBe('APT-2026-0001');
      expect(second.reference).toBe('APT-2026-0002');
    });

    it('rejects a slot the doctor does not offer', () => {
      const response = service.createBooking({
        doctorId: 1,
        slotId: 'made-up',
        patient: VALID_PATIENT,
      });

      expect(response.status).toBe('rejected');
      expect(response.message).toContain('no longer offered');
      expect(response.reference).toBeUndefined();
    });

    it('rejects a slot somebody already holds', () => {
      const taken = service
        .getDoctorAvailability(1)
        .days[0].slots.find((slot) => !slot.isAvailable)!;

      const response = service.createBooking({
        doctorId: 1,
        slotId: taken.id,
        patient: VALID_PATIENT,
      });

      expect(response.status).toBe('rejected');
      expect(response.message).toContain('just been taken');
    });

    it('rejects incomplete patient details', () => {
      const response = service.createBooking({
        doctorId: 1,
        slotId: firstFreeSlotFor(1).id,
        patient: EMPTY_PATIENT_INFO,
      });

      expect(response.status).toBe('rejected');
      expect(response.message).toContain('incomplete');
    });

    it('does not take the slot, since nothing persists yet', () => {
      const slot = firstFreeSlotFor(1);
      service.createBooking({ doctorId: 1, slotId: slot.id, patient: VALID_PATIENT });

      expect(service.findSlot(1, slot.id)?.isAvailable).toBe(true);
    });
  });

  describe('mock data integrity', () => {
    it('offers availability only for doctors that exist', () => {
      for (const listed of doctors.getDoctors()) {
        expect(service.getDoctorAvailability(listed.id).doctorId).toBe(listed.id);
      }
    });

    it('gives every slot a unique id across the whole window', () => {
      const ids = doctors
        .getDoctors()
        .flatMap((doctor) =>
          service
            .getDoctorAvailability(doctor.id)
            .days.flatMap((day) => day.slots.map((s) => s.id)),
        );

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('keeps every slot inside the day it belongs to', () => {
      for (const listed of doctors.getDoctors()) {
        for (const day of service.getDoctorAvailability(listed.id).days) {
          for (const slot of day.slots) {
            expect(slot.date).toBe(day.date);
            expect(slot.id).toContain(day.date);
          }
        }
      }
    });

    it('keeps days in chronological order with no repeats', () => {
      for (const listed of doctors.getDoctors()) {
        const dates = service.getDoctorAvailability(listed.id).days.map((day) => day.date);

        expect([...dates].sort()).toEqual(dates);
        expect(new Set(dates).size).toBe(dates.length);
      }
    });

    it('formats every slot as a readable time range', () => {
      for (const slot of service.getDoctorAvailability(1).days.flatMap((day) => day.slots)) {
        expect(slot.startsAt).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
        expect(slot.endsAt).toMatch(/^\d{2}:\d{2} (AM|PM)$/);
      }
    });

    it('labels every day', () => {
      for (const day of service.getDoctorAvailability(1).days) {
        expect(day.label).toMatch(/^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) \d{1,2} [A-Z][a-z]{2}$/);
      }
    });
  });
});
