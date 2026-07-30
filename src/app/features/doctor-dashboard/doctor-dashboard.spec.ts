import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { DoctorDashboard } from './doctor-dashboard';
import { DoctorDashboardService } from '@core/services/doctor-dashboard.service';

describe('DoctorDashboard', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let dashboard: DoctorDashboardService;

  const open = () => harness.navigateByUrl('/doctor/dashboard', DoctorDashboard);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const queryAll = (selector: string) =>
    Array.from(harness.routeNativeElement?.querySelectorAll(selector) ?? []) as HTMLElement[];

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: 'doctor', loadChildren: () => import('./doctor-dashboard.routes') },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    dashboard = TestBed.inject(DoctorDashboardService);
  });

  describe('the route', () => {
    it('lands /doctor/dashboard on the dashboard', async () => {
      const page = await open();

      expect(page).toBeInstanceOf(DoctorDashboard);
      expect(router.url).toBe('/doctor/dashboard');
    });

    it('titles the tab', async () => {
      await open();

      expect(TestBed.inject(Title).getTitle()).toBe('Doctor Dashboard');
    });
  });

  describe('the welcome section', () => {
    it('greets the signed-in doctor', async () => {
      const page = await open();

      expect(query('h1')?.textContent).toContain('Welcome back');
      expect(query('h1')?.textContent).toContain(page.doctor!.name);
    });

    it('says which day it is reporting on', async () => {
      await open();

      expect(query('[data-testid="today"]')?.textContent?.trim()).toBe('Mon 10 Aug 2026');
    });

    it('still greets when the doctor cannot be resolved', async () => {
      vi.spyOn(dashboard, 'getDoctor').mockReturnValue(undefined);

      await open();

      expect(query('h1')?.textContent?.trim()).toBe('Welcome back');
    });
  });

  describe('the summary cards', () => {
    it('shows four of them', async () => {
      await open();

      expect(queryAll('app-stat-card').length).toBe(4);
      expect(query('[data-testid="summary-cards"]')).toBeTruthy();
    });

    it('labels the four figures the brief asks for', async () => {
      await open();
      const labels = queryAll('[data-testid="stat-label"]').map((node) => node.textContent?.trim());

      expect(labels).toEqual([
        "Today's appointments",
        'Upcoming appointments',
        'Completed today',
        'Available slots remaining',
      ]);
    });

    it('takes every figure from the service', async () => {
      const page = await open();
      const values = queryAll('[data-testid="stat-value"]').map((node) => node.textContent?.trim());
      const summary = page.summary;

      expect(values).toEqual([
        `${summary.todayCount}`,
        `${summary.upcomingCount}`,
        `${summary.completedTodayCount}`,
        `${summary.availableSlotsRemaining}`,
      ]);
    });

    it('shows no chart', async () => {
      await open();

      expect(harness.routeNativeElement?.querySelector('svg')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
    });
  });

  describe("today's appointments", () => {
    it('renders one row per appointment, in the service’s order', async () => {
      const page = await open();

      expect(queryAll('app-dashboard-appointment-row').length).toBe(page.appointments.length);
      expect(queryAll('[data-testid="time"]').map((node) => node.textContent?.trim())).toEqual(
        page.appointments.map(
          (appointment) => appointment.time.startsAt + ' – ' + appointment.time.endsAt,
        ),
      );
    });

    it('shows the patient, reference and status on each row', async () => {
      await open();

      expect(text()).toContain('Meena Kumari');
      expect(text()).toContain('APT-2026-0034');
      expect(text()).toContain('In Progress');
      expect(text()).toContain('Completed');
      expect(text()).toContain('Upcoming');
    });

    it('offers no way to act on a row', async () => {
      await open();

      expect(queryAll('app-dashboard-appointment-row button').length).toBe(0);
      expect(queryAll('app-dashboard-appointment-row a').length).toBe(0);
      expect(text()).not.toContain('Reschedule');
      expect(text()).not.toContain('Cancel');
    });

    it('says so when the day is empty, reusing the shared empty state', async () => {
      vi.spyOn(dashboard, 'getTodayAppointments').mockReturnValue([]);

      const page = await open();

      expect(page.hasAppointments()).toBe(false);
      expect(query('[data-testid="appointments-empty"]')).toBeTruthy();
      expect(query('app-empty-state')).toBeTruthy();
      expect(text()).toContain('No appointments today');
      expect(query('[data-testid="appointment-list"]')).toBeNull();
    });

    it('keeps the availability panel when the day is empty', async () => {
      vi.spyOn(dashboard, 'getTodayAppointments').mockReturnValue([]);
      await open();

      expect(query('app-availability-panel')).toBeTruthy();
    });
  });

  describe('availability', () => {
    it('shows the published hours, duration and state', async () => {
      await open();

      expect(query('[data-testid="working-hours"]')?.textContent?.trim()).toBe(
        '09:00 AM – 05:00 PM',
      );
      expect(query('[data-testid="slot-duration"]')?.textContent?.trim()).toBe('30 minutes');
      expect(query('[data-testid="availability-state"]')?.textContent?.trim()).toBe('Available');
    });

    it('seeds the toggle from the service', async () => {
      const page = await open();

      expect(page.isAvailableToday()).toBe(dashboard.getAvailability().isAvailableToday);
    });

    it('flips on click, and back again', async () => {
      const page = await open();

      query('[data-testid="availability-toggle"]')!.click();
      harness.detectChanges();

      expect(page.isAvailableToday()).toBe(false);
      expect(query('[data-testid="availability-state"]')?.textContent?.trim()).toBe('Unavailable');

      query('[data-testid="availability-toggle"]')!.click();
      harness.detectChanges();

      expect(page.isAvailableToday()).toBe(true);
    });

    it('changes nothing outside the page', async () => {
      const page = await open();

      query('[data-testid="availability-toggle"]')!.click();
      harness.detectChanges();

      expect(page.isAvailableToday()).toBe(false);
      // The service still reports what it always reported.
      expect(dashboard.getAvailability().isAvailableToday).toBe(true);
    });

    it('does not touch the summary figures', async () => {
      const page = await open();
      const before = queryAll('[data-testid="stat-value"]').map((node) => node.textContent);

      query('[data-testid="availability-toggle"]')!.click();
      harness.detectChanges();

      expect(queryAll('[data-testid="stat-value"]').map((node) => node.textContent)).toEqual(
        before,
      );
      expect(page.summary.availableSlotsRemaining).toBe(
        dashboard.getDashboardSummary().availableSlotsRemaining,
      );
    });

    it('offers exactly one control on the whole page', async () => {
      await open();

      expect(queryAll('button').length).toBe(1);
      expect(queryAll('button')[0].getAttribute('data-testid')).toBe('availability-toggle');
    });
  });

  describe('scope', () => {
    it('frames both panels with the shared profile section', async () => {
      await open();
      const titles = queryAll('.section-title').map((node) => node.textContent?.trim());

      expect(titles).toEqual(["Today's appointments", 'Availability']);
    });

    it('shows none of the things this dashboard is not', async () => {
      await open();

      for (const absent of ['Prescription', 'Notes', 'Video', 'Message', 'Calendar']) {
        expect(text()).not.toContain(absent);
      }
    });
  });
});
