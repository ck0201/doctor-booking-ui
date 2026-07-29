import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HospitalService } from '@core/services/hospital.service';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { HospitalCard } from '../components/hospital-card/hospital-card';

/**
 * Hospital search.
 *
 * Follows ADR-021: the query lives in the URL, so a search survives a refresh and
 * can be shared. It differs from doctor search in one way — results update as you
 * type rather than on submit — so the URL is kept in step with replaceUrl, and
 * typing does not fill the history with a entry per keystroke.
 *
 * The box is bound to a local signal seeded from the URL rather than to the
 * parameter directly: rebinding an input to an awaited navigation would drop
 * characters when someone types quickly.
 *
 * Filtering itself belongs to HospitalService, not here.
 */
@Component({
  selector: 'app-hospital-search',
  imports: [EmptyState, HospitalCard],
  templateUrl: './hospital-search.html',
  styleUrl: './hospital-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalSearch {
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Bound by the router via withComponentInputBinding(). The alias is the URL contract. */
  readonly queryParam = input<string | undefined>(undefined, { alias: 'q' });

  /** Seeded from the URL, edited locally, re-seeded whenever the URL changes. */
  readonly query = linkedSignal(() => this.queryParam() ?? '');

  readonly results = computed(() => this.hospitalService.searchByText(this.query()));

  readonly hasQuery = computed(() => this.query().trim().length > 0);

  readonly hasResults = computed(() => this.results().length > 0);

  /** Filters immediately, then mirrors the query into the URL. */
  onQueryInput(value: string): Promise<boolean> {
    this.query.set(value);

    return this.router.navigate([], {
      relativeTo: this.route,
      // Null drops the parameter, so a cleared box gives a clean /hospitals.
      queryParams: { q: value.trim() || null },
      // Typing is not navigation history.
      replaceUrl: true,
    });
  }

  clearQuery(): Promise<boolean> {
    return this.onQueryInput('');
  }
}
