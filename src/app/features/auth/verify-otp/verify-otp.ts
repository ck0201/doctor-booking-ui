import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ROLE_HOME, USER_ROLES, USER_ROLE_LABELS, UserRole } from '@core/models/auth.model';
import { AuthService } from '@core/services/auth.service';

/**
 * Step two: the code, then the role.
 *
 * Both are on one page rather than three, because a mock OTP and a mock role
 * picker do not warrant a wizard. The role selector only appears once the code
 * is accepted, so the two steps stay visibly ordered.
 */
@Component({
  selector: 'app-verify-otp',
  imports: [RouterLink],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyOtp {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly redirect = input<string | undefined>(undefined);

  protected readonly roles = USER_ROLES;
  protected readonly roleLabels = USER_ROLE_LABELS;

  readonly code = signal('');
  readonly error = signal<string | null>(null);

  readonly phoneNumber = this.auth.awaitingPhone;
  readonly isVerified = this.auth.isVerified;

  /** True when someone opened this page without requesting a code. */
  readonly hasNoRequest = computed(() => !this.auth.hasPendingOtp() && !this.auth.isVerified());

  verify(): void {
    const result = this.auth.verifyOtp(this.code());

    if (result === 'verified') {
      this.error.set(null);
      return;
    }

    this.error.set(
      result === 'invalid' ? 'That code is not correct.' : 'Request a code before verifying.',
    );
  }

  /** Signs in and sends the user to the redirect, or to their role's home. */
  chooseRole(role: UserRole): Promise<boolean> | void {
    if (!this.auth.loginAs(role)) {
      this.error.set('Verify your code first.');
      return;
    }

    return this.router.navigateByUrl(this.redirect() || ROLE_HOME[role]);
  }
}
