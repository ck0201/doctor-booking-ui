import { Routes } from '@angular/router';
import { HospitalSearch } from './hospital-search/hospital-search';

/**
 * Routes for the hospitals feature (ADR-019): owned by the feature and
 * lazy-loaded as one chunk from app.routes.ts.
 */
export default [{ path: '', component: HospitalSearch, title: 'Find Hospitals' }] satisfies Routes;
