import { District, State } from '../core/models/location.model';

/**
 * Phase 1 mock data — replaced by GET /api/locations later.
 * Never import this directly from a component; go through LocationService.
 *
 * ADR-004: the MVP launches in Uttar Pradesh only, so the state is fixed and
 * rendered read-only in the UI.
 */
export const LAUNCH_STATE: State = { id: 9, name: 'Uttar Pradesh' };

/**
 * Cities are nested inside their district so the relationship is obvious and
 * cannot drift. LocationService is responsible for exposing them flat.
 */
export const DISTRICTS: readonly District[] = [
  {
    id: 1,
    name: 'Deoria',
    stateId: LAUNCH_STATE.id,
    cities: [
      { id: 101, name: 'Deoria', districtId: 1 },
      { id: 102, name: 'Salempur', districtId: 1 },
      { id: 103, name: 'Barhaj', districtId: 1 },
      { id: 104, name: 'Rudrapur', districtId: 1 },
    ],
  },
  {
    id: 2,
    name: 'Gorakhpur',
    stateId: LAUNCH_STATE.id,
    cities: [
      { id: 201, name: 'Gorakhpur', districtId: 2 },
      { id: 202, name: 'Bansgaon', districtId: 2 },
      { id: 203, name: 'Campierganj', districtId: 2 },
      { id: 204, name: 'Sahjanwa', districtId: 2 },
    ],
  },
];
