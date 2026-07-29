import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  readonly label: string;
  readonly route: string;
  /** Home must match exactly, or '/' would look active on every page. */
  readonly exact: boolean;
}

/**
 * Application navigation.
 *
 * Knows routes and labels and nothing else: no feature imports, no services, no
 * state. Active highlighting is RouterLinkActive's job, not this component's.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  readonly links: readonly NavLink[] = [
    { label: 'Home', route: '/', exact: true },
    { label: 'Doctors', route: '/doctors', exact: false },
    { label: 'My Appointments', route: '/appointments', exact: false },
    { label: 'Doctor Dashboard', route: '/doctor/dashboard', exact: false },
  ];
}
