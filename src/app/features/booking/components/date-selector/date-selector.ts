import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { BookingDay } from '@core/models/booking.model';

/**
 * Horizontal list of bookable days.
 *
 * Two-way bound through `selectedDate` (a model signal), the same shape
 * SearchableDropdown uses (ADR-011). A day with no free slots is rendered but
 * disabled, because hiding it would make the week look shorter than it is.
 */
@Component({
  selector: 'app-date-selector',
  templateUrl: './date-selector.html',
  styleUrl: './date-selector.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateSelector {
  readonly days = input.required<readonly BookingDay[]>();

  /** ISO date of the chosen day, or null when nothing is chosen. */
  readonly selectedDate = model<string | null>(null);

  protected select(day: BookingDay): void {
    if (day.availableSlotCount > 0) {
      this.selectedDate.set(day.date);
    }
  }
}
