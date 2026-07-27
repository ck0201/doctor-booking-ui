import { Specialty } from '../core/models/specialty.model';

/**
 * Phase 1 mock data — replaced by GET /api/specialties later.
 * Never import this directly from a component; go through SpecialtyService.
 */
export const SPECIALTIES: readonly Specialty[] = [
  { id: 1, name: 'Cardiologist' },
  { id: 2, name: 'Dentist' },
  { id: 3, name: 'Dermatologist' },
  { id: 4, name: 'Diabetologist' },
  { id: 5, name: 'ENT Specialist' },
  { id: 6, name: 'Eye Specialist' },
  { id: 7, name: 'Gastroenterologist' },
  { id: 8, name: 'General Physician' },
  { id: 9, name: 'Gynecologist' },
  { id: 10, name: 'Neurologist' },
  { id: 11, name: 'Orthopedic' },
  { id: 12, name: 'Pediatrician' },
  { id: 13, name: 'Psychiatrist' },
  { id: 14, name: 'Pulmonologist' },
  { id: 15, name: 'Urologist' },
];
