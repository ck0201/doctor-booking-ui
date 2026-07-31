import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Hospital } from '@core/models/hospital.model';
import { HospitalService, TEMPORARY_PASSWORD } from '@core/services/hospital.service';

/**
 * Where a hospital admin enters the portal, using the credentials a platform
 * admin handed over (ADR-038).
 *
 * The check is local to this page on purpose: there is no hospital session, no
 * role and no guard yet, so nothing outside this component observes the result.
 * It matches against the hospitals HospitalService already holds, which means
 * only an account registered in this browser session can sign in.
 */
@Component({
  selector: 'app-hospital-login',
  imports: [RouterLink],
  templateUrl: './hospital-login.html',
  styleUrl: './hospital-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalLogin {
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);

  readonly email = signal('');
  readonly password = signal('');
  readonly submitAttempted = signal(false);

  /** Set only after a completed attempt that did not match. */
  readonly rejected = signal(false);

  private readonly isComplete = computed(() => !!this.email().trim() && !!this.password());

  readonly error = computed(() => {
    if (!this.submitAttempted()) {
      return null;
    }
    if (!this.isComplete()) {
      return 'Enter your email and password';
    }
    // Deliberately one message: which half was wrong is not the signer-in's
    // business, and saying so would confirm whether an account exists.
    return this.rejected() ? 'Those credentials do not match a hospital account' : null;
  });

  setEmail(value: string): void {
    this.email.set(value);
    this.rejected.set(false);
  }

  setPassword(value: string): void {
    this.password.set(value);
    this.rejected.set(false);
  }

  signIn(): void {
    this.submitAttempted.set(true);
    this.rejected.set(false);

    if (!this.isComplete()) {
      return;
    }

    const hospital = this.findAccount(this.email().trim().toLowerCase(), this.password());
    if (!hospital) {
      this.rejected.set(true);
      return;
    }

    // The welcome page needs to know who signed in, and no session exists to tell
    // it. The id travels as a query parameter, read there like any other route
    // parameter (ADR-021), so nothing is stored.
    this.router.navigate(['/hospital/welcome'], { queryParams: { hospitalId: hospital.id } });
  }

  /**
   * The registered hospital with this email, if the password is the issued one.
   *
   * The list read is narrow (ADR-020), so each candidate is fetched back in full
   * to reach its email — thirteen records in memory, and it keeps the
   * narrow/aggregate split intact rather than widening the card contract.
   */
  private findAccount(email: string, password: string): Hospital | undefined {
    if (password !== TEMPORARY_PASSWORD) {
      return undefined;
    }

    return this.hospitalService
      .getHospitals()
      .map((hospital) => this.hospitalService.getById(hospital.id))
      .find(
        (hospital) => !!hospital?.hospitalCode && hospital.email?.toLowerCase().trim() === email,
      );
  }
}
