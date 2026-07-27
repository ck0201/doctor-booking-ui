import { City, District, State } from './location.model';
import { Specialty } from './specialty.model';

/**
 * Filters collected by the Doctors search panel.
 *
 * This is the UI-facing shape. When POST /api/doctors/search is wired up it
 * will be mapped to a request DTO of ids inside DoctorService, so the search
 * panel never has to change.
 */
export interface DoctorSearchCriteria {
  readonly doctorName: string;
  readonly specialty: Specialty | null;
  readonly state: State;
  readonly district: District | null;
  readonly city: City | null;
}
