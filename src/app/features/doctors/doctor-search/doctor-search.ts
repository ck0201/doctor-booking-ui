import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SearchableDropdown } from '@shared/components/forms/searchable-dropdown/searchable-dropdown';
import { DoctorCard } from '@shared/components/ui/doctor-card/doctor-card';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { TagList } from '@shared/components/ui/tag-list/tag-list';
import { LocationService } from '@core/services/location.service';
import { SpecialtyService } from '@core/services/specialty.service';
import { DoctorService } from '@core/services/doctor.service';
import { City } from '@core/models/location.model';
import { DoctorSearchCriteria } from '@core/models/doctor-search-criteria.model';
import { toRouteId } from '@core/utils/route-params';

/** Source of the city cascade: the district's cities, plus whatever the URL asks for. */
interface CitySource {
  readonly cities: readonly City[];
  readonly fromUrl: City | null;
}

/**
 * Doctor search page (ADR-006).
 *
 * The URL is the source of truth for the submitted search (ADR-021): results
 * are derived from the query parameters, never from a click. That makes
 * searches shareable, survivable across a refresh, and restorable when the
 * user comes back from a doctor's profile.
 *
 * The panel's own controls stay local so typing does not rewrite history on
 * every keystroke; they re-sync whenever the URL changes.
 */
@Component({
  selector: 'app-doctor-search',
  imports: [SearchableDropdown, DoctorCard, EmptyState, TagList],
  templateUrl: './doctor-search.html',
  styleUrl: './doctor-search.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorSearch {
  private readonly locationService = inject(LocationService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly doctorService = inject(DoctorService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly specialties = this.specialtyService.getSpecialties();
  readonly districts = this.locationService.getDistricts();
  /** ADR-004: fixed for the MVP, rendered read-only. */
  readonly state = this.locationService.launchState;

  // Bound by the router via withComponentInputBinding(). The aliases are the URL contract.
  readonly nameParam = input<string | undefined>(undefined, { alias: 'name' });
  readonly specialtyParam = input<string | undefined>(undefined, { alias: 'specialty' });
  readonly districtParam = input<string | undefined>(undefined, { alias: 'district' });
  readonly cityParam = input<string | undefined>(undefined, { alias: 'city' });
  /**
   * Marks a search submitted with no filters at all, which is otherwise
   * indistinguishable from a first visit to a bare /doctors.
   */
  readonly searchedParam = input<string | undefined>(undefined, { alias: 'searched' });

  private readonly specialtyFromUrl = computed(() => {
    const id = toRouteId(this.specialtyParam());
    return this.specialties.find((specialty) => specialty.id === id) ?? null;
  });

  private readonly districtFromUrl = computed(() => {
    const id = toRouteId(this.districtParam());
    return this.districts.find((district) => district.id === id) ?? null;
  });

  /** A city in the URL is honoured only when it belongs to the district in the URL. */
  private readonly cityFromUrl = computed(() => {
    const id = toRouteId(this.cityParam());
    return this.districtFromUrl()?.cities.find((city) => city.id === id) ?? null;
  });

  // --- Panel state: seeded from the URL, editable, re-seeded when the URL changes. ---

  readonly doctorName = linkedSignal(() => this.nameParam() ?? '');
  readonly selectedSpecialty = linkedSignal(() => this.specialtyFromUrl());
  readonly selectedDistrict = linkedSignal(() => this.districtFromUrl());

  /** Cities are derived from the district, so the two can never disagree. */
  readonly cities = computed(() => this.locationService.getCities(this.selectedDistrict()?.id));

  /**
   * Two triggers, one signal:
   *  - the URL changed  -> adopt the city it names
   *  - the district was edited -> keep the choice only while it still fits
   */
  readonly selectedCity = linkedSignal<CitySource, City | null>({
    source: () => ({ cities: this.cities(), fromUrl: this.cityFromUrl() }),
    computation: (source, previous) => {
      if (previous?.source.fromUrl?.id !== source.fromUrl?.id) {
        return source.fromUrl;
      }
      return source.cities.find((city) => city.id === previous?.value?.id) ?? null;
    },
  });

  // --- Derived from the URL only. ---

  /** True once the URL carries a search, so a bare /doctors still opens on the prompt. */
  private readonly hasQueryState = computed(() =>
    [
      this.nameParam(),
      this.specialtyParam(),
      this.districtParam(),
      this.cityParam(),
      this.searchedParam(),
    ].some((value) => !!value?.trim()),
  );

  /** The submitted search. Null means the page has not been searched yet. */
  readonly appliedCriteria = computed<DoctorSearchCriteria | null>(() => {
    if (!this.hasQueryState()) {
      return null;
    }

    return {
      doctorName: (this.nameParam() ?? '').trim(),
      specialty: this.specialtyFromUrl(),
      state: this.state,
      district: this.districtFromUrl(),
      city: this.cityFromUrl(),
    };
  });

  readonly results = computed(() => {
    const criteria = this.appliedCriteria();
    return criteria ? this.doctorService.search(criteria) : [];
  });

  /** The submitted search, restated as labels above the results. */
  readonly summaryTags = computed<readonly string[]>(() => {
    const criteria = this.appliedCriteria();
    if (!criteria) {
      return [];
    }

    const tags = [criteria.specialty?.name ?? 'All specialties'];
    if (criteria.doctorName) {
      tags.push(criteria.doctorName);
    }
    tags.push(criteria.city?.name ?? criteria.district?.name ?? criteria.state.name);

    return tags;
  });

  /** Live panel state, used only to word the prompt. */
  readonly hasFilters = computed(
    () =>
      this.doctorName().trim().length > 0 ||
      this.selectedSpecialty() !== null ||
      this.selectedDistrict() !== null ||
      this.selectedCity() !== null,
  );

  /**
   * Writes the panel into the URL. Everything downstream reacts to the
   * navigation, so this is the only place the search is "submitted".
   */
  search(): Promise<boolean> {
    const queryParams: Params = {};

    const name = this.doctorName().trim();
    if (name) {
      queryParams['name'] = name;
    }

    const specialty = this.selectedSpecialty();
    if (specialty) {
      queryParams['specialty'] = specialty.id;
    }

    const district = this.selectedDistrict();
    if (district) {
      queryParams['district'] = district.id;
    }

    const city = this.selectedCity();
    if (city) {
      queryParams['city'] = city.id;
    }

    // Keeps shareable URLs clean: the marker appears only when nothing else would.
    if (Object.keys(queryParams).length === 0) {
      queryParams['searched'] = 1;
    }

    return this.router.navigate([], { relativeTo: this.route, queryParams });
  }
}
