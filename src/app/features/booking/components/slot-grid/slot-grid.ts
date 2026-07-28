import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { BookingSlot } from '@core/models/booking.model';

/**
 * Grid of times for one day.
 *
 * Taken slots stay visible but disabled — a patient deciding between two doctors
 * benefits from seeing how busy each one is.
 */
@Component({
  selector: 'app-slot-grid',
  templateUrl: './slot-grid.html',
  styleUrl: './slot-grid.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SlotGrid {
  readonly slots = input.required<readonly BookingSlot[]>();

  /** Id of the chosen slot, or null. */
  readonly selectedSlotId = model<string | null>(null);

  readonly emptyMessage = input('No slots for this day.');

  protected select(slot: BookingSlot): void {
    if (slot.isAvailable) {
      this.selectedSlotId.set(slot.id);
    }
  }
}
