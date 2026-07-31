import { Routes } from '@angular/router';
import { roleGuard } from '@core/guards/auth.guard';
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
    path: 'hospitals',
    loadChildren: () => import('@features/hospitals/hospitals.routes'),
  },
  {
    // Read-only appointment history (ADR-019, ADR-028).
    path: 'appointments',
    loadChildren: () => import('@features/appointments/appointments.routes'),
  },
  {
    // Doctor-facing area; currently just the dashboard (ADR-019, ADR-029).
    // Guarded at the parent, so every doctor page is covered by one rule (ADR-033).
    path: 'doctor',
    canActivate: [roleGuard('doctor')],
    loadChildren: () => import('@features/doctor-dashboard/doctor-dashboard.routes'),
  },
  {
    path: 'admin',
    canActivate: [roleGuard('admin')],
    loadChildren: () => import('@features/admin/admin.routes'),
  },
  {
    // Hospital-facing portal: /hospital/login, with /hospital/welcome reserved
    // for the next phase (ADR-038). Unguarded — the sign-in is mocked in the page
    // and no hospital session exists for a guard to read.
    path: 'hospital',
    loadChildren: () => import('@features/hospital-portal/hospital-portal.routes'),
  },
  {
    // Sign-in flow: /login and /verify-otp (ADR-033).
    path: '',
    loadChildren: () => import('@features/auth/auth.routes'),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
