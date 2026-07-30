import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalCardData } from '@core/models/hospital.model';
import { Avatar } from '@shared/components/ui/avatar/avatar';
import { RatingStars } from '@shared/components/ui/rating-stars/rating-stars';
import { TagList } from '@shared/components/ui/tag-list/tag-list';

/** How many departments to name before summarising the rest. */
const MAX_DEPARTMENT_TAGS = 3;

/**
 * One hospital in the search results.
 *
 * Feature-local, not shared: the search page is its only consumer. Hospital
 * Details would be the second, and that is when promoting it earns its keep.
 *
 * Composed from the shared library rather than restyled — Avatar for the logo,
 * RatingStars for the rating, TagList for the departments. No booking actions.
 */
@Component({
  selector: 'app-hospital-card',
  imports: [RouterLink, Avatar, RatingStars, TagList],
  templateUrl: './hospital-card.html',
  styleUrl: './hospital-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalCard {
  readonly hospital = input.required<HospitalCardData>();

  readonly headingLevel = input<2 | 3 | 4>(3);

  /** Router commands for the hospital's profile. */
  readonly detailsRoute = input.required<unknown[]>();

  private readonly departmentNames = computed(() =>
    this.hospital().departments.map((department) => department.name),
  );

  protected readonly visibleDepartments = computed(() =>
    this.departmentNames().slice(0, MAX_DEPARTMENT_TAGS),
  );

  protected readonly hiddenDepartmentCount = computed(() =>
    Math.max(0, this.departmentNames().length - MAX_DEPARTMENT_TAGS),
  );
}
