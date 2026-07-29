import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AppointmentHistory } from './appointment-history';
import { BookingService } from '@core/services/booking.service';
import { Appointment, AppointmentStatus } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';

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

describe('AppointmentHistory', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let booking: BookingService;

  const open = () => harness.navigateByUrl('/appointments', AppointmentHistory);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const cards = () =>
    Array.from(harness.routeNativeElement?.querySelectorAll('app-appointment-card') ?? []);
  const references = () =>
    Array.from(harness.routeNativeElement?.querySelectorAll('[data-testid="reference"]') ?? []).map(
      (node) => node.textContent?.trim(),
    );

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'appointments', loadChildren: () => import('../appointments.routes') },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    booking = TestBed.inject(BookingService);
  });

  describe('route loading', () => {
    it('lands /appointments on the history page', async () => {
      const page = await open();

      expect(page).toBeInstanceOf(AppointmentHistory);
      expect(router.url).toBe('/appointments');
    });

    it('titles the tab', async () => {
      await open();

      expect(TestBed.inject(Title).getTitle()).toBe('My Appointments');
    });
  });

  describe('rendering', () => {
    it('shows the heading and the count', async () => {
      const page = await open();

      expect(query('h1')?.textContent?.trim()).toBe('My Appointments');
      expect(query('[data-testid="appointment-count"]')?.textContent).toContain(
        `${page.appointments.length}`,
      );
      expect(text()).toContain('appointments');
    });

    it('renders one card per appointment', async () => {
      const page = await open();

      expect(cards().length).toBe(page.appointments.length);
      expect(query('[data-testid="appointment-list"]')).toBeTruthy();
    });

    it('renders every mock status somewhere in the list', async () => {
      await open();
      const statuses = Array.from(
        harness.routeNativeElement?.querySelectorAll('[data-testid="status"]') ?? [],
      ).map((node) => node.textContent?.trim());

      expect(statuses).toContain('Upcoming');
      expect(statuses).toContain('Completed');
      expect(statuses).toContain('Cancelled');
    });

    it('reads the list from the service', async () => {
      const getHistory = vi.spyOn(booking, 'getAppointmentHistory');

      await open();

      expect(getHistory).toHaveBeenCalled();
    });

    it('is read only — no cancel or reschedule anywhere', async () => {
      await open();

      expect(text()).not.toContain('Cancel appointment');
      expect(text()).not.toContain('Reschedule');
      expect(
        harness.routeNativeElement?.querySelectorAll('app-appointment-card button').length,
      ).toBe(0);
    });
  });

  describe('sorting', () => {
    it('shows upcoming first, then completed, then cancelled', async () => {
      await open();
      const statuses = Array.from(
        harness.routeNativeElement?.querySelectorAll('[data-testid="status"]') ?? [],
      ).map((node) => node.textContent?.trim());

      const order = ['Upcoming', 'Completed', 'Cancelled'];
      const positions = statuses.map((status) => order.indexOf(status!));

      expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    });

    it('shows the newest date first within a status', async () => {
      const page = await open();
      const upcoming = page.appointments.filter((item) => item.status === 'upcoming');

      expect(upcoming.map((item) => item.time.date)).toEqual([
        '2026-08-14',
        '2026-08-12',
        '2026-08-11',
      ]);
    });

    it('does not depend on the order the mock happens to declare', async () => {
      const page = await open();

      // The mock's first entry is a completed one; the page must not lead with it.
      expect(page.appointments[0].status).toBe('upcoming');
    });
  });

  describe('filtering', () => {
    it('starts on All', async () => {
      const page = await open();

      expect(page.filter()).toBe('all');
      expect(page.visibleAppointments().length).toBe(page.appointments.length);
    });

    it('counts what each filter would show', async () => {
      const page = await open();
      const counts = page.counts();

      expect(counts.all).toBe(page.appointments.length);
      expect(counts.upcoming).toBe(3);
      expect(counts.completed).toBe(3);
      expect(counts.cancelled).toBe(2);
      expect(counts.upcoming + counts.completed + counts.cancelled).toBe(counts.all);
    });

    it('narrows the list to one status', async () => {
      const page = await open();

      page.filter.set('cancelled');
      harness.detectChanges();

      expect(cards().length).toBe(2);
      expect(references()).toEqual(['APT-2026-0008', 'APT-2026-0001']);
    });

    it('narrows through the filter buttons', async () => {
      const page = await open();

      query('[data-testid="filter-upcoming"]')!.click();
      harness.detectChanges();

      expect(page.filter()).toBe('upcoming');
      expect(cards().length).toBe(3);
    });

    it('updates the count to say how many of how many', async () => {
      const page = await open();

      page.filter.set('completed');
      harness.detectChanges();

      const count = query('[data-testid="appointment-count"]')?.textContent ?? '';
      expect(count).toContain('3');
      expect(count).toContain(`of ${page.appointments.length}`);
    });

    it('returns to everything when All is chosen again', async () => {
      const page = await open();
      page.filter.set('upcoming');
      harness.detectChanges();

      query('[data-testid="filter-all"]')!.click();
      harness.detectChanges();

      expect(cards().length).toBe(page.appointments.length);
    });

    it('keeps the filter out of the URL', async () => {
      const page = await open();

      page.filter.set('cancelled');
      harness.detectChanges();

      expect(router.url).toBe('/appointments');
    });
  });

  describe('empty states', () => {
    it('says so when the patient has no appointments at all', async () => {
      vi.spyOn(booking, 'getAppointmentHistory').mockReturnValue([]);

      const page = await open();

      expect(page.hasAnyAppointments()).toBe(false);
      expect(query('[data-testid="history-empty"]')).toBeTruthy();
      expect(text()).toContain('No appointments yet');
      expect(query('[data-testid="appointment-list"]')).toBeNull();
      expect(query('app-appointment-status-filter')).toBeNull();
    });

    it('offers a way to start booking from the empty state', async () => {
      vi.spyOn(booking, 'getAppointmentHistory').mockReturnValue([]);
      await open();

      expect(query('a.btn')?.getAttribute('href')).toBe('/doctors');
    });

    it('reuses the shared empty state rather than a new one', async () => {
      vi.spyOn(booking, 'getAppointmentHistory').mockReturnValue([]);
      await open();

      expect(query('app-empty-state')).toBeTruthy();
    });

    it('distinguishes an empty filter from an empty history', async () => {
      vi.spyOn(booking, 'getAppointmentHistory').mockReturnValue([
        appointment('APT-1', '2026-06-01', 'completed'),
      ]);
      const page = await open();

      page.filter.set('cancelled');
      harness.detectChanges();

      expect(page.isFilteredEmpty()).toBe(true);
      expect(query('[data-testid="filter-empty"]')).toBeTruthy();
      expect(query('[data-testid="history-empty"]')).toBeNull();
      // The filter stays, so the patient can get back out.
      expect(query('app-appointment-status-filter')).toBeTruthy();
    });
  });
});
