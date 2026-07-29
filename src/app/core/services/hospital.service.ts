import { Injectable } from '@angular/core';
import { Hospital, HospitalCardData, Weekday } from '../models/hospital.model';
import { HospitalSearchCriteria } from '../models/hospital-search-criteria.model';
import { HOSPITALS } from '@mock-data/hospitals.mock';

/**
 * Single access point for hospital data.
 *
 * Same shape as DoctorService (ADR-008, ADR-020): list operations return the
 * narrow HospitalCardData, only getById returns the full Hospital, and `search`
 * becomes POST /api/hospitals/search without the caller changing.
 */
@Injectable({ providedIn: 'root' })
export class HospitalService {
  getHospitals(): readonly HospitalCardData[] {
    return HOSPITALS;
  }

  /** The full profile. Undefined for an unknown id — callers render not-found. */
  getById(id: number): Hospital | undefined {
    return HOSPITALS.find((hospital) => hospital.id === id);
  }

  /**
   * Every criterion is optional and narrows the result set.
   * State is not filtered on — the MVP is single-state (ADR-004).
   */
  search(criteria: HospitalSearchCriteria): readonly HospitalCardData[] {
    const name = criteria.hospitalName.trim().toLowerCase();

    return HOSPITALS.filter((hospital) => {
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
      return HOSPITALS;
    }

    return HOSPITALS.filter(
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
