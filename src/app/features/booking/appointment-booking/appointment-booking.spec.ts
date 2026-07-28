import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AppointmentBooking } from './appointment-booking';
import { BookingService } from '@core/services/booking.service';
import { PatientInfo } from '@core/models/booking.model';

const VALID_PATIENT: PatientInfo = {
  fullName: 'Ramesh Gupta',
  phoneNumber: '9876543210',
  age: '42',
  gender: 'male',
  reasonForVisit: '',
};

describe('AppointmentBooking', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let booking: BookingService;

  const open = (doctorId: string) => harness.navigateByUrl(`/book/${doctorId}`, AppointmentBooking);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const queryAll = (selector: string) =>
    Array.from(harness.routeNativeElement?.querySelectorAll(selector) ?? []) as HTMLElement[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [{ path: 'book', loadChildren: () => import('../booking.routes') }],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    booking = TestBed.inject(BookingService);
  });

  describe('a valid doctor', () => {
    it('resolves the doctor from the route', async () => {
      const page = await open('1');

      expect(page.doctor()?.name).toBe('Dr. Asha Verma');
      expect(query('[data-testid="not-found"]')).toBeNull();
    });

    it('reuses the doctor card for the summary', async () => {
      await open('1');

      expect(query('app-doctor-card')).toBeTruthy();
      expect(text()).toContain('Dr. Asha Verma');
      expect(text()).toContain('Cardiologist');
    });

    it('composes the whole flow', async () => {
      await open('1');

      expect(query('app-booking-stepper')).toBeTruthy();
      expect(query('app-date-selector')).toBeTruthy();
      expect(query('app-slot-grid')).toBeTruthy();
      expect(query('app-patient-form')).toBeTruthy();
      expect(query('app-booking-summary')).toBeTruthy();
      expect(query('[data-testid="confirm-appointment"]')).toBeTruthy();
    });

    it('opens on the first day that has a free slot', async () => {
      const page = await open('1');
      const firstFree = page.availability().days.find((day) => day.availableSlotCount > 0)!;

      expect(page.selectedDate()).toBe(firstFree.date);
      expect(page.slotsForSelectedDate().length).toBeGreaterThan(0);
    });

    it('selects no slot until the patient picks one', async () => {
      const page = await open('1');

      expect(page.selectedSlotId()).toBeNull();
      expect(page.selectedSlot()).toBeNull();
    });
  });

  describe('choosing a slot', () => {
    it('records the chosen time', async () => {
      const page = await open('1');
      const slot = page.slotsForSelectedDate().find((candidate) => candidate.isAvailable)!;

      page.selectedSlotId.set(slot.id);

      expect(page.selectedSlot()).toBe(slot);
    });

    it('clears the chosen time when the day changes', async () => {
      const page = await open('1');
      const slot = page.slotsForSelectedDate().find((candidate) => candidate.isAvailable)!;
      page.selectedSlotId.set(slot.id);

      page.selectedDate.set(page.availability().days[1].date);

      expect(page.selectedSlotId()).toBeNull();
      expect(page.selectedSlot()).toBeNull();
    });

    it('does not offer a taken slot for selection', async () => {
      await open('1');
      const disabled = queryAll('.slot:disabled');

      expect(disabled.length).toBeGreaterThan(0);
    });

    it('disables a fully booked day in the date selector', async () => {
      await open('11');

      expect(queryAll('.day:disabled').length).toBe(1);
    });
  });

  describe('the stepper', () => {
    it('starts on choosing a date and time', async () => {
      expect((await open('1')).currentStep()).toBe(0);
    });

    it('moves to patient details once a slot is chosen', async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);

      expect(page.currentStep()).toBe(1);
    });

    it('moves to confirm once the details are valid', async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      page.patient.set(VALID_PATIENT);

      expect(page.currentStep()).toBe(2);
    });
  });

  describe('confirming', () => {
    const readyToConfirm = async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      page.patient.set(VALID_PATIENT);
      return page;
    };

    it('keeps Confirm disabled until a slot and valid details exist', async () => {
      const page = await open('1');
      expect(page.canConfirm()).toBe(false);

      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      expect(page.canConfirm()).toBe(false);

      page.patient.set(VALID_PATIENT);
      expect(page.canConfirm()).toBe(true);
    });

    it('reflects that on the button', async () => {
      await open('1');
      expect(query('[data-testid="confirm-appointment"]')?.hasAttribute('disabled')).toBe(true);

      const page = await readyToConfirm();
      harness.detectChanges();

      expect(page.canConfirm()).toBe(true);
      expect(query('[data-testid="confirm-appointment"]')?.hasAttribute('disabled')).toBe(false);
    });

    it('reports the booking in place, with a reference', async () => {
      const page = await readyToConfirm();

      page.confirm();
      harness.detectChanges();

      expect(page.confirmedResponse()?.status).toBe('confirmed');
      expect(query('[data-testid="booking-confirmed"]')).toBeTruthy();
      expect(query('[data-testid="booking-reference"]')?.textContent).toBe('APT-2026-0001');
    });

    it('names the doctor and the slot in the outcome', async () => {
      const page = await readyToConfirm();
      const slot = page.selectedSlot()!;

      page.confirm();
      harness.detectChanges();

      expect(text()).toContain('Dr. Asha Verma');
      expect(text()).toContain(slot.startsAt);
    });

    it('replaces the form rather than navigating away', async () => {
      const page = await readyToConfirm();

      page.confirm();
      harness.detectChanges();

      expect(router.url).toBe('/book/1');
      expect(query('app-patient-form')).toBeNull();
      expect(query('[data-testid="confirm-appointment"]')).toBeNull();
    });

    it('offers a way back to the doctor', async () => {
      const page = await readyToConfirm();
      page.confirm();
      harness.detectChanges();

      expect(query('a.btn')?.getAttribute('href')).toBe('/doctors/1');
    });

    it('does nothing but reveal errors when details are missing', async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);

      page.confirm();
      harness.detectChanges();

      expect(page.response()).toBeNull();
      expect(page.submitAttempted()).toBe(true);
      expect(queryAll('.field-error').length).toBeGreaterThan(0);
    });

    it('shows the service’s refusal when a slot has gone', async () => {
      const page = await open('1');
      const taken = page.slotsForSelectedDate().find((s) => !s.isAvailable)!;
      page.selectedSlotId.set(taken.id);
      page.patient.set(VALID_PATIENT);

      page.confirm();
      harness.detectChanges();

      expect(page.rejectionMessage()).toContain('just been taken');
      expect(query('[data-testid="booking-rejected"]')?.getAttribute('role')).toBe('alert');
      // The form stays, so the patient can pick another time.
      expect(query('app-slot-grid')).toBeTruthy();
    });
  });

  describe('the confirmation screen', () => {
    const bookAndConfirm = async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      page.patient.set(VALID_PATIENT);
      const slot = page.selectedSlot()!;

      page.confirm();
      harness.detectChanges();
      return { page, slot };
    };

    it('shows a success indicator', async () => {
      await bookAndConfirm();

      expect(query('[data-testid="booking-confirmed"]')).toBeTruthy();
      expect(text()).toContain('Appointment confirmed');
      expect(query('.tick')).toBeTruthy();
    });

    it('shows every detail the patient needs', async () => {
      const { slot } = await bookAndConfirm();

      expect(query('[data-testid="booking-reference"]')?.textContent).toBe('APT-2026-0001');
      expect(query('[data-testid="confirmed-doctor"]')?.textContent).toContain('Dr. Asha Verma');
      expect(query('[data-testid="confirmed-date"]')?.textContent?.trim()).toBe('Mon 10 Aug 2026');
      expect(query('[data-testid="confirmed-time"]')?.textContent?.trim()).toBe(
        `${slot.startsAt} – ${slot.endsAt}`,
      );
      expect(query('[data-testid="confirmed-patient"]')?.textContent?.trim()).toBe('Ramesh Gupta');
    });

    it('reuses the shared empty state and section rather than a new success component', async () => {
      await bookAndConfirm();

      expect(query('app-booking-confirmation app-empty-state')).toBeTruthy();
      expect(query('app-booking-confirmation app-profile-section')).toBeTruthy();
    });

    it('offers both ways back', async () => {
      await bookAndConfirm();
      const links = queryAll('app-booking-confirmation a.btn').map((link) =>
        link.getAttribute('href'),
      );

      expect(links).toEqual(['/doctors/1', '/doctors']);
    });

    it('hides the whole booking form behind it', async () => {
      await bookAndConfirm();

      expect(query('app-date-selector')).toBeNull();
      expect(query('app-slot-grid')).toBeNull();
      expect(query('app-patient-form')).toBeNull();
      expect(query('app-booking-summary')).toBeNull();
      expect(query('app-booking-stepper')).toBeNull();
    });
  });

  describe('duplicate submission', () => {
    const readyToConfirm = async () => {
      const page = await open('1');
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      page.patient.set(VALID_PATIENT);
      return page;
    };

    it('books once when confirm is called twice in a row', async () => {
      const page = await readyToConfirm();
      const createBooking = vi.spyOn(booking, 'createBooking');

      page.confirm();
      page.confirm();
      page.confirm();

      expect(createBooking).toHaveBeenCalledTimes(1);
      expect(page.confirmedResponse()?.reference).toBe('APT-2026-0001');
    });

    it('books once when the button is double-clicked', async () => {
      await readyToConfirm();
      harness.detectChanges();
      const createBooking = vi.spyOn(booking, 'createBooking');
      const button = query('[data-testid="confirm-appointment"]')!;

      button.click();
      button.click();
      harness.detectChanges();

      expect(createBooking).toHaveBeenCalledTimes(1);
    });

    it('keeps the reference from the first submission', async () => {
      const page = await readyToConfirm();

      page.confirm();
      const first = page.confirmedResponse();
      page.confirm();

      expect(page.confirmedResponse()).toBe(first);
    });

    it('refuses to submit once confirmed, even from a stale handler', async () => {
      const page = await readyToConfirm();
      page.confirm();

      expect(page.canConfirm()).toBe(false);
    });

    it('disables the button while a request is in flight', async () => {
      const page = await readyToConfirm();
      harness.detectChanges();
      expect(page.canConfirm()).toBe(true);

      page.isSubmitting.set(true);
      harness.detectChanges();

      expect(page.canConfirm()).toBe(false);
      expect(query('[data-testid="confirm-appointment"]')?.hasAttribute('disabled')).toBe(true);
      expect(text()).toContain('Booking…');
    });

    it('is not left submitting after a request completes', async () => {
      const page = await readyToConfirm();

      page.confirm();

      expect(page.isSubmitting()).toBe(false);
    });

    it('allows another attempt after a rejection', async () => {
      const page = await open('1');
      const taken = page.slotsForSelectedDate().find((s) => !s.isAvailable)!;
      page.selectedSlotId.set(taken.id);
      page.patient.set(VALID_PATIENT);

      page.confirm();
      expect(page.rejectionMessage()).toBeTruthy();
      expect(page.isSubmitting()).toBe(false);

      // Choosing a free slot and trying again must be allowed.
      page.selectedSlotId.set(page.slotsForSelectedDate().find((s) => s.isAvailable)!.id);
      expect(page.canConfirm()).toBe(true);

      page.confirm();
      expect(page.confirmedResponse()?.status).toBe('confirmed');
    });
  });

  describe('a doctor with no published slots', () => {
    it('says so instead of showing an empty grid', async () => {
      const page = await open('12');

      expect(page.doctor()?.name).toBe('Dr. Ritu Sahani');
      expect(page.hasAvailability()).toBe(false);
      expect(query('[data-testid="no-availability"]')).toBeTruthy();
      expect(query('app-slot-grid')).toBeNull();
      expect(query('[data-testid="confirm-appointment"]')).toBeNull();
    });
  });

  describe('an unbookable id', () => {
    it('renders not-found for an unknown doctor', async () => {
      const page = await open('9999');

      expect(page.doctor()).toBeUndefined();
      expect(query('[data-testid="not-found"]')).toBeTruthy();
      expect(query('app-booking-stepper')).toBeNull();
    });

    it('renders not-found for ids that are not positive integers', async () => {
      for (const id of ['abc', '-1', '0', '1.5', '1e3']) {
        const page = await open(id);

        expect(page.doctor()).toBeUndefined();
        expect(query('[data-testid="not-found"]')).toBeTruthy();
      }
    });

    it('keeps the URL and echoes what was asked for', async () => {
      await open('abc');

      expect(router.url).toBe('/book/abc');
      expect(query('[data-testid="requested-id"]')?.textContent?.trim()).toBe('abc');
    });
  });

  describe('moving between doctors', () => {
    it('re-seeds everything for the new doctor', async () => {
      const first = await open('1');
      first.selectedSlotId.set(first.slotsForSelectedDate().find((s) => s.isAvailable)!.id);

      const second = await open('7');

      expect(second).toBe(first);
      expect(second.doctor()?.name).toBe('Dr. Priya Chaudhary');
      expect(second.selectedSlotId()).toBeNull();
      expect(second.selectedDate()).toBe(booking.getDoctorAvailability(7).days[0].date);
    });
  });
});
