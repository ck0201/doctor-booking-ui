import { City, District, State } from './location.model';
import { Specialty } from './specialty.model';

/**
 * Filters collected by the Hospital search panel.
 * Same shape and intent as DoctorSearchCriteria (ADR-006, ADR-021).
 */
export interface HospitalSearchCriteria {
  readonly hospitalName: string;
  readonly state: State;
  readonly district: District | null;
  readonly city: City | null;
  /** Optional: matched against the hospital's departments. */
  readonly specialty: Specialty | null;
}
