import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Hospital,
  HospitalCardData,
  HospitalType,
  OpeningHours,
  Weekday,
} from '../models/hospital.model';
import { HospitalSearchCriteria } from '../models/hospital-search-criteria.model';
import { City, District } from '../models/location.model';
import { Specialty } from '../models/specialty.model';
import { DISTRICTS } from '@mock-data/locations.mock';
import { SPECIALTIES } from '@mock-data/specialties.mock';
import { HOSPITALS } from '@mock-data/hospitals.mock';
import { DoctorService } from './doctor.service';

/**
 * Single access point for hospital data.
 *
 * Same shape as DoctorService (ADR-008, ADR-020): list operations return the
 * narrow HospitalCardData, only getById returns the full Hospital, and `search`
 * becomes POST /api/hospitals/search without the caller changing.
 */

/** Ceilings the management page enforces, kept with the rules they belong to. */
export const MAX_DEPARTMENTS = 30;
export const MAX_FACILITIES = 30;

/** The first hospital account code issued, continuing as HSP-100002 and so on. */
export const HOSPITAL_CODE_START = 100001;

/** The operational profile the management page owns (ADR-036). */
export interface HospitalProfileUpdate {
  readonly openingHours: readonly OpeningHours[];
  /** Free text; the service turns each into a Specialty. */
  readonly departmentNames: readonly string[];
  readonly facilityNames: readonly string[];
}

/**
 * What creating a hospital account needs — and nothing else (ADR-035).
 *
 * Registration captures who the hospital is and how to reach them. Anything
 * describing what it does or how well it does it belongs to profile completion,
 * so description and rating are deliberately absent: a draft cannot carry a
 * claim the form never asked for.
 */
export interface HospitalDraft {
  readonly name: string;
  readonly city: City;
  readonly hospitalType?: HospitalType;
  readonly contactPerson?: string;
  readonly registrationNumber?: string;
  readonly addressLine?: string;
  readonly contactNumber?: string;
  readonly email?: string;
  readonly website?: string;
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

  private readonly doctorService = inject(DoctorService);

  /**
   * The stored hospitals with doctorCount recomputed from the doctors who list a
   * practice there (ADR-025). Derived at read time rather than stored, so a
   * doctor registered by an admin moves every count at once (ADR-037).
   *
   * A computed, so repeated reads keep object identity until something changes.
   */
  private readonly view = computed<readonly Hospital[]>(() =>
    this.store().map((hospital) => {
      const doctorCount = this.doctorService.getByHospital(hospital.id).length;
      return doctorCount === hospital.doctorCount ? hospital : { ...hospital, doctorCount };
    }),
  );

  /** Reactive view for pages that must follow additions. */
  readonly hospitals = computed<readonly HospitalCardData[]>(() => this.view());

  private all(): readonly Hospital[] {
    return this.view();
  }

  /**
   * Registers a hospital and returns it.
   *
   * In memory only, like the session in ADR-033: a refresh restores the mock. The
   * id continues the mock's sequence, so it cannot collide with a seeded one.
   *
   * Everything registration does not collect starts at its default — no
   * departments, facilities or opening hours, no description, no rating, and no
   * doctors, because doctorCount is derived from practices that reference it
   * (ADR-025). Those are filled in later during profile completion.
   */
  addHospital(draft: HospitalDraft): Hospital {
    const hospital: Hospital = {
      id: this.nextId(),
      hospitalCode: `HSP-${this.nextCodeNumber++}`,
      name: draft.name.trim(),
      address: {
        line: draft.addressLine?.trim() ?? '',
        city: draft.city,
        district: this.districtOf(draft.city),
      },
      departments: [],
      doctorCount: 0,
      openingHours: [],
      isOpen24Hours: false,
      description: '',
      hospitalType: draft.hospitalType,
      contactPerson: draft.contactPerson?.trim() || undefined,
      registrationNumber: draft.registrationNumber?.trim() || undefined,
      facilities: [],
      contactNumber: draft.contactNumber?.trim() ?? '',
      email: draft.email?.trim() || undefined,
      website: draft.website?.trim() || undefined,
    };

    this.store.update((hospitals) => [...hospitals, hospital]);
    return hospital;
  }

  /**
   * Replaces the operational profile of one hospital (ADR-036).
   *
   * Only the three sections the management page owns are written; everything else
   * — name, address, rating, contact, doctorCount — is carried through untouched.
   * Unknown ids are ignored rather than throwing, so a stale link cannot break
   * the caller.
   */
  updateHospitalProfile(id: number, profile: HospitalProfileUpdate): Hospital | undefined {
    const existing = this.getById(id);
    if (!existing) {
      return undefined;
    }

    const updated: Hospital = {
      ...existing,
      openingHours: profile.openingHours,
      departments: profile.departmentNames.map((name) => this.resolveDepartment(name)),
      facilities: profile.facilityNames.map((name) => name.trim()),
      // A hospital open every day, all day, is recorded as the flag rather than
      // seven windows, which is how the seeded data expresses it (ADR-025).
      isOpen24Hours: existing.isOpen24Hours,
    };

    this.store.update((hospitals) =>
      hospitals.map((hospital) => (hospital.id === id ? updated : hospital)),
    );
    return updated;
  }

  /**
   * A department is a Specialty, so free text has to become one.
   *
   * An existing specialty is reused when the name matches, which keeps hospital
   * search by department working; a genuinely new name gets its own id.
   */
  private resolveDepartment(name: string): Specialty {
    const trimmed = name.trim();
    const known = SPECIALTIES.find(
      (specialty) => specialty.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (known) {
      return known;
    }

    const custom = this.customDepartments.get(trimmed.toLowerCase());
    if (custom) {
      return custom;
    }

    const created: Specialty = { id: this.nextDepartmentId++, name: trimmed };
    this.customDepartments.set(trimmed.toLowerCase(), created);
    return created;
  }

  /** Departments coined by an admin, so the same name keeps the same id. */
  private readonly customDepartments = new Map<string, Specialty>();

  private nextDepartmentId =
    SPECIALTIES.reduce((highest, specialty) => Math.max(highest, specialty.id), 0) + 1;

  /**
   * The next account code, a counter like nextDepartmentId above.
   *
   * The seeded hospitals carry no code, so the sequence starts clean and cannot
   * collide with them. In memory only, like the store itself (ADR-035).
   */
  private nextCodeNumber = HOSPITAL_CODE_START;

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
