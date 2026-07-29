import { Routes } from '@angular/router';
import { DoctorDashboard } from './doctor-dashboard';

/**
 * Routes for the doctor-facing area (ADR-019): owned by the feature and
 * lazy-loaded as one chunk from app.routes.ts, which maps the `doctor` segment.
 *
 * Nested rather than a single flat path so a second doctor page needs a line
 * here and nothing in app.routes.ts.
 */
export default [
  { path: 'dashboard', component: DoctorDashboard, title: 'Doctor Dashboard' },
] satisfies Routes;
