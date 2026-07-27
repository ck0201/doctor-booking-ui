/**
 * Shared contract for every selectable lookup option in the application
 * (specialty, district, city, hospital, ...).
 *
 * Keeping a single contract means reusable components such as
 * SearchableDropdown can work with any lookup without knowing its domain.
 */
export interface LookupItem {
  readonly id: number;
  readonly name: string;
}
