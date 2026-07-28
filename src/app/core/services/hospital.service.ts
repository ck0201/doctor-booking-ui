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
