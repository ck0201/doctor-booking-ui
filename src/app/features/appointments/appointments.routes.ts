import { Routes } from '@angular/router';
import { AppointmentHistory } from './appointment-history/appointment-history';

/**
 * Routes for the appointments feature (ADR-019): owned by the feature and
 * lazy-loaded as one chunk from app.routes.ts.
 */
export default [
  { path: '', component: AppointmentHistory, title: 'My Appointments' },
] satisfies Routes;
