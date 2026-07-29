import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { AppointmentFilter } from '@core/models/booking.model';
import { APPOINTMENT_FILTERS, APPOINTMENT_FILTER_LABELS } from '@core/utils/appointment-order';

/**
 * The four history filters.
 *
 * Two-way bound through `selected` (a model signal), the same shape the other
 * pickers use (ADR-011). Local to the page by design: no URL parameters, unlike
 * doctor search (ADR-021), because a history filter is a glance rather than
 * something worth sharing.
 */
@Component({
  selector: 'app-appointment-status-filter',
  templateUrl: './appointment-status-filter.html',
  styleUrl: './appointment-status-filter.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentStatusFilter {
  readonly selected = model.required<AppointmentFilter>();

  /** How many appointments each filter would show. */
  readonly counts = input.required<Readonly<Record<AppointmentFilter, number>>>();

  protected readonly filters = APPOINTMENT_FILTERS;
  protected readonly labels = APPOINTMENT_FILTER_LABELS;
}
