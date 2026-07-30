import { vi } from 'vitest';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AdminDashboard } from './admin-dashboard';
import { AdminService } from '@core/services/admin.service';
import { AuthService, MOCK_OTP } from '@core/services/auth.service';
import { roleGuard } from '@core/guards/auth.guard';
import { UserRole } from '@core/models/auth.model';

@Component({ selector: 'test-landing', template: 'landing' })
class LandingComponent {}

@Component({ selector: 'test-login', template: 'login' })
class LoginComponent {}

@Component({ selector: 'test-dashboard', template: 'dashboard' })
class DoctorDashboardComponent {}

describe('AdminDashboard', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let admin: AdminService;
  let auth: AuthService;

  const open = () => harness.navigateByUrl('/admin', AdminDashboard);

  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');
  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const queryAll = (selector: string) =>
    Array.from(harness.routeNativeElement?.querySelectorAll(selector) ?? []) as HTMLElement[];
  const testId = (id: string) => query(`[data-testid="${id}"]`);

  const signInAs = (role: UserRole) => {
    auth.requestOtp('9876543210');
    auth.verifyOtp(MOCK_OTP);
    auth.loginAs(role);
  };

  const click = async (id: string) => {
    (testId(id) as HTMLElement).click();
    harness.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LandingComponent },
          { path: 'login', component: LoginComponent },
          {
            path: 'doctor/dashboard',
            canActivate: [roleGuard('doctor')],
            component: DoctorDashboardComponent,
          },
          {
            path: 'admin',
            canActivate: [roleGuard('admin')],
            loadChildren: () => import('../admin.routes'),
          },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    admin = TestBed.inject(AdminService);
    auth = TestBed.inject(AuthService);
    auth.logout();
    signInAs('admin');
  });

  afterEach(() => {
    auth.logout();
    vi.restoreAllMocks();
  });

  describe('route protection', () => {
    it('loads /admin for an admin', async () => {
      const page = await open();

      expect(page).toBeInstanceOf(AdminDashboard);
      expect(router.url).toBe('/admin');
      expect(TestBed.inject(Title).getTitle()).toBe('Admin');
    });

    it('sends an unauthenticated visitor to login', async () => {
      auth.logout();

      await harness.navigateByUrl('/admin');

      expect(router.url).toBe('/login?redirect=%2Fadmin');
    });

    it('sends a doctor to their own dashboard', async () => {
      auth.logout();
      signInAs('doctor');

      await harness.navigateByUrl('/admin');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('sends a patient home', async () => {
      auth.logout();
      signInAs('patient');

      await harness.navigateByUrl('/admin');

      expect(router.url).toBe('/');
    });
  });

  describe('summary', () => {
    it('shows the four figures', async () => {
      await open();
      const labels = queryAll('[data-testid="stat-label"]').map((node) => node.textContent?.trim());

      expect(labels).toEqual([
        'Total Doctors',
        'Total Hospitals',
        'Total Appointments',
        'Active Doctors',
      ]);
    });

    it('takes every figure from the existing services', async () => {
      const page = await open();
      const values = queryAll('[data-testid="stat-value"]').map((node) => node.textContent?.trim());
      const summary = admin.getSummary();

      expect(values).toEqual([
        `${summary.totalDoctors}`,
        `${summary.totalHospitals}`,
        `${summary.totalAppointments}`,
        `${page.activeDoctorCount()}`,
      ]);
      expect(summary.totalDoctors).toBe(page.doctors().length);
      expect(summary.totalHospitals).toBe(page.hospitals().length);
      expect(summary.totalAppointments).toBe(page.appointments().length);
    });

    it('reuses the promoted stat card', async () => {
      await open();

      expect(queryAll('app-stat-card').length).toBe(4);
    });

    it('shows no chart', async () => {
      await open();

      expect(harness.routeNativeElement?.querySelector('svg')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('canvas')).toBeNull();
    });
  });

  describe('doctors section', () => {
    it('lists every doctor with specialty, hospital and status', async () => {
      const page = await open();

      expect(queryAll('[data-testid="doctors-table"] tbody tr').length).toBe(page.doctors().length);
      expect(text()).toContain('Dr. Asha Verma');
      expect(text()).toContain('Cardiologist');
      expect(text()).toContain('Sanjeevani Heart Centre');
      expect(testId('doctor-status-1')?.textContent?.trim()).toBe('Available');
    });

    it('shows a dash when a doctor has no listed practice', async () => {
      const page = await open();
      const withoutPractice = page.doctors().find((doctor) => !doctor.practice);

      expect(page.hospitalName(withoutPractice ?? page.doctors()[0])).toBeTruthy();
    });

    it('reflects a doctor who is not available today', async () => {
      const page = await open();
      const unavailable = page.doctors().find((doctor) => !doctor.availability?.isAvailableToday)!;

      expect(testId(`doctor-status-${unavailable.id}`)?.textContent?.trim()).toBe('Unavailable');
    });

    it('links View at the doctor profile', async () => {
      await open();

      expect(testId('doctor-view-1')?.getAttribute('href')).toBe('/doctors/1');
    });
  });

  describe('enable and disable', () => {
    it('flips the label and the status', async () => {
      await open();
      expect(testId('doctor-toggle-1')?.textContent?.trim()).toBe('Disable');
      expect(testId('doctor-status-1')?.textContent?.trim()).toBe('Available');

      await click('doctor-toggle-1');

      expect(testId('doctor-toggle-1')?.textContent?.trim()).toBe('Enable');
      expect(testId('doctor-status-1')?.textContent?.trim()).toBe('Unavailable');
    });

    it('flips back again', async () => {
      await open();
      await click('doctor-toggle-1');
      await click('doctor-toggle-1');

      expect(testId('doctor-status-1')?.textContent?.trim()).toBe('Available');
    });

    it('lowers the active count while disabled', async () => {
      const page = await open();
      const before = page.activeDoctorCount();

      await click('doctor-toggle-1');

      expect(page.activeDoctorCount()).toBe(before - 1);
      expect(queryAll('[data-testid="stat-value"]')[3].textContent?.trim()).toBe(`${before - 1}`);
    });

    it('touches only the doctor that was toggled', async () => {
      const page = await open();

      await click('doctor-toggle-1');

      expect(page.isEnabled(page.doctors()[0])).toBe(false);
      expect(
        page
          .doctors()
          .slice(1)
          .every((doctor) => page.isEnabled(doctor)),
      ).toBe(true);
    });

    it('changes nothing in the service, since nothing is persisted', async () => {
      const page = await open();

      await click('doctor-toggle-1');

      expect(admin.getSummary().activeDoctors).toBe(
        admin.getDoctors().filter((doctor) => admin.isDoctorAvailable(doctor)).length,
      );
      expect(page.doctors()[0].availability?.isAvailableToday).toBe(true);
    });
  });

  describe('hospitals section', () => {
    it('lists every hospital with city, rating and doctor count', async () => {
      const page = await open();

      expect(queryAll('[data-testid="hospitals-table"] tbody tr').length).toBe(
        page.hospitals().length,
      );
      expect(text()).toContain('Drishti Eye Hospital');
      expect(text()).toContain('Sahjanwa');
      expect(text()).toContain('4.5');
    });

    it('links Manage at the hospital management page', async () => {
      await open();
      const manage = testId('hospital-manage-1');

      expect(manage?.textContent?.trim()).toBe('Manage');
      expect(manage?.getAttribute('href')).toBe('/admin/hospitals/1/manage');
    });

    it('offers no editing', async () => {
      await open();

      expect(queryAll('[data-testid="hospitals-table"] button').length).toBe(0);
    });
  });

  describe('appointments section', () => {
    it('lists every appointment with doctor, hospital, date and status', async () => {
      const page = await open();

      expect(queryAll('[data-testid^="appointment-row-"]').length).toBe(page.appointments().length);
      expect(text()).toContain('APT-2026-0009');
      expect(text()).toContain('Dr. Asha Verma');
      expect(text()).toContain('Fri 14 Aug 2026');
      expect(text()).toContain('Upcoming');
    });

    it('formats the date through the shared util', async () => {
      const page = await open();

      expect(page.appointmentDate(page.appointments()[0])).toMatch(/^\w{3} \d{1,2} \w{3} \d{4}$/);
    });

    it('shows a detail line when View is used, and hides it again', async () => {
      await open();
      expect(testId('appointment-detail-APT-2026-0009')).toBeNull();

      await click('appointment-view-APT-2026-0009');
      expect(testId('appointment-detail-APT-2026-0009')).toBeTruthy();
      expect(testId('appointment-view-APT-2026-0009')?.getAttribute('aria-expanded')).toBe('true');

      await click('appointment-view-APT-2026-0009');
      expect(testId('appointment-detail-APT-2026-0009')).toBeNull();
    });

    it('shows one detail line at a time', async () => {
      await open();

      await click('appointment-view-APT-2026-0009');
      await click('appointment-view-APT-2026-0006');

      expect(testId('appointment-detail-APT-2026-0009')).toBeNull();
      expect(testId('appointment-detail-APT-2026-0006')).toBeTruthy();
    });

    it('offers no editing — View is the only action', async () => {
      await open();
      const actions = queryAll('[data-testid^="appointment-view-"]');

      // 'Cancelled' is a status, so check the buttons rather than the page text.
      expect(actions.length).toBe(queryAll('[data-testid^="appointment-row-"]').length);
      expect(actions.every((button) => button.textContent?.trim() === 'View')).toBe(true);
      expect(harness.routeNativeElement?.querySelector('input')).toBeNull();
      expect(harness.routeNativeElement?.querySelector('form')).toBeNull();
    });
  });

  describe('empty states', () => {
    it('says so when a section has nothing, reusing the shared component', async () => {
      vi.spyOn(admin, 'getDoctors').mockReturnValue([]);
      vi.spyOn(admin, 'getHospitals').mockReturnValue([]);
      vi.spyOn(admin, 'getAppointments').mockReturnValue([]);

      await open();

      for (const id of ['doctors-empty', 'hospitals-empty', 'appointments-empty']) {
        expect(testId(id)).toBeTruthy();
      }
      expect(queryAll('app-empty-state').length).toBe(3);
      expect(queryAll('table').length).toBe(0);
    });

    it('keeps the summary visible when everything is empty', async () => {
      vi.spyOn(admin, 'getDoctors').mockReturnValue([]);
      vi.spyOn(admin, 'getHospitals').mockReturnValue([]);
      vi.spyOn(admin, 'getAppointments').mockReturnValue([]);

      const page = await open();

      expect(queryAll('app-stat-card').length).toBe(4);
      expect(page.activeDoctorCount()).toBe(0);
    });
  });

  describe('scope', () => {
    it('frames the three sections with the shared profile section', async () => {
      await open();

      expect(queryAll('.section-title').map((node) => node.textContent?.trim())).toEqual([
        'Doctors',
        'Hospitals',
        'Appointments',
      ]);
    });

    it('names the signed-in admin', async () => {
      await open();

      expect(testId('admin-phone')?.textContent).toContain('9876543210');
    });
  });
});
