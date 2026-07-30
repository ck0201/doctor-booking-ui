import { Injectable, computed, signal } from '@angular/core';
import { Hospital, HospitalCardData, Weekday } from '../models/hospital.model';
import { HospitalSearchCriteria } from '../models/hospital-search-criteria.model';
import { City, District } from '../models/location.model';
import { DISTRICTS } from '@mock-data/locations.mock';
import { HOSPITALS } from '@mock-data/hospitals.mock';

/**
 * Single access point for hospital data.
 *
 * Same shape as DoctorService (ADR-008, ADR-020): list operations return the
 * narrow HospitalCardData, only getById returns the full Hospital, and `search`
 * becomes POST /api/hospitals/search without the caller changing.
 */

/** What the registration form collects. Everything but name and city is optional. */
export interface HospitalDraft {
  readonly name: string;
  readonly city: City;
  readonly addressLine?: string;
  readonly description?: string;
  readonly contactNumber?: string;
  readonly email?: string;
  readonly website?: string;
  /** 0 – 5. */
  readonly rating?: number;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  /**
   * The live list, seeded from the mock.
   *
   * A signal rather than the imported constant, so a hospital registered by an
   * admin is visible to every reader immediately (ADR-035). Reads go through
   * all(), so nothing else in the service had to change shape.
   */
  private readonly store = signal<readonly Hospital[]>(HOSPITALS);

  /** Reactive view for pages that must follow additions. */
  readonly hospitals = computed<readonly HospitalCardData[]>(() => this.store());

  private all(): readonly Hospital[] {
    return this.store();
  }

  /**
   * Registers a hospital and returns it.
   *
   * In memory only, like the session in ADR-033: a refresh restores the mock. The
   * id continues the mock's sequence, so it cannot collide with a seeded one.
   *
   * A registered hospital starts with no departments, facilities or opening hours
   * — the form does not collect them — and no doctors, because doctorCount is
   * derived from practices that reference it (ADR-025).
   */
  addHospital(draft: HospitalDraft): Hospital {
    const hospital: Hospital = {
      id: this.nextId(),
      name: draft.name.trim(),
      rating: draft.rating === undefined ? undefined : { value: draft.rating, reviewCount: 0 },
      address: {
        line: draft.addressLine?.trim() ?? '',
        city: draft.city,
        district: this.districtOf(draft.city),
      },
      departments: [],
      doctorCount: 0,
      openingHours: [],
      isOpen24Hours: false,
      description: draft.description?.trim() ?? '',
      facilities: [],
      contactNumber: draft.contactNumber?.trim() ?? '',
      email: draft.email?.trim() || undefined,
      website: draft.website?.trim() || undefined,
    };

    this.store.update((hospitals) => [...hospitals, hospital]);
    return hospital;
  }

  private nextId(): number {
    return this.all().reduce((highest, hospital) => Math.max(highest, hospital.id), 0) + 1;
  }

  /** The city already carries its district id, so this cannot disagree with it. */
  private districtOf(city: City): District {
    const district = DISTRICTS.find((candidate) => candidate.id === city.districtId);
    if (!district) {
      throw new Error(`Unknown district id ${city.districtId}`);
    }
    return district;
  }

  getHospitals(): readonly HospitalCardData[] {
    return this.all();
  }

  /** The full profile. Undefined for an unknown id — callers render not-found. */
  getById(id: number): Hospital | undefined {
    return this.all().find((hospital) => hospital.id === id);
  }

  /**
   * Every criterion is optional and narrows the result set.
   * State is not filtered on — the MVP is single-state (ADR-004).
   */
  search(criteria: HospitalSearchCriteria): readonly HospitalCardData[] {
    const name = criteria.hospitalName.trim().toLowerCase();

    return this.all().filter((hospital) => {
      if (name && !hospital.name.toLowerCase().includes(name)) {
        return false;
      }
      if (criteria.district && hospital.address.district.id !== criteria.district.id) {
        return false;
      }
      if (criteria.city && hospital.address.city.id !== criteria.city.id) {
        return false;
      }
      if (
        criteria.specialty &&
        !hospital.departments.some((department) => department.id === criteria.specialty!.id)
      ) {
        return false;
      }
      return true;
    });
  }

  /**
   * One free-text search across name, city and department.
   *
   * Separate from search() above rather than layered on it: that one narrows by
   * several criteria at once, which is an AND, and this one asks "does this word
   * appear anywhere", which is an OR. Expressing either through the other would
   * make both harder to read.
   *
   * An empty query means everything, so the page opens on the full list rather
   * than on a prompt.
   */
  searchByText(query: string): readonly HospitalCardData[] {
    const text = query.trim().toLowerCase();
    if (!text) {
      return this.all();
    }

    return this.all().filter(
      (hospital) =>
        hospital.name.toLowerCase().includes(text) ||
        hospital.address.city.name.toLowerCase().includes(text) ||
        hospital.departments.some((department) => department.name.toLowerCase().includes(text)),
    );
  }

  /**
   * Whether the hospital is open on a given weekday.
   *
   * Takes the day rather than reading the clock, so it stays pure and testable;
   * resolving "today" is the caller's business.
   */
  isOpenOn(hospital: HospitalCardData, weekday: Weekday): boolean {
    if (hospital.isOpen24Hours) {
      return true;
    }

    return hospital.openingHours.some((window) => window.days.includes(weekday));
  }
}
