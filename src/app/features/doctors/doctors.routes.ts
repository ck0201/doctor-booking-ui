import { inject } from '@angular/core';
import { ResolveFn, Routes } from '@angular/router';
import { DoctorService } from '@core/services/doctor.service';
import { toRouteId } from '@core/utils/route-params';
import { DoctorSearch } from './doctor-search/doctor-search';
import { DoctorDetails } from './doctor-details/doctor-details';

/** Puts the doctor's name in the browser tab, and stays honest when the id is bad. */
export const doctorTitleResolver: ResolveFn<string> = (route) => {
  const id = toRouteId(route.paramMap.get('id'));
  const doctor = id === null ? undefined : inject(DoctorService).getById(id);

  return doctor ? `${doctor.name} — ${doctor.primarySpecialty.name}` : 'Doctor not found';
};

/**
 * Routes for the doctors feature (ADR-019).
 *
 * Owned by the feature and lazy-loaded as one chunk from app.routes.ts, so the
 * landing page never downloads the search panel or the profile page.
 *
 * Default export, which is what `loadChildren: () => import(...)` consumes.
 */
export default [
  { path: '', component: DoctorSearch, title: 'Find Doctors' },
  { path: ':id', component: DoctorDetails, title: doctorTitleResolver },
] satisfies Routes;
