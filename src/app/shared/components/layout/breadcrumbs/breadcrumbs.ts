import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

export interface Breadcrumb {
  readonly label: string;
  /** Router commands. Omit for the current page, which is never a link. */
  readonly route?: unknown[];
}

/**
 * Breadcrumb trail for detail pages.
 *
 * Lives in shared/layout because it is navigation chrome and hospital details
 * needs the identical thing. The last crumb is always plain text marked
 * aria-current="page", whether or not a route was supplied.
 */
@Component({
  selector: 'app-breadcrumbs',
  imports: [RouterLink],
  templateUrl: './breadcrumbs.html',
  styleUrl: './breadcrumbs.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Breadcrumbs {
  readonly items = input.required<readonly Breadcrumb[]>();
}
