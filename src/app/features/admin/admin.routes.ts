import { Routes } from '@angular/router';
import { AdminHome } from './admin-home/admin-home';

/**
 * Routes for the admin area (ADR-019). Guarded at the parent in app.routes.ts, so
 * everything under /admin is covered by one rule.
 */
export default [{ path: '', component: AdminHome, title: 'Admin' }] satisfies Routes;
