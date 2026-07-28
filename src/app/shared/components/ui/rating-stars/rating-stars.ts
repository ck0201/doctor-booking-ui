import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Star rating with the accessible sentence that goes with it.
 *
 * Colour and weight are inherited, not owned: a rating reads amber in a card's
 * meta row and plain text in a profile stat, and that is the consumer's call.
 * What is worth sharing is the glyph, the optional count, and the screen-reader
 * text that is easy to forget.
 */
@Component({
  selector: 'app-rating-stars',
  templateUrl: './rating-stars.html',
  styleUrl: './rating-stars.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RatingStars {
  /** 0 – 5. */
  readonly value = input.required<number>();
  /** Rendered in brackets when supplied. */
  readonly reviewCount = input<number | undefined>(undefined);

  protected readonly label = computed(() => {
    const count = this.reviewCount();
    const base = `${this.value()} out of 5`;
    return count === undefined ? base : `${base} from ${count} ratings`;
  });
}
