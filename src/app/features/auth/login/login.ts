import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth.service';

/**
 * Step one: a phone number.
 *
 * No password, no registration — requesting a code is the whole form. The
 * redirect the guard supplied is carried through to verification so the user
 * lands where they were going.
 */
@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  /** Where to go after verifying, put there by authGuard. */
  readonly redirect = input<string | undefined>(undefined);

  readonly phone = signal('');
  readonly submitAttempted = signal(false);

  readonly isValid = computed(() => AuthService.isValidPhone(this.phone()));

  readonly error = computed(() =>
    this.submitAttempted() && !this.isValid() ? 'Enter a 10-digit mobile number' : null,
  );

  requestOtp(): void {
    this.submitAttempted.set(true);

    if (!this.auth.requestOtp(this.phone())) {
      return;
    }

    this.router.navigate(['/verify-otp'], {
      queryParams: { redirect: this.redirect() || null },
    });
  }
}
