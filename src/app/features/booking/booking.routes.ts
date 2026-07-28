import { Routes } from '@angular/router';
import { AppointmentBooking } from './appointment-booking/appointment-booking';

/**
 * Routes for the booking feature (ADR-019): owned by the feature and
 * lazy-loaded as one chunk from app.routes.ts.
 */
export default [
  { path: ':doctorId', component: AppointmentBooking, title: 'Book an Appointment' },
] satisfies Routes;
