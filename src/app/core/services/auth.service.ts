import { Injectable, computed, signal } from '@angular/core';
import { AuthUser, OtpResult, UserRole } from '../models/auth.model';

/** The only code that works. No generation, no expiry (ADR-033). */
export const MOCK_OTP = '123456';

const TEN_DIGITS = /^\d{10}$/;

/**
 * In-memory authentication.
 *
 * The session lives in signals on this service and nowhere else: no
 * localStorage, no cookie, no token. A refresh signs the user out, which is the
 * honest consequence of not persisting anything.
 *
 * Synchronous like every other service (ADR-008).
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Phone awaiting verification. Null once verified or logged out. */
  private readonly pendingPhone = signal<string | null>(null);

  /** Set by verifyOtp, cleared by logout. loginAs then attaches the role. */
  private readonly verifiedPhone = signal<string | null>(null);

  private readonly user = signal<AuthUser | null>(null);

  readonly currentUser = this.user.asReadonly();
  readonly isAuthenticated = computed(() => this.user() !== null);
  readonly currentRole = computed<UserRole | null>(() => this.user()?.role ?? null);

  /** True once a code has been requested and not yet consumed. */
  readonly hasPendingOtp = computed(() => this.pendingPhone() !== null);
  readonly awaitingPhone = this.pendingPhone.asReadonly();

  /** True once the code is accepted but before a role is chosen. */
  readonly isVerified = computed(() => this.verifiedPhone() !== null);

  static isValidPhone(phone: string): boolean {
    return TEN_DIGITS.test(phone.trim());
  }

  /** Rejects a malformed number rather than sending a code nobody asked for. */
  requestOtp(phone: string): boolean {
    if (!AuthService.isValidPhone(phone)) {
      return false;
    }

    this.pendingPhone.set(phone.trim());
    this.verifiedPhone.set(null);
    return true;
  }

  /** 'no-request' when nobody asked for a code, so the page can send them back. */
  verifyOtp(code: string): OtpResult {
    const phone = this.pendingPhone();
    if (phone === null) {
      return 'no-request';
    }
    if (code.trim() !== MOCK_OTP) {
      return 'invalid';
    }

    this.verifiedPhone.set(phone);
    this.pendingPhone.set(null);
    return 'verified';
  }

  /**
   * Completes the session. Refuses unless a code was verified first, so the role
   * selector cannot be used as a way in on its own.
   */
  loginAs(role: UserRole): boolean {
    const phone = this.verifiedPhone();
    if (phone === null) {
      return false;
    }

    this.user.set({ phoneNumber: phone, role });
    this.verifiedPhone.set(null);
    return true;
  }

  logout(): void {
    this.user.set(null);
    this.pendingPhone.set(null);
    this.verifiedPhone.set(null);
  }
}
