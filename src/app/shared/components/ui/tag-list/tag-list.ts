import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Row of pill labels — specialties, languages, services, applied filters.
 *
 * A real list, so a screen reader announces how many there are. Spacing is
 * exposed as --tag-gap because consumers sit it in rows of differing density.
 */
@Component({
  selector: 'app-tag-list',
  templateUrl: './tag-list.html',
  styleUrl: './tag-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagList {
  readonly items = input.required<readonly string[]>();

  /** 'primary' reads as a category; 'neutral' as plain information. */
  readonly variant = input<'primary' | 'neutral'>('primary');

  /** Announced by assistive tech in place of the surrounding heading. */
  readonly ariaLabel = input<string | undefined>(undefined);
}
