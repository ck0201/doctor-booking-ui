import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { UserRole } from '@core/models/auth.model';
import { AuthService } from '@core/services/auth.service';

interface NavLink {
  readonly label: string;
  readonly route: string;
  /** Home must match exactly, or '/' would look active on every page. */
  readonly exact: boolean;
}

const HOME: NavLink = { label: 'Home', route: '/', exact: true };
const DOCTORS: NavLink = { label: 'Doctors', route: '/doctors', exact: false };
const HOSPITALS: NavLink = { label: 'Hospitals', route: '/hospitals', exact: false };
const APPOINTMENTS: NavLink = { label: 'My Appointments', route: '/appointments', exact: false };
const DASHBOARD: NavLink = { label: 'Dashboard', route: '/doctor/dashboard', exact: false };
const ADMIN: NavLink = { label: 'Admin', route: '/admin', exact: false };
const LOGIN: NavLink = { label: 'Login', route: '/login', exact: false };

/** What each signed-in role sees. Logged out is the public set plus Login. */
const LINKS_BY_ROLE: Readonly<Record<UserRole, readonly NavLink[]>> = {
  patient: [HOME, DOCTORS, HOSPITALS, APPOINTMENTS],
  doctor: [DASHBOARD],
  admin: [ADMIN],
};

/**
 * Application navigation.
 *
 * Knows routes, labels and the current role — no feature imports and no state of
 * its own. Active highlighting stays RouterLinkActive's job (ADR-030).
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isAuthenticated = this.auth.isAuthenticated;

  readonly links = computed<readonly NavLink[]>(() => {
    const role = this.auth.currentRole();
    return role === null ? [HOME, DOCTORS, HOSPITALS, LOGIN] : LINKS_BY_ROLE[role];
  });

  logout(): Promise<boolean> {
    this.auth.logout();
    return this.router.navigateByUrl('/');
  }
}
