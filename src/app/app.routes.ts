import { Routes } from '@angular/router';
import { Landing } from './features/landing/landing';
import { Doctors } from './features/doctors/doctors';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
  },
  {
    path: 'doctors',
    component: Doctors,
  },
  {
    path: '**',
    redirectTo: '',
  },
];
