import { Injectable } from '@angular/core';
import { City, District, State } from '../models/location.model';
import { DISTRICTS, LAUNCH_STATE } from '@mock-data/locations.mock';

/**
 * Single access point for location lookups.
 *
 * Components depend on this service, never on the mock file, so swapping the
 * mock for HTTP calls later is a change contained in this class (ADR-008).
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  /** ADR-004: MVP is Uttar Pradesh only, so the state is not selectable. */
  readonly launchState: State = LAUNCH_STATE;

  getDistricts(): readonly District[] {
    return DISTRICTS;
  }

  /** Cities of a district; empty when no district is selected. */
  getCities(districtId: number | null | undefined): readonly City[] {
    if (districtId == null) {
      return [];
    }

    return DISTRICTS.find((district) => district.id === districtId)?.cities ?? [];
  }
}
