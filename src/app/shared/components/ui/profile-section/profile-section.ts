import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Titled card section for detail pages (ADR-022).
 *
 * Sections are content, not components — this supplies the surface and the
 * heading so that About, Education, Experience and the rest stay as markup in
 * the page template rather than becoming a component each.
 */
@Component({
  selector: 'app-profile-section',
  templateUrl: './profile-section.html',
  styleUrl: './profile-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileSection {
  readonly title = input.required<string>();

  /**
   * Rank within the page outline. Renders a real h2 and, when a different rank
   * is needed, overrides it with aria-level rather than swapping the tag and
   * duplicating the template.
   */
  readonly headingLevel = input<2 | 3 | 4>(2);
}
