import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { DoctorRegistration } from './doctor-registration';
import { AdminDashboard } from '../admin-dashboard/admin-dashboard';
import { DoctorService } from '@core/services/doctor.service';
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

describe('DoctorRegistration', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let doctors: DoctorService;
  let hospitals: HospitalService;
  let auth: AuthService;

  const open = () => harness.navigateByUrl('/admin/doctors/new', DoctorRegistration);

  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const testId = (id: string) => query(`[data-testid="${id}"]`);
  const save = () => testId('save') as HTMLButtonElement;

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

  const selectHospital = (id: number) => {
    const select = testId('hospital-select') as HTMLSelectElement;
    select.value = String(id);
    select.dispatchEvent(new Event('change'));
    harness.detectChanges();
  };

  const selectFirstSpecialty = (page: DoctorRegistration) => {
    page.form.controls.specialtyId.setValue(page.departments()[0].id);
    harness.detectChanges();
  };

  /** Name + hospital + specialty is the minimum a valid form needs. */
  const fillValid = (page: DoctorRegistration, hospitalId = 1) => {
    type('name-input', 'Dr. New Doctor');
    selectHospital(hospitalId);
    selectFirstSpecialty(page);
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
    doctors = TestBed.inject(DoctorService);
    hospitals = TestBed.inject(HospitalService);
    auth = TestBed.inject(AuthService);
    auth.logout();
    signInAs('admin');
  });

  afterEach(() => auth.logout());

  describe('routing', () => {
    it('loads for an admin', async () => {
      expect(await open()).toBeInstanceOf(DoctorRegistration);
      expect(router.url).toBe('/admin/doctors/new');
    });

    it('redirects an unauthenticated visitor to login', async () => {
      auth.logout();

      await harness.navigateByUrl('/admin/doctors/new');

      expect(router.url).toContain('/login');
    });

    it('denies a doctor', async () => {
      auth.logout();
      signInAs('doctor');

      await harness.navigateByUrl('/admin/doctors/new');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('denies a patient', async () => {
      auth.logout();
      signInAs('patient');

      await harness.navigateByUrl('/admin/doctors/new');

      expect(router.url).toBe('/');
    });
  });

  describe('the form', () => {
    it('lists every hospital to choose from', async () => {
      const page = await open();

      expect(testId('hospital-select')?.querySelectorAll('option').length).toBe(
        page.hospitals().length + 1,
      );
    });

    it('offers no specialties until a hospital is chosen', async () => {
      const page = await open();

      expect(page.departments()).toEqual([]);
      expect((testId('specialty-select') as HTMLSelectElement).disabled).toBe(true);
    });

    it('offers only the chosen hospital’s departments', async () => {
      const page = await open();

      selectHospital(1);

      expect(page.departments()).toEqual(hospitals.getById(1)!.departments);
      expect(page.departments().map((d) => d.name)).toEqual(['Cardiologist', 'General Physician']);
    });

    it('re-scopes the specialties when the hospital changes', async () => {
      const page = await open();
      selectHospital(1);
      selectFirstSpecialty(page);

      selectHospital(4);

      expect(page.departments()).toEqual(hospitals.getById(4)!.departments);
      // The previous choice does not exist here, so it is cleared.
      expect(page.form.controls.specialtyId.value).toBeNull();
    });

    it('blocks a hospital with no departments and says why', async () => {
      const page = await open();
      hospitals.updateHospitalProfile(1, {
        openingHours: [],
        departmentNames: [],
        facilityNames: [],
      });

      selectHospital(1);

      expect(page.hasNoDepartments()).toBe(true);
      expect(testId('no-departments')).toBeTruthy();
      expect(save().disabled).toBe(true);
    });
  });

  describe('validation', () => {
    it('disables Save until name, hospital and specialty are given', async () => {
      const page = await open();
      expect(save().disabled).toBe(true);

      type('name-input', 'Dr. New Doctor');
      expect(save().disabled).toBe(true);

      selectHospital(1);
      expect(save().disabled).toBe(true);

      selectFirstSpecialty(page);
      expect(save().disabled).toBe(false);
    });

    it('rejects a whitespace-only name', async () => {
      const page = await open();
      fillValid(page);

      type('name-input', '   ');

      expect(save().disabled).toBe(true);
    });

    it('rejects negative experience, a non-positive fee and a bad email', async () => {
      const page = await open();
      fillValid(page);

      type('experience-input', '-1');
      expect(save().disabled).toBe(true);
      type('experience-input', '5');

      type('fee-input', '0');
      expect(save().disabled).toBe(true);
      type('fee-input', '500');

      type('email-input', 'nope');
      expect(save().disabled).toBe(true);
      type('email-input', 'doctor@clinic.test');

      expect(save().disabled).toBe(false);
    });
  });

  describe('saving', () => {
    it('registers the doctor against the hospital and navigates', async () => {
      const page = await open();
      const before = doctors.getDoctors().length;
      fillValid(page);
      type('experience-input', '7');
      type('fee-input', '500');

      save().click();
      await harness.fixture.whenStable();

      const created = doctors.getDoctors().at(-1)!;
      expect(doctors.getDoctors().length).toBe(before + 1);
      expect(created.name).toBe('Dr. New Doctor');
      expect(created.experienceYears).toBe(7);
      expect(created.consultationFee).toBe(500);
      expect(doctors.getByHospital(1)).toContain(created);
      expect(router.url).toBe('/admin');
    });

    it('shows the doctor and the raised hospital count on the dashboard', async () => {
      const page = await open();
      const beforeDoctors = doctors.getDoctors().length;
      const beforeAtHospital = hospitals.getById(1)!.doctorCount;
      fillValid(page);
      save().click();
      await harness.fixture.whenStable();

      const dashboard = await harness.navigateByUrl('/admin', AdminDashboard);
      harness.detectChanges();

      expect(dashboard.doctors().length).toBe(beforeDoctors + 1);
      expect(harness.routeNativeElement?.textContent).toContain('Dr. New Doctor');
      expect(dashboard.hospitals().find((hospital) => hospital.id === 1)!.doctorCount).toBe(
        beforeAtHospital + 1,
      );
    });
  });

  describe('cancelling', () => {
    it('discards the form and navigates to the dashboard', async () => {
      const page = await open();
      const before = doctors.getDoctors().length;
      fillValid(page);

      (testId('cancel') as HTMLElement).click();
      await harness.fixture.whenStable();

      expect(doctors.getDoctors().length).toBe(before);
      expect(router.url).toBe('/admin');
    });
  });
});
