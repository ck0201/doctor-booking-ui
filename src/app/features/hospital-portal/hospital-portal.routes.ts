import { Routes } from '@angular/router';
import { HospitalLogin } from './hospital-login/hospital-login';
import { HospitalWelcome } from './hospital-welcome/hospital-welcome';
import { HospitalSetup } from './hospital-setup/hospital-setup';
import { HospitalDepartments } from './hospital-departments/hospital-departments';

/**
 * The hospital-facing portal, owned by the feature and lazy-loaded (ADR-019).
 *
 * No guard: the sign-in is mocked inside the login page and establishes no
 * session, so there is nothing for a guard to read. Guarding this group is part
 * of building the portal itself.
 */
export default [
  { path: 'login', component: HospitalLogin, title: 'Hospital Sign In' },
  { path: 'welcome', component: HospitalWelcome, title: 'Welcome' },
  { path: 'setup', component: HospitalSetup, title: 'Hospital Setup' },
  { path: 'setup/departments', component: HospitalDepartments, title: 'Departments' },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
] satisfies Routes;
