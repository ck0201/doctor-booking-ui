import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalService } from '@core/services/hospital.service';
import { toRouteId } from '@core/utils/route-params';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/** One line of the onboarding summary. Static: there is no progress to track yet. */
interface OnboardingStep {
  readonly label: string;
  readonly done: boolean;
}

/**
 * What a hospital admin sees straight after signing in (ADR-038).
 *
 * It welcomes them and explains what onboarding involves. Nothing is editable
 * here — the setup itself is the next phase.
 *
 * The hospital arrives as a query parameter written by the sign-in, read the same
 * way every other page reads its parameters (ADR-021). That is deliberately not a
 * session: nothing is stored, so a refresh reseeds the mock store and the page
 * falls back to the unavailable state rather than pretending to remember.
 */
@Component({
  selector: 'app-hospital-welcome',
  imports: [RouterLink, EmptyState, ProfileSection],
  templateUrl: './hospital-welcome.html',
  styleUrl: './hospital-welcome.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalWelcome {
  private readonly hospitalService = inject(HospitalService);

  /** Written by the sign-in, bound by withComponentInputBinding(). */
  readonly hospitalId = input<string | undefined>(undefined);

  protected readonly estimatedSetupTime = '5–10 minutes';

  /**
   * The account row is a prerequisite that registration already satisfied, not
   * setup progress — which is why the indicator below still reads step 0.
   */
  protected readonly steps: readonly OnboardingStep[] = [
    { label: 'Basic account created', done: true },
    { label: 'Complete hospital profile', done: false },
    { label: 'Add doctors', done: false },
    { label: 'Publish appointments', done: false },
  ];

  /**
   * A missing parameter, a malformed one, an id nobody has, and a seeded hospital
   * that was never registered all collapse into undefined, so the template
   * branches once (ADR-023).
   */
  readonly hospital = computed(() => {
    const id = toRouteId(this.hospitalId());
    const hospital = id === null ? undefined : this.hospitalService.getById(id);
    return hospital?.hospitalCode ? hospital : undefined;
  });
}
