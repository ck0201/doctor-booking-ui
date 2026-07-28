import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Placeholder for "nothing here" — no search yet, no results, nothing found.
 *
 * The message is projected rather than an input, because callers need markup
 * inside it (the id that was not found, a highlighted term). The component owns
 * the paragraph so it keeps control of the typography.
 *
 * Actions go in the [emptyStateActions] slot and the region collapses when the
 * caller supplies none.
 *
 * Density is exposed for the same reason as elsewhere:
 *   --empty-state-padding, --empty-state-title-size, --empty-state-title-weight
 */
@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
}
