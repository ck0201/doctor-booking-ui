import { Injectable } from '@angular/core';
import { Specialty } from '../models/specialty.model';
import { SPECIALTIES } from '@mock-data/specialties.mock';

/**
 * Single access point for specialty lookups.
 * Backed by mock data during Phase 1 (ADR-008).
 */
@Injectable({ providedIn: 'root' })
export class SpecialtyService {
  getSpecialties(): readonly Specialty[] {
    return SPECIALTIES;
  }
}
