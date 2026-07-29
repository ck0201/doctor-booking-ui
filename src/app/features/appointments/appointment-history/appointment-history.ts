import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AppointmentFilter } from '@core/models/booking.model';
import { BookingService } from '@core/services/booking.service';
import { APPOINTMENT_FILTERS, matchesFilter } from '@core/utils/appointment-order';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { AppointmentCard } from '../components/appointment-card/appointment-card';
import { AppointmentStatusFilter } from '../components/appointment-status-filter/appointment-status-filter';
import { RouterLink } from '@angular/router';

/**
 * The patient's appointment history — read only.
 *
 * The service hands back an already-sorted list, so this page only filters and
 * counts. Filtering is a local signal: it is a glance, not something worth
 * putting in the URL the way a doctor search is (ADR-021).
 *
 * No cancellation, rescheduling or detail view: all out of scope for this phase.
 */
@Component({
  selector: 'app-appointment-history',
  imports: [RouterLink, EmptyState, AppointmentCard, AppointmentStatusFilter],
  templateUrl: './appointment-history.html',
  styleUrl: './appointment-history.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentHistory {
  private readonly bookingService = inject(BookingService);

  /** Sorted by the service (ADR-028), never re-sorted here or in the template. */
  readonly appointments = this.bookingService.getAppointmentHistory();

  readonly filter = signal<AppointmentFilter>('all');

  readonly visibleAppointments = computed(() =>
    this.appointments.filter((appointment) => matchesFilter(appointment, this.filter())),
  );

  /** One count per tab, so the filter can show what each would reveal. */
  readonly counts = computed(() => {
    const counts = {} as Record<AppointmentFilter, number>;

    for (const option of APPOINTMENT_FILTERS) {
      counts[option] = this.appointments.filter((appointment) =>
        matchesFilter(appointment, option),
      ).length;
    }

    return counts;
  });

  readonly hasAnyAppointments = computed(() => this.appointments.length > 0);

  readonly isFilteredEmpty = computed(
    () => this.hasAnyAppointments() && this.visibleAppointments().length === 0,
  );
}
