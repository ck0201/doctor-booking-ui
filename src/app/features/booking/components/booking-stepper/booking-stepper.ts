import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Progress indicator for the booking flow.
 *
 * Presentational only: it reports where the user is, it does not move them.
 * The page decides the current step from what has been filled in.
 */
@Component({
  selector: 'app-booking-stepper',
  templateUrl: './booking-stepper.html',
  styleUrl: './booking-stepper.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookingStepper {
  readonly steps = input.required<readonly string[]>();

  /** Zero-based. Steps before it are complete, steps after are pending. */
  readonly currentStep = input.required<number>();
}
