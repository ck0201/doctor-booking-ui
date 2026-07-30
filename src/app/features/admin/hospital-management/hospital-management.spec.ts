import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { HospitalManagement } from './hospital-management';
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { HospitalService } from '@core/services/hospital.service';
import { AuthService, MOCK_OTP } from '@core/services/auth.service';
import { roleGuard } from '@core/guards/auth.guard';
import { UserRole } from '@core/models/auth.model';

@Component({ selector: 'test-landing', template: 'landing' })
class LandingComponent {}

@Component({ selector: 'test-login', template: 'login' })
class LoginComponent {}

@Component({ selector: 'test-doctor', template: 'doctor' })
class DoctorComponent {}

describe('HospitalManagement', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let hospitals: HospitalService;
  let auth: AuthService;

  /** Hospital 1 opens every day; hospital 3 is 24 hours with no windows. */
  const open = (id = '1') =>
    harness.navigateByUrl(`/admin/hospitals/${id}/manage`, HospitalManagement);

  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const testId = (id: string) => query(`[data-testid="${id}"]`);
  const chips = (list: string) =>
    Array.from(testId(list)?.querySelectorAll('.chip') ?? []).map((chip) =>
      chip.textContent?.replace(/\s*×\s*$/, '').trim(),
    );

  const signInAs = (role: UserRole) => {
    auth.requestOtp('9876543210');
    auth.verifyOtp(MOCK_OTP);
    auth.loginAs(role);
  };

  const type = (id: string, value: string) => {
    const field = testId(id) as HTMLInputElement;
    field.value = value;
    field.dispatchEvent(new Event('input'));
    harness.detectChanges();
  };

  const click = (id: string) => {
    (testId(id) as HTMLElement).click();
    harness.detectChanges();
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', component: LandingComponent },
            { path: 'login', component: LoginComponent },
            {
              path: 'doctor/dashboard',
              canActivate: [roleGuard('doctor')],
              component: DoctorComponent,
            },
            {
              path: 'admin',
              canActivate: [roleGuard('admin')],
              loadChildren: () => import('../admin.routes'),
            },
          ],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    hospitals = TestBed.inject(HospitalService);
    auth = TestBed.inject(AuthService);
    auth.logout();
    signInAs('admin');
  });

  afterEach(() => auth.logout());

  describe('routing', () => {
    it('loads for an admin', async () => {
      const page = await open();

      expect(page).toBeInstanceOf(HospitalManagement);
      expect(router.url).toBe('/admin/hospitals/1/manage');
      expect(TestBed.inject(Title).getTitle()).toBe('Manage Hospital');
    });

    it('redirects an unauthenticated visitor to login', async () => {
      auth.logout();

      await harness.navigateByUrl('/admin/hospitals/1/manage');

      expect(router.url).toContain('/login');
    });

    it('denies a doctor', async () => {
      auth.logout();
      signInAs('doctor');

      await harness.navigateByUrl('/admin/hospitals/1/manage');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('denies a patient', async () => {
      auth.logout();
      signInAs('patient');

      await harness.navigateByUrl('/admin/hospitals/1/manage');

      expect(router.url).toBe('/');
    });

    it('renders not-found for an unknown hospital', async () => {
      const page = await open('9999');

      expect(page.isNotFound()).toBe(true);
      expect(testId('not-found')).toBeTruthy();
      expect(testId('opening-hours')).toBeNull();
    });
  });

  describe('loading the hospital', () => {
    it('shows the summary', async () => {
      await open();

      expect(testId('hospital-name')?.textContent?.trim()).toBe('Sanjeevani Heart Centre');
      expect(testId('hospital-city')?.textContent?.trim()).toBe('Deoria');
      expect(testId('hospital-address')?.textContent).toContain('Civil Lines');
      expect(query('app-rating-stars')).toBeTruthy();
    });

    it('shows all seven days', async () => {
      const page = await open();

      expect(page.days().map((row) => row.label)).toEqual([
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ]);
    });

    it('seeds the existing hours, converted to input values', async () => {
      const page = await open();
      const monday = page.days()[0];

      // Hospital 1 opens 08:00 AM – 09:00 PM every day.
      expect(monday.closed).toBe(false);
      expect(monday.opensAt).toBe('08:00');
      expect(monday.closesAt).toBe('21:00');
    });

    it('marks days with no window as closed', async () => {
      // Hospital 6 is Mon – Fri only.
      const page = await open('6');

      expect(page.days().find((row) => row.day === 'Sat')?.closed).toBe(true);
      expect(page.days().find((row) => row.day === 'Mon')?.closed).toBe(false);
    });

    it('seeds the existing departments and facilities', async () => {
      await open();

      expect(chips('department-list')).toEqual(['Cardiologist', 'General Physician']);
      expect(chips('facility-list')).toContain('ICU');
    });

    it('frames the three sections with the shared component', async () => {
      await open();
      const titles = Array.from(
        harness.routeNativeElement?.querySelectorAll('.section-title') ?? [],
      ).map((node) => node.textContent?.trim());

      expect(titles).toEqual(['Opening Hours', 'Departments', 'Facilities']);
    });
  });

  describe('opening hours', () => {
    it('disables both times when a day is closed', async () => {
      await open();
      expect((testId('opens-Mon') as HTMLInputElement).disabled).toBe(false);

      click('closed-Mon');

      expect((testId('opens-Mon') as HTMLInputElement).disabled).toBe(true);
      expect((testId('closes-Mon') as HTMLInputElement).disabled).toBe(true);
    });

    it('re-enables them when reopened', async () => {
      await open();
      click('closed-Mon');
      click('closed-Mon');

      expect((testId('opens-Mon') as HTMLInputElement).disabled).toBe(false);
    });

    it('rejects an open time that is not before the close time', async () => {
      const page = await open();

      type('opens-Mon', '18:00');
      type('closes-Mon', '09:00');

      expect(page.invalidDays().map((row) => row.day)).toEqual(['Mon']);
      expect(testId('error-Mon')).toBeTruthy();
      expect((testId('save') as HTMLButtonElement).disabled).toBe(true);
    });

    it('rejects equal open and close times', async () => {
      const page = await open();

      type('opens-Mon', '09:00');
      type('closes-Mon', '09:00');

      expect(page.invalidDays().length).toBe(1);
    });

    it('accepts a valid interval', async () => {
      const page = await open();

      type('opens-Mon', '08:30');
      type('closes-Mon', '17:30');

      expect(page.invalidDays()).toEqual([]);
      expect((testId('save') as HTMLButtonElement).disabled).toBe(false);
    });

    it('ignores the times of a closed day', async () => {
      const page = await open();
      type('opens-Mon', '18:00');
      type('closes-Mon', '09:00');
      expect(page.invalidDays().length).toBe(1);

      click('closed-Mon');

      expect(page.invalidDays()).toEqual([]);
      expect((testId('save') as HTMLButtonElement).disabled).toBe(false);
    });
  });

  describe('departments', () => {
    it('adds one', async () => {
      await open();

      type('department-input', 'Neurologist');
      click('add-department');

      expect(chips('department-list')).toContain('Neurologist');
      expect((testId('department-input') as HTMLInputElement).value).toBe('');
    });

    it('trims before adding', async () => {
      await open();

      type('department-input', '  Neurologist  ');
      click('add-department');

      expect(chips('department-list')).toContain('Neurologist');
    });

    it('refuses a blank name', async () => {
      const page = await open();
      const before = page.departments().length;

      type('department-input', '   ');
      click('add-department');

      expect(page.departments().length).toBe(before);
      expect(testId('department-error')?.textContent).toContain('Enter a department');
    });

    it('ignores a duplicate, whatever the case', async () => {
      const page = await open();
      const before = page.departments().length;

      type('department-input', 'cardiologist');
      click('add-department');

      expect(page.departments().length).toBe(before);
      expect(testId('department-error')?.textContent).toContain('already listed');
    });

    it('removes one', async () => {
      await open();

      click('remove-department-Cardiologist');

      expect(chips('department-list')).not.toContain('Cardiologist');
    });

    it('stops at thirty', async () => {
      const page = await open();
      page.departments.set(Array.from({ length: 30 }, (_, index) => `Dept ${index}`));
      harness.detectChanges();

      type('department-input', 'One Too Many');
      click('add-department');

      expect(page.departments().length).toBe(30);
      expect(testId('department-error')?.textContent).toContain('No more than 30');
    });
  });

  describe('facilities', () => {
    it('adds one', async () => {
      await open();

      type('facility-input', 'Cafeteria');
      click('add-facility');

      expect(chips('facility-list')).toContain('Cafeteria');
    });

    it('ignores a duplicate, whatever the case', async () => {
      const page = await open();
      const before = page.facilities().length;

      type('facility-input', 'icu');
      click('add-facility');

      expect(page.facilities().length).toBe(before);
      expect(testId('facility-error')?.textContent).toContain('already listed');
    });

    it('refuses a blank name', async () => {
      const page = await open();
      const before = page.facilities().length;

      type('facility-input', '  ');
      click('add-facility');

      expect(page.facilities().length).toBe(before);
    });

    it('removes one', async () => {
      await open();

      click('remove-facility-ICU');

      expect(chips('facility-list')).not.toContain('ICU');
    });

    it('stops at thirty', async () => {
      const page = await open();
      page.facilities.set(Array.from({ length: 30 }, (_, index) => `Facility ${index}`));
      harness.detectChanges();

      type('facility-input', 'One Too Many');
      click('add-facility');

      expect(page.facilities().length).toBe(30);
      expect(testId('facility-error')?.textContent).toContain('No more than 30');
    });
  });

  describe('saving', () => {
    it('writes the three sections and navigates to the dashboard', async () => {
      await open();
      type('department-input', 'Neurologist');
      click('add-department');
      type('facility-input', 'Cafeteria');
      click('add-facility');
      click('closed-Sun');

      click('save');
      await harness.fixture.whenStable();

      const saved = hospitals.getById(1)!;
      expect(saved.departments.map((department) => department.name)).toContain('Neurologist');
      expect(saved.facilities).toContain('Cafeteria');
      expect(saved.openingHours.some((window) => window.days.includes('Sun'))).toBe(false);
      expect(router.url).toBe('/admin');
    });

    it('stores one window per open day, in display time', async () => {
      await open('6');
      type('opens-Mon', '08:30');
      type('closes-Mon', '13:00');

      click('save');
      await harness.fixture.whenStable();

      const monday = hospitals.getById(6)!.openingHours.find((w) => w.days.includes('Mon'))!;
      expect(monday).toEqual({ days: ['Mon'], opensAt: '08:30 AM', closesAt: '01:00 PM' });
    });

    it('does nothing while a day is invalid', async () => {
      const page = await open();
      const before = hospitals.getById(1)!.departments.length;
      type('opens-Mon', '18:00');
      type('closes-Mon', '09:00');

      page.save();
      await harness.fixture.whenStable();

      expect(hospitals.getById(1)!.departments.length).toBe(before);
      expect(router.url).toBe('/admin/hospitals/1/manage');
    });

    it('leaves the dashboard showing the updated hospital', async () => {
      await open();
      type('department-input', 'Neurologist');
      click('add-department');
      click('save');
      await harness.fixture.whenStable();

      const dashboard = await harness.navigateByUrl('/admin', AdminDashboard);
      harness.detectChanges();

      expect(
        dashboard
          .hospitals()
          .find((hospital) => hospital.id === 1)!
          .departments.map((department) => department.name),
      ).toContain('Neurologist');
    });
  });

  describe('cancelling', () => {
    it('discards every change and navigates away', async () => {
      await open();
      const before = hospitals.getById(1)!;
      type('department-input', 'Neurologist');
      click('add-department');
      type('facility-input', 'Cafeteria');
      click('add-facility');
      click('closed-Mon');

      click('cancel');
      await harness.fixture.whenStable();

      expect(hospitals.getById(1)).toBe(before);
      expect(router.url).toBe('/admin');
    });
  });
});
