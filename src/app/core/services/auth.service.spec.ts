import { TestBed } from '@angular/core/testing';

import { AuthService, MOCK_OTP } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const signIn = (role: 'patient' | 'doctor' | 'admin' = 'patient') => {
    service.requestOtp('9876543210');
    service.verifyOtp(MOCK_OTP);
    service.loginAs(role);
  };

  beforeEach(() => {
    service = TestBed.inject(AuthService);
    service.logout();
  });

  describe('requestOtp', () => {
    it('accepts a ten-digit number', () => {
      expect(service.requestOtp('9876543210')).toBe(true);
      expect(service.hasPendingOtp()).toBe(true);
      expect(service.awaitingPhone()).toBe('9876543210');
    });

    it('trims before storing', () => {
      service.requestOtp('  9876543210  ');

      expect(service.awaitingPhone()).toBe('9876543210');
    });

    it('rejects anything that is not ten digits', () => {
      for (const phone of ['', '   ', '98765', '98765432101', '98765abcde', '+919876543210']) {
        expect(service.requestOtp(phone)).toBe(false);
      }
      expect(service.hasPendingOtp()).toBe(false);
    });
  });

  describe('verifyOtp', () => {
    it('accepts the fixed code', () => {
      service.requestOtp('9876543210');

      expect(service.verifyOtp(MOCK_OTP)).toBe('verified');
      expect(service.isVerified()).toBe(true);
    });

    it('rejects any other code', () => {
      service.requestOtp('9876543210');

      expect(service.verifyOtp('000000')).toBe('invalid');
      expect(service.isVerified()).toBe(false);
    });

    it('reports when no code was requested', () => {
      expect(service.verifyOtp(MOCK_OTP)).toBe('no-request');
      expect(service.isVerified()).toBe(false);
    });

    it('does not sign anyone in on its own', () => {
      service.requestOtp('9876543210');
      service.verifyOtp(MOCK_OTP);

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
    });

    it('consumes the request, so a code cannot be reused', () => {
      service.requestOtp('9876543210');
      service.verifyOtp(MOCK_OTP);

      expect(service.hasPendingOtp()).toBe(false);
    });
  });

  describe('loginAs', () => {
    it('completes the session with the chosen role', () => {
      service.requestOtp('9876543210');
      service.verifyOtp(MOCK_OTP);

      expect(service.loginAs('doctor')).toBe(true);
      expect(service.isAuthenticated()).toBe(true);
      expect(service.currentRole()).toBe('doctor');
      expect(service.currentUser()).toEqual({ phoneNumber: '9876543210', role: 'doctor' });
    });

    it('refuses without a verified code, so the role picker is not a way in', () => {
      expect(service.loginAs('admin')).toBe(false);
      expect(service.isAuthenticated()).toBe(false);
    });

    it('refuses after a failed verification', () => {
      service.requestOtp('9876543210');
      service.verifyOtp('000000');

      expect(service.loginAs('admin')).toBe(false);
    });

    it('cannot be replayed to switch role without verifying again', () => {
      signIn('patient');

      expect(service.loginAs('admin')).toBe(false);
      expect(service.currentRole()).toBe('patient');
    });

    it('supports all three roles', () => {
      for (const role of ['patient', 'doctor', 'admin'] as const) {
        service.logout();
        signIn(role);

        expect(service.currentRole()).toBe(role);
      }
    });
  });

  describe('logout', () => {
    it('clears the session', () => {
      signIn('doctor');

      service.logout();

      expect(service.isAuthenticated()).toBe(false);
      expect(service.currentUser()).toBeNull();
      expect(service.currentRole()).toBeNull();
    });

    it('clears a half-finished sign-in too', () => {
      service.requestOtp('9876543210');
      service.verifyOtp(MOCK_OTP);

      service.logout();

      expect(service.hasPendingOtp()).toBe(false);
      expect(service.isVerified()).toBe(false);
    });
  });

  describe('persistence', () => {
    it('keeps nothing outside memory', () => {
      signIn('admin');

      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);
      expect(document.cookie).toBe('');
    });
  });
});
