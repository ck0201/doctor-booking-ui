import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One headline figure.
 *
 * Promoted from the doctor dashboard once the admin panel became a second
 * consumer, which is the bar ADR-024 sets (ADR-034).
 */
@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.html',
  styleUrl: './stat-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatCard {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Optional line under the figure, e.g. what period it covers. */
  readonly caption = input<string | undefined>(undefined);
}
