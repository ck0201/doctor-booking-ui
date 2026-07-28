import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Circular avatar with an initials fallback.
 *
 * Always decorative: the name it represents is rendered next to it by every
 * consumer, so the host is aria-hidden and a screen reader never hears it twice.
 *
 * Sized through CSS custom properties rather than a `size` input, so consumers
 * can vary it responsively:
 *   --avatar-size, --avatar-font-size
 */
@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.html',
  styleUrl: './avatar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
})
export class Avatar {
  /** Used for the initials fallback. */
  readonly name = input.required<string>();
  readonly photoUrl = input<string | undefined>(undefined);

  /** 'Dr. Asha Verma' -> 'AV'. */
  readonly initials = computed(() => {
    const words = this.name()
      .replace(/^dr\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean);

    const first = words[0]?.charAt(0) ?? '';
    const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  });
}
