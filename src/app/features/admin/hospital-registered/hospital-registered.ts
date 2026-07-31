import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalService, TEMPORARY_PASSWORD } from '@core/services/hospital.service';
import { toRouteId } from '@core/utils/route-params';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/**
 * Credential handover, the last step a platform admin performs (ADR-038).
 *
 * Reads the hospital back from the service by route id rather than receiving the
 * credentials through navigation state, so the page has no hidden input and a
 * refresh behaves the same way every other page does.
 */
@Component({
  selector: 'app-hospital-registered',
  imports: [RouterLink, EmptyState, ProfileSection],
  templateUrl: './hospital-registered.html',
  styleUrl: './hospital-registered.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalRegistered {
  private readonly hospitalService = inject(HospitalService);

  /** Route parameter, bound by withComponentInputBinding() (ADR-021). */
  readonly id = input.required<string>();

  protected readonly temporaryPassword = TEMPORARY_PASSWORD;

  /**
   * The hospital, but only once it has an account code.
   *
   * A malformed id, an unknown id and a seeded hospital that was never
   * registered all collapse into undefined, so the template branches once —
   * the same shape ADR-023 settled on.
   */
  readonly hospital = computed(() => {
    const id = toRouteId(this.id());
    const hospital = id === null ? undefined : this.hospitalService.getById(id);
    return hospital?.hospitalCode ? hospital : undefined;
  });
}
