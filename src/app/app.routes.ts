import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
  },
  {
    // The doctors feature owns its own routes and loads on demand (ADR-019).
    path: 'doctors',
    loadChildren: () => import('@features/doctors/doctors.routes'),
  },
  {
    // Appointment booking for a doctor: /book/:doctorId (ADR-019).
    path: 'book',
    loadChildren: () => import('@features/booking/booking.routes'),
  },
  {
    // Read-only appointment history (ADR-019, ADR-028).
    path: 'appointments',
    loadChildren: () => import('@features/appointments/appointments.routes'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
