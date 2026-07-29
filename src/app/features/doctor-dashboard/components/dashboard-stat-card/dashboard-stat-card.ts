import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * One figure on the dashboard.
 *
 * Extracted because the page shows four of these and would otherwise repeat the
 * same markup four times. Feature-local: no other page shows statistics yet.
 */
@Component({
  selector: 'app-dashboard-stat-card',
  templateUrl: './dashboard-stat-card.html',
  styleUrl: './dashboard-stat-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardStatCard {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  /** Optional line under the figure, e.g. what period it covers. */
  readonly caption = input<string | undefined>(undefined);
}
