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
    path: '**',
    redirectTo: '',
  },
];
