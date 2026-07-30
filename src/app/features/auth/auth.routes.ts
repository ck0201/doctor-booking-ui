import { Routes } from '@angular/router';
import { Login } from './login/login';
import { VerifyOtp } from './verify-otp/verify-otp';

/** Routes for the auth feature (ADR-019), lazy-loaded from app.routes.ts. */
export default [
  { path: 'login', component: Login, title: 'Sign in' },
  { path: 'verify-otp', component: VerifyOtp, title: 'Verify your number' },
] satisfies Routes;
