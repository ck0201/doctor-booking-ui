import { Routes } from '@angular/router';
import { AdminDashboard } from './admin-dashboard/admin-dashboard';

/**
 * Routes for the admin area (ADR-019). Guarded at the parent in app.routes.ts, so
 * everything under /admin is covered by one rule (ADR-033).
 */
export default [{ path: '', component: AdminDashboard, title: 'Admin' }] satisfies Routes;
