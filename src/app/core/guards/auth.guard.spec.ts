import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { authGuard, roleGuard } from './auth.guard';
import { AuthService, MOCK_OTP } from '../services/auth.service';
import { UserRole } from '../models/auth.model';

// Distinct selectors, or Angular reports an ID collision between the stubs.
@Component({ selector: 'test-landing', template: 'landing' })
class LandingComponent {}

@Component({ selector: 'test-login', template: 'login' })
class LoginComponent {}

@Component({ selector: 'test-doctor', template: 'doctor area' })
class DoctorComponent {}

@Component({ selector: 'test-admin', template: 'admin area' })
class AdminComponent {}

@Component({ selector: 'test-admin-reports', template: 'admin reports' })
class AdminReportsComponent {}

@Component({ selector: 'test-private', template: 'private' })
class PrivateComponent {}

describe('auth guards', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let auth: AuthService;

  const signInAs = (role: UserRole) => {
    auth.requestOtp('9876543210');
    auth.verifyOtp(MOCK_OTP);
    auth.loginAs(role);
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: LandingComponent },
          { path: 'login', component: LoginComponent },
          { path: 'private', canActivate: [authGuard], component: PrivateComponent },
          {
            path: 'doctor',
            canActivate: [roleGuard('doctor')],
            children: [{ path: 'dashboard', component: DoctorComponent }],
          },
          {
            path: 'admin',
            canActivate: [roleGuard('admin')],
            children: [
              { path: '', component: AdminComponent },
              { path: 'reports', component: AdminReportsComponent },
            ],
          },
        ]),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    auth.logout();
  });

  describe('unauthenticated', () => {
    it('redirects a protected route to login', async () => {
      await harness.navigateByUrl('/doctor/dashboard');

      expect(router.url).toContain('/login');
    });

    it('carries the attempted URL so login can return there', async () => {
      await harness.navigateByUrl('/doctor/dashboard');

      expect(router.url).toBe('/login?redirect=%2Fdoctor%2Fdashboard');
    });

    it('protects every path under /admin', async () => {
      for (const url of ['/admin', '/admin/reports']) {
        await harness.navigateByUrl(url);

        expect(router.url).toContain('/login');
      }
    });

    it('leaves public routes alone', async () => {
      await harness.navigateByUrl('/');
      expect(router.url).toBe('/');

      await harness.navigateByUrl('/login');
      expect(router.url).toBe('/login');
    });

    it('applies authGuard on its own the same way', async () => {
      await harness.navigateByUrl('/private');

      expect(router.url).toBe('/login?redirect=%2Fprivate');
    });
  });

  describe('the right role', () => {
    it('lets a doctor into the doctor area', async () => {
      signInAs('doctor');

      await harness.navigateByUrl('/doctor/dashboard');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('lets an admin into every admin path', async () => {
      signInAs('admin');

      for (const url of ['/admin', '/admin/reports']) {
        await harness.navigateByUrl(url);

        expect(router.url).toBe(url);
      }
    });
  });

  describe('the wrong role', () => {
    it('sends a patient away from the doctor area, to their own home', async () => {
      signInAs('patient');

      await harness.navigateByUrl('/doctor/dashboard');

      // Authenticated but not entitled, so not back to a sign-in form.
      expect(router.url).toBe('/');
      expect(router.url).not.toContain('/login');
    });

    it('sends a doctor away from the admin area, to their dashboard', async () => {
      signInAs('doctor');

      await harness.navigateByUrl('/admin');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('sends an admin away from the doctor area, to admin', async () => {
      signInAs('admin');

      await harness.navigateByUrl('/doctor/dashboard');

      expect(router.url).toBe('/admin');
    });
  });

  describe('after logout', () => {
    it('closes the door again', async () => {
      signInAs('doctor');
      await harness.navigateByUrl('/doctor/dashboard');
      expect(router.url).toBe('/doctor/dashboard');

      auth.logout();
      // Leaving first, as logging out in the app navigates home; re-requesting the
      // same URL would not re-run the guard.
      await harness.navigateByUrl('/');
      await harness.navigateByUrl('/doctor/dashboard');

      expect(router.url).toContain('/login');
    });
  });
});
