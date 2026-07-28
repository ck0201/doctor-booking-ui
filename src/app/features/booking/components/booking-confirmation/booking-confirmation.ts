import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BookingSlot, PatientInfo } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';
import { formatFullDayLabel } from '@core/utils/booking-slots';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/**
 * What the patient sees after a booking is accepted.
 *
 * A state of the booking page, not a route of its own: no new feature, and no
 * new success component either. The headline reuses EmptyState and the detail
 * list reuses ProfileSection, both untouched.
 *
 * Lives in the booking feature because nothing else confirms a booking.
 */
@Component({
  selector: 'app-booking-confirmation',
  imports: [RouterLink, EmptyState, ProfileSection],
  templateUrl: './booking-confirmation.html',
  styleUrl: './booking-confirmation.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingConfirmation {
  readonly reference = input.required<string>();
  readonly doctor = input.required<DoctorCardData>();
  readonly slot = input.required<BookingSlot>();
  readonly patient = input.required<PatientInfo>();

  /** 'Mon 10 Aug 2026' */
  protected readonly dateLabel = computed(() => formatFullDayLabel(this.slot().date));

  /** '10:00 AM – 10:15 AM' */
  protected readonly timeLabel = computed(() => `${this.slot().startsAt} – ${this.slot().endsAt}`);
}
