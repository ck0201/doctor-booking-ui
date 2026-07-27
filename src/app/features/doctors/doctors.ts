import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  signal,
} from '@angular/core';
import { SearchableDropdown } from '@shared/components/forms/searchable-dropdown/searchable-dropdown';
import { DoctorCard } from '@shared/components/ui/doctor-card/doctor-card';
import { LocationService } from '@core/services/location.service';
import { SpecialtyService } from '@core/services/specialty.service';
import { DoctorService } from '@core/services/doctor.service';
import { City, District } from '@core/models/location.model';
import { Specialty } from '@core/models/specialty.model';
import { DoctorSearchCriteria } from '@core/models/doctor-search-criteria.model';

/**
 * Doctor search page (ADR-006).
 * Smart component: owns the search state, delegates rendering to dumb components.
 */
@Component({
  selector: 'app-doctors',
  imports: [SearchableDropdown, DoctorCard],
  templateUrl: './doctors.html',
  styleUrl: './doctors.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Doctors {
  private readonly locationService = inject(LocationService);
  private readonly specialtyService = inject(SpecialtyService);
  private readonly doctorService = inject(DoctorService);

  readonly specialties = this.specialtyService.getSpecialties();
  readonly districts = this.locationService.getDistricts();
  /** ADR-004: fixed for the MVP, rendered read-only. */
  readonly state = this.locationService.launchState;

  readonly doctorName = signal('');
  readonly selectedSpecialty = signal<Specialty | null>(null);
  readonly selectedDistrict = signal<District | null>(null);

  /** Cities are derived from the district, so the two can never disagree. */
  readonly cities = computed(() => this.locationService.getCities(this.selectedDistrict()?.id));

  /**
   * Keeps the chosen city while it still belongs to the selected district and
   * clears it otherwise. linkedSignal expresses this dependency declaratively,
   * which avoids a reset effect and the extra change-detection round it costs.
   */
  readonly selectedCity = linkedSignal<readonly City[], City | null>({
    source: this.cities,
    computation: (cities, previous) =>
      cities.find((city) => city.id === previous?.value?.id) ?? null,
  });

  /** Last submitted search. Results are derived from it, not stored separately. */
  readonly lastSearch = signal<DoctorSearchCriteria | null>(null);

  /** Empty until the first search, so the page opens on a prompt rather than a dump. */
  readonly results = computed(() => {
    const criteria = this.lastSearch();
    return criteria ? this.doctorService.search(criteria) : [];
  });

  readonly hasFilters = computed(
    () =>
      this.doctorName().trim().length > 0 ||
      this.selectedSpecialty() !== null ||
      this.selectedDistrict() !== null ||
      this.selectedCity() !== null,
  );

  search(): void {
    this.lastSearch.set({
      doctorName: this.doctorName().trim(),
      specialty: this.selectedSpecialty(),
      state: this.state,
      district: this.selectedDistrict(),
      city: this.selectedCity(),
    });
  }
}
