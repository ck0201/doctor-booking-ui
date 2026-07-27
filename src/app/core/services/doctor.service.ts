import { Injectable } from '@angular/core';
import { DoctorCardData } from '../models/doctor.model';
import { DoctorSearchCriteria } from '../models/doctor-search-criteria.model';
import { DOCTORS } from '@mock-data/doctors.mock';

/**
 * Single access point for doctor data.
 * Backed by mock data during Phase 1 (ADR-008); `search` becomes
 * POST /api/doctors/search without the caller changing.
 */
@Injectable({ providedIn: 'root' })
export class DoctorService {
  getDoctors(): readonly DoctorCardData[] {
    return DOCTORS;
  }

  /**
   * Every criterion is optional and narrows the result set.
   * State is not filtered on — the MVP is single-state (ADR-004).
   */
  search(criteria: DoctorSearchCriteria): readonly DoctorCardData[] {
    const name = criteria.doctorName.trim().toLowerCase();

    return DOCTORS.filter((doctor) => {
      if (name && !doctor.name.toLowerCase().includes(name)) {
        return false;
      }
      if (criteria.specialty && doctor.primarySpecialty.id !== criteria.specialty.id) {
        return false;
      }
      if (criteria.district && doctor.practice?.city.districtId !== criteria.district.id) {
        return false;
      }
      if (criteria.city && doctor.practice?.city.id !== criteria.city.id) {
        return false;
      }
      return true;
    });
  }
}
