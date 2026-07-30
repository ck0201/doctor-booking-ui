import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { HospitalRegistration } from './hospital-registration/hospital-registration';

/**
 * Routes for the admin area (ADR-019). Guarded at the parent in app.routes.ts, so
 * everything under /admin is covered by one rule (ADR-033) — including this one.
 */
export default [
  { path: '', component: AdminDashboard, title: 'Admin' },
  { path: 'hospitals/new', component: HospitalRegistration, title: 'Register Hospital' },
] satisfies Routes;
