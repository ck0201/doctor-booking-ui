import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Appointment } from '@core/models/booking.model';
import { APPOINTMENT_STATUS_LABELS } from '@core/utils/appointment-order';
import { formatFullDayLabel, formatTimeRange } from '@core/utils/booking-slots';

/**
 * One row of appointment history.
 *
 * Read-only by design: no cancel, no reschedule, nothing clickable. It takes the
 * whole Appointment rather than a field per column (ADR-016), and every label it
 * shows is formatted by the shared utils so history and confirmation can never
 * word the same date differently.
 */
@Component({
  selector: 'app-appointment-card',
  templateUrl: './appointment-card.html',
  styleUrl: './appointment-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentCard {
  readonly appointment = input.required<Appointment>();

  readonly headingLevel = input<2 | 3 | 4>(3);

  protected readonly dateLabel = computed(() => formatFullDayLabel(this.appointment().time.date));

  protected readonly timeLabel = computed(() => formatTimeRange(this.appointment().time));

  protected readonly statusLabel = computed(
    () => APPOINTMENT_STATUS_LABELS[this.appointment().status],
  );
}
