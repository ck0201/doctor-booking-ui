import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { HospitalService } from '@core/services/hospital.service';
import { toRouteId } from '@core/utils/route-params';
import { HospitalSearch } from './hospital-search/hospital-search';
import { HospitalDetails } from './hospital-details/hospital-details';

/** Puts the hospital's name in the tab, and stays honest when the id is bad. */
export const hospitalTitleResolver: ResolveFn<string> = (route) => {
  const id = toRouteId(route.paramMap.get('hospitalId'));
  const hospital = id === null ? undefined : inject(HospitalService).getById(id);

  return hospital ? `${hospital.name} — ${hospital.address.city.name}` : 'Hospital not found';
};

/**
 * Routes for the hospitals feature (ADR-019): owned by the feature and
 * lazy-loaded as one chunk from app.routes.ts.
 */
export default [
  { path: '', component: HospitalSearch, title: 'Find Hospitals' },
  { path: ':hospitalId', component: HospitalDetails, title: hospitalTitleResolver },
] satisfies Routes;
