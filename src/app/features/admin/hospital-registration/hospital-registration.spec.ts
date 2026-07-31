import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { HospitalRegistration } from './hospital-registration';
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { HOSPITAL_TYPES } from '@core/models/hospital.model';
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

describe('HospitalRegistration', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let hospitals: HospitalService;
  let auth: AuthService;

  const open = () => harness.navigateByUrl('/admin/hospitals/new', HospitalRegistration);

  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const testId = (id: string) => query(`[data-testid="${id}"]`);
  const input = (id: string) => testId(id) as HTMLInputElement;
  const save = () => testId('save') as HTMLButtonElement;

  const signInAs = (role: UserRole) => {
    auth.requestOtp('9876543210');
    auth.verifyOtp(MOCK_OTP);
    auth.loginAs(role);
  };

  const type = (id: string, value: string) => {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    harness.detectChanges();
  };

  /** A select is bound to change, not input, so it needs its own helper. */
  const choose = (id: string, value: string) => {
    const field = testId(id) as HTMLSelectElement;
    field.value = value;
    field.dispatchEvent(new Event('change'));
    harness.detectChanges();
  };

  /** Picks the first city through the dropdown, as a user would. */
  const pickCity = () => {
    (query('app-searchable-dropdown input') as HTMLElement).click();
    harness.detectChanges();
    (query('app-searchable-dropdown .dropdown-item') as HTMLElement).click();
    harness.detectChanges();
  };

  /** Every field registration requires; registration number and website are not. */
  const fillValid = () => {
    type('name-input', 'New Care Clinic');
    choose('type-select', 'Clinic');
    type('contact-person-input', 'Asha Verma');
    type('email-input', 'hello@clinic.test');
    type('phone-input', '9876500011');
    pickCity();
    type('address-input', 'Station Road');
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
            component: DoctorComponent,
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
    hospitals = TestBed.inject(HospitalService);
    auth = TestBed.inject(AuthService);
    auth.logout();
    signInAs('admin');
  });

  afterEach(() => auth.logout());

  describe('routing', () => {
    it('loads for an admin', async () => {
      const page = await open();

      expect(page).toBeInstanceOf(HospitalRegistration);
      expect(router.url).toBe('/admin/hospitals/new');
      expect(TestBed.inject(Title).getTitle()).toBe('Register Hospital');
    });

    it('redirects an unauthenticated visitor to login', async () => {
      auth.logout();

      await harness.navigateByUrl('/admin/hospitals/new');

      expect(router.url).toBe('/login?redirect=%2Fadmin%2Fhospitals%2Fnew');
    });

    it('denies a doctor', async () => {
      auth.logout();
      signInAs('doctor');

      await harness.navigateByUrl('/admin/hospitals/new');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('denies a patient', async () => {
      auth.logout();
      signInAs('patient');

      await harness.navigateByUrl('/admin/hospitals/new');

      expect(router.url).toBe('/');
    });
  });

  describe('rendering', () => {
    it('renders every field', async () => {
      await open();

      for (const id of [
        'name-input',
        'type-select',
        'registration-input',
        'website-input',
        'contact-person-input',
        'email-input',
        'phone-input',
        'address-input',
      ]) {
        expect(testId(id)).toBeTruthy();
      }
      expect(query('app-searchable-dropdown')).toBeTruthy();
    });

    it('offers every hospital type', async () => {
      await open();

      const options = Array.from((testId('type-select') as HTMLSelectElement).options).map(
        (option) => option.value,
      );

      expect(options).toEqual(['', ...HOSPITAL_TYPES]);
    });

    it('collects no operational detail — that belongs to the management page', async () => {
      await open();

      // ADR-036: departments, facilities and opening hours are set there, not here.
      for (const id of ['description-input', 'rating-input', 'departments-input']) {
        expect(testId(id)).toBeNull();
      }
    });

    it('offers Save and Cancel', async () => {
      await open();

      expect(save()).toBeTruthy();
      expect(testId('cancel')).toBeTruthy();
    });

    it('reuses the shared dropdown for city and the shared sections', async () => {
      await open();

      expect(query('app-searchable-dropdown')).toBeTruthy();
      expect(harness.routeNativeElement?.querySelectorAll('app-profile-section').length).toBe(3);
    });
  });

  describe('validation', () => {
    it('disables Save on an empty form', async () => {
      await open();

      expect(save().disabled).toBe(true);
    });

    it('requires a name that is not just whitespace', async () => {
      const page = await open();

      type('name-input', '   ');

      expect(page.form.controls.name.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('requires a hospital type', async () => {
      const page = await open();
      fillValid();

      choose('type-select', '');

      expect(page.form.controls.hospitalType.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('requires a contact person that is not just whitespace', async () => {
      const page = await open();
      fillValid();

      type('contact-person-input', '   ');

      expect(page.form.controls.contactPerson.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('requires an email', async () => {
      const page = await open();
      fillValid();

      type('email-input', '');

      expect(page.form.controls.email.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('requires a city', async () => {
      const page = await open();

      type('name-input', 'New Care Clinic');

      expect(page.form.controls.cityId.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('requires an address that is not just whitespace', async () => {
      const page = await open();
      fillValid();

      type('address-input', '   ');

      expect(page.form.controls.addressLine.hasError('required')).toBe(true);
      expect(save().disabled).toBe(true);
    });

    it('enables Save once every required field is given', async () => {
      await open();

      fillValid();

      expect(save().disabled).toBe(false);
    });

    it('rejects a malformed email but accepts a good one', async () => {
      const page = await open();
      fillValid();

      type('email-input', 'not-an-email');
      expect(page.form.controls.email.hasError('email')).toBe(true);
      expect(save().disabled).toBe(true);

      type('email-input', 'hello@clinic.test');
      expect(page.form.controls.email.valid).toBe(true);
      expect(save().disabled).toBe(false);
    });

    it('requires exactly ten digits for the mobile number', async () => {
      const page = await open();
      fillValid();

      for (const bad of ['12345', '98765000112', '98765 0001', 'abcdefghij', '+919876500011']) {
        type('phone-input', bad);
        expect(page.form.controls.contactNumber.hasError('pattern')).toBe(true);
        expect(save().disabled).toBe(true);
      }

      type('phone-input', '9876500011');
      expect(page.form.controls.contactNumber.valid).toBe(true);
      expect(save().disabled).toBe(false);
    });

    it('rejects a malformed website but accepts a full URL', async () => {
      const page = await open();
      fillValid();

      for (const bad of ['clinic', 'clinic.test', 'ftp://clinic.test']) {
        type('website-input', bad);
        expect(page.form.controls.website.hasError('url')).toBe(true);
      }

      type('website-input', 'https://clinic.test');
      expect(page.form.controls.website.valid).toBe(true);
      expect(save().disabled).toBe(false);
    });

    it('keeps the registration number and website optional', async () => {
      const page = await open();

      fillValid();

      expect(page.form.controls.registrationNumber.value).toBe('');
      expect(page.form.controls.website.value).toBe('');
      expect(save().disabled).toBe(false);
    });

    it('stays quiet until a field has been left', async () => {
      await open();
      expect(testId('name-error')).toBeNull();

      input('name-input').dispatchEvent(new Event('blur'));
      harness.detectChanges();

      expect(testId('name-error')).toBeTruthy();
    });

    it('reveals everything missing if Save is reached programmatically', async () => {
      // The button is disabled while invalid, so this is the defensive path.
      const page = await open();

      page.save();
      harness.detectChanges();

      for (const id of [
        'name-error',
        'type-error',
        'contact-person-error',
        'email-error',
        'phone-error',
        'city-error',
        'address-error',
      ]) {
        expect(testId(id)).toBeTruthy();
      }
    });

    it('clears a message once the field is valid', async () => {
      await open();
      input('name-input').dispatchEvent(new Event('blur'));
      harness.detectChanges();
      expect(testId('name-error')).toBeTruthy();

      type('name-input', 'New Care Clinic');

      expect(testId('name-error')).toBeNull();
    });
  });

  describe('saving', () => {
    it('registers the hospital and navigates to the dashboard', async () => {
      const before = hospitals.getHospitals().length;
      await open();
      fillValid();

      save().click();
      await harness.fixture.whenStable();

      expect(hospitals.getHospitals().length).toBe(before + 1);
      expect(router.url).toBe('/admin');
    });

    it('saves the account details it was given', async () => {
      await open();
      fillValid();
      type('registration-input', 'UP/HOSP/2024/0199');
      type('website-input', 'https://clinic.test');

      save().click();
      await harness.fixture.whenStable();

      const created = hospitals.getById(hospitals.getHospitals().at(-1)!.id)!;
      expect(created.name).toBe('New Care Clinic');
      expect(created.hospitalType).toBe('Clinic');
      expect(created.contactPerson).toBe('Asha Verma');
      expect(created.email).toBe('hello@clinic.test');
      expect(created.contactNumber).toBe('9876500011');
      expect(created.registrationNumber).toBe('UP/HOSP/2024/0199');
      expect(created.website).toBe('https://clinic.test');
      expect(created.address.line).toBe('Station Road');
    });

    it('trims values before saving', async () => {
      await open();
      fillValid();
      type('name-input', '  New Care Clinic  ');
      type('contact-person-input', '  Asha Verma  ');
      type('address-input', '  Station Road  ');
      type('registration-input', '  UP/HOSP/2024/0199  ');

      save().click();
      await harness.fixture.whenStable();

      const created = hospitals.getById(hospitals.getHospitals().at(-1)!.id)!;
      expect(created.name).toBe('New Care Clinic');
      expect(created.contactPerson).toBe('Asha Verma');
      expect(created.address.line).toBe('Station Road');
      expect(created.registrationNumber).toBe('UP/HOSP/2024/0199');
    });

    it('leaves the operational profile empty for the management page', async () => {
      await open();
      fillValid();

      save().click();
      await harness.fixture.whenStable();

      // ADR-035: no departments, facilities, opening hours or rating are invented.
      const created = hospitals.getById(hospitals.getHospitals().at(-1)!.id)!;
      expect(created.departments).toEqual([]);
      expect(created.facilities).toEqual([]);
      expect(created.openingHours).toEqual([]);
      expect(created.isOpen24Hours).toBe(false);
      expect(created.rating).toBeUndefined();
      expect(created.description).toBe('');
      expect(created.doctorCount).toBe(0);
    });

    it('does nothing when Save is invoked on an invalid form', async () => {
      const before = hospitals.getHospitals().length;
      const page = await open();

      page.save();
      await harness.fixture.whenStable();

      expect(hospitals.getHospitals().length).toBe(before);
      expect(router.url).toBe('/admin/hospitals/new');
    });

    it('shows the new hospital on the dashboard, with an updated count', async () => {
      const before = hospitals.getHospitals().length;
      await open();
      fillValid();
      save().click();
      await harness.fixture.whenStable();

      const dashboard = await harness.navigateByUrl('/admin', AdminDashboard);
      harness.detectChanges();

      expect(dashboard.hospitals().length).toBe(before + 1);
      expect(harness.routeNativeElement?.textContent).toContain('New Care Clinic');
      const counts = Array.from(
        harness.routeNativeElement?.querySelectorAll('[data-testid="stat-value"]') ?? [],
      ).map((node) => node.textContent?.trim());
      expect(counts[1]).toBe(`${before + 1}`);
    });
  });

  describe('cancelling', () => {
    it('navigates to the dashboard without saving', async () => {
      const before = hospitals.getHospitals().length;
      await open();
      fillValid();

      (testId('cancel') as HTMLElement).click();
      await harness.fixture.whenStable();

      expect(hospitals.getHospitals().length).toBe(before);
      expect(router.url).toBe('/admin');
    });
  });
});
