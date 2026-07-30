import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';
import { HospitalRegistration } from './hospital-registration/hospital-registration';
import { HospitalManagement } from './hospital-management/hospital-management';
import { DoctorRegistration } from './doctor-registration/doctor-registration';

/**
 * Routes for the admin area (ADR-019). Guarded at the parent in app.routes.ts, so
 * everything under /admin is covered by one rule (ADR-033) — including this one.
 */
export default [
  { path: '', component: AdminDashboard, title: 'Admin' },
  { path: 'hospitals/new', component: HospitalRegistration, title: 'Register Hospital' },
  { path: 'hospitals/:id/manage', component: HospitalManagement, title: 'Manage Hospital' },
  { path: 'doctors/new', component: DoctorRegistration, title: 'Register Doctor' },
] satisfies Routes;
