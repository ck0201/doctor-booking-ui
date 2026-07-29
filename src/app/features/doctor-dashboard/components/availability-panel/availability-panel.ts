import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { DoctorDashboardAvailability } from '@core/models/doctor-dashboard.model';
import { formatRange } from '@core/utils/booking-slots';

/**
 * Working hours, slot length, and one switch for today's availability.
 *
 * The switch is two-way bound through a model signal, so the state lives in the
 * page and nothing is written back to the service (ADR-029). Working hours and
 * slot duration are read-only: changing them is scheduling, which is out of
 * scope.
 */
@Component({
  selector: 'app-availability-panel',
  templateUrl: './availability-panel.html',
  styleUrl: './availability-panel.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvailabilityPanel {
  readonly availability = input.required<DoctorDashboardAvailability>();

  /** Today's state, held by the page. */
  readonly isAvailable = model.required<boolean>();

  protected readonly workingHoursLabel = computed(() => {
    const hours = this.availability().workingHours;
    return formatRange(hours.opensAt, hours.closesAt);
  });

  protected readonly slotDurationLabel = computed(
    () => `${this.availability().slotDurationMinutes} minutes`,
  );

  protected toggle(): void {
    this.isAvailable.update((available) => !available);
  }
}
