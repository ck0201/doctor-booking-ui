import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { BookingSlot, PatientInfo } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';
import { formatFullDayLabel } from '@core/utils/booking-slots';

/**
 * What the patient is about to book, restated before they commit.
 *
 * Read-only: it never edits the selections it shows. Missing pieces are named
 * rather than blank, so the summary doubles as a checklist.
 */
@Component({
  selector: 'app-booking-summary',
  imports: [CurrencyPipe],
  templateUrl: './booking-summary.html',
  styleUrl: './booking-summary.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingSummary {
  readonly doctor = input.required<DoctorCardData>();
  readonly slot = input<BookingSlot | null>(null);
  readonly patient = input.required<PatientInfo>();

  protected readonly whenLabel = computed(() => {
    const slot = this.slot();
    return slot ? `${formatFullDayLabel(slot.date)}, ${slot.startsAt}` : null;
  });

  protected readonly patientLabel = computed(() => {
    const patient = this.patient();
    const name = patient.fullName.trim();
    if (!name) {
      return null;
    }

    const details = [patient.age && `${patient.age} yrs`, patient.gender].filter(Boolean);
    return details.length ? `${name} · ${details.join(' · ')}` : name;
  });

  protected readonly feeLabel = computed(() => this.doctor().consultationFee);
}
