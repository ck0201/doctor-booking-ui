import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter, withComponentInputBinding } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { Login } from './login/login';
import { VerifyOtp } from './verify-otp/verify-otp';
import { AuthService, MOCK_OTP } from '@core/services/auth.service';
import { roleGuard } from '@core/guards/auth.guard';

@Component({ selector: 'test-landing', template: 'landing' })
class LandingComponent {}

@Component({ selector: 'test-dashboard', template: 'dashboard' })
class DashboardComponent {}

@Component({ selector: 'test-admin', template: 'admin' })
class AdminComponent {}

/** Covers the whole sign-in flow, end to end through the real router. */
describe('authentication flow', () => {
  let harness: RouterTestingHarness;
  let router: Router;
  let auth: AuthService;

  const query = (selector: string) =>
    harness.routeNativeElement?.querySelector(selector) as HTMLElement | null;
  const text = () => (harness.routeNativeElement?.textContent ?? '').replace(/\s+/g, ' ');

  const type = (testId: string, value: string) => {
    const input = query(`[data-testid="${testId}"]`) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  };

  const click = async (testId: string) => {
    (query(`[data-testid="${testId}"]`) as HTMLElement).click();
    await harness.fixture.whenStable();
    harness.detectChanges();
  };

  /** Phone → OTP → verified, stopping before the role is chosen. */
  const reachRoleSelector = async () => {
    await harness.navigateByUrl('/login', Login);
    type('phone-input', '9876543210');
    await click('request-otp');

    type('otp-input', MOCK_OTP);
    await click('verify-otp');
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(
          [
            { path: '', component: LandingComponent },
            {
              path: 'doctor/dashboard',
              canActivate: [roleGuard('doctor')],
              component: DashboardComponent,
            },
            { path: 'admin', canActivate: [roleGuard('admin')], component: AdminComponent },
            { path: '', loadChildren: () => import('./auth.routes') },
          ],
          withComponentInputBinding(),
        ),
      ],
    });

    harness = await RouterTestingHarness.create();
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    auth.logout();
  });

  describe('login page', () => {
    it('loads at /login', async () => {
      const page = await harness.navigateByUrl('/login', Login);

      expect(page).toBeInstanceOf(Login);
      expect(query('[data-testid="phone-input"]')).toBeTruthy();
    });

    it('asks for nothing but a phone number', async () => {
      await harness.navigateByUrl('/login', Login);

      expect(harness.routeNativeElement?.querySelectorAll('input').length).toBe(1);
      expect(text()).not.toContain('Password');
      expect(text()).not.toContain('Register');
    });

    it('refuses a malformed number and does not navigate', async () => {
      await harness.navigateByUrl('/login', Login);

      type('phone-input', '98765');
      await click('request-otp');

      expect(router.url).toBe('/login');
      expect(text()).toContain('10-digit');
      expect(auth.hasPendingOtp()).toBe(false);
    });

    it('requests a code and moves to verification', async () => {
      await harness.navigateByUrl('/login', Login);

      type('phone-input', '9876543210');
      await click('request-otp');

      expect(router.url).toBe('/verify-otp');
      expect(auth.hasPendingOtp()).toBe(true);
    });

    it('carries a redirect through to verification', async () => {
      await harness.navigateByUrl('/login?redirect=%2Fdoctor%2Fdashboard', Login);

      type('phone-input', '9876543210');
      await click('request-otp');

      expect(router.url).toContain('redirect=%2Fdoctor%2Fdashboard');
    });
  });

  describe('verify page', () => {
    it('shows the number the code went to', async () => {
      await harness.navigateByUrl('/login', Login);
      type('phone-input', '9876543210');
      await click('request-otp');

      expect(query('[data-testid="phone"]')?.textContent?.trim()).toBe('9876543210');
    });

    it('sends people back when no code was requested', async () => {
      await harness.navigateByUrl('/verify-otp', VerifyOtp);

      expect(text()).toContain('Nothing to verify');
      expect(query('[data-testid="back-to-login"]')?.getAttribute('href')).toBe('/login');
      expect(query('[data-testid="otp-input"]')).toBeNull();
    });

    it('rejects the wrong code and keeps the form', async () => {
      await harness.navigateByUrl('/login', Login);
      type('phone-input', '9876543210');
      await click('request-otp');

      type('otp-input', '000000');
      await click('verify-otp');

      expect(query('[data-testid="otp-error"]')?.textContent).toContain('not correct');
      expect(query('[data-testid="role-selector"]')).toBeNull();
      expect(auth.isAuthenticated()).toBe(false);
    });

    it('shows the role selector only after the code is accepted', async () => {
      await harness.navigateByUrl('/login', Login);
      type('phone-input', '9876543210');
      await click('request-otp');
      expect(query('[data-testid="role-selector"]')).toBeNull();

      type('otp-input', MOCK_OTP);
      await click('verify-otp');

      expect(query('[data-testid="role-selector"]')).toBeTruthy();
      expect(query('[data-testid="otp-input"]')).toBeNull();
    });

    it('offers all three roles', async () => {
      await reachRoleSelector();

      for (const role of ['patient', 'doctor', 'admin']) {
        expect(query(`[data-testid="role-${role}"]`)).toBeTruthy();
      }
    });

    it('does not sign anyone in before a role is chosen', async () => {
      await reachRoleSelector();

      expect(auth.isAuthenticated()).toBe(false);
    });
  });

  describe('role routing', () => {
    it('sends a patient to the landing page', async () => {
      await reachRoleSelector();

      await click('role-patient');

      expect(auth.currentRole()).toBe('patient');
      expect(router.url).toBe('/');
    });

    it('sends a doctor to the dashboard, through the guard', async () => {
      await reachRoleSelector();

      await click('role-doctor');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('sends an admin to the admin area', async () => {
      await reachRoleSelector();

      await click('role-admin');

      expect(router.url).toBe('/admin');
    });

    it('honours the redirect over the role default', async () => {
      await harness.navigateByUrl('/login?redirect=%2Fdoctor%2Fdashboard', Login);
      type('phone-input', '9876543210');
      await click('request-otp');
      type('otp-input', MOCK_OTP);
      await click('verify-otp');

      await click('role-doctor');

      expect(router.url).toBe('/doctor/dashboard');
    });

    it('records the verified number against the session', async () => {
      await reachRoleSelector();
      await click('role-patient');

      expect(auth.currentUser()).toEqual({ phoneNumber: '9876543210', role: 'patient' });
    });
  });

  describe('guard round trip', () => {
    it('takes an unauthenticated user to login and back to where they were going', async () => {
      await harness.navigateByUrl('/doctor/dashboard');
      expect(router.url).toBe('/login?redirect=%2Fdoctor%2Fdashboard');

      type('phone-input', '9876543210');
      await click('request-otp');
      type('otp-input', MOCK_OTP);
      await click('verify-otp');
      await click('role-doctor');

      expect(router.url).toBe('/doctor/dashboard');
    });
  });
});
