import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Navbar } from './navbar';
import { AuthService } from '@core/services/auth.service';
import { UserRole } from '@core/models/auth.model';

@Component({ template: '' })
class BlankComponent {}

@Component({
  imports: [Navbar],
  template: `<app-navbar />`,
})
class HostComponent {}

describe('Navbar', () => {
  let fixture: ComponentFixture<HostComponent>;
  let router: Router;
  let auth: AuthService;

  const links = () =>
    Array.from(fixture.nativeElement.querySelectorAll('a.link')) as HTMLAnchorElement[];
  const labels = () => links().map((link) => link.textContent?.trim());
  const active = () =>
    Array.from(fixture.nativeElement.querySelectorAll('a.link--active')) as HTMLAnchorElement[];
  const logout = () =>
    fixture.nativeElement.querySelector('[data-testid="logout"]') as HTMLButtonElement | null;

  const goTo = async (url: string) => {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  };

  /** Signs in through the real service, so the navbar sees a genuine session. */
  const signInAs = (role: UserRole) => {
    auth.requestOtp('9876543210');
    auth.verifyOtp('123456');
    auth.loginAs(role);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          { path: 'doctors', component: BlankComponent },
          { path: 'doctors/:id', component: BlankComponent },
          { path: 'hospitals', component: BlankComponent },
          { path: 'appointments', component: BlankComponent },
          { path: 'doctor/dashboard', component: BlankComponent },
          { path: 'admin', component: BlankComponent },
          { path: 'login', component: BlankComponent },
          { path: 'book/:doctorId', component: BlankComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
  });

  afterEach(() => auth.logout());

  describe('rendering', () => {
    it('renders as a labelled navigation landmark', () => {
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

      expect(nav.getAttribute('aria-label')).toBe('Main');
      expect(nav.querySelector('ul')).toBeTruthy();
    });

    it('shows the brand', () => {
      expect(fixture.nativeElement.querySelector('.brand h2')?.textContent?.trim()).toBe('DocBook');
    });

    it('has no dead links', () => {
      expect(links().every((link) => link.getAttribute('href') !== '#')).toBe(true);
    });
  });

  describe('logged out', () => {
    it('offers the public pages and a way in', () => {
      expect(labels()).toEqual(['Home', 'Doctors', 'Hospitals', 'Login']);
      expect(links().map((link) => link.getAttribute('href'))).toEqual([
        '/',
        '/doctors',
        '/hospitals',
        '/login',
      ]);
    });

    it('offers no logout and nothing private', () => {
      expect(logout()).toBeNull();
      expect(labels()).not.toContain('My Appointments');
      expect(labels()).not.toContain('Dashboard');
      expect(labels()).not.toContain('Admin');
    });
  });

  describe('signed in as a patient', () => {
    beforeEach(() => signInAs('patient'));

    it('adds appointments and swaps Login for Logout', () => {
      expect(labels()).toEqual(['Home', 'Doctors', 'Hospitals', 'My Appointments']);
      expect(labels()).not.toContain('Login');
      expect(logout()).toBeTruthy();
    });

    it('offers nothing belonging to another role', () => {
      expect(labels()).not.toContain('Dashboard');
      expect(labels()).not.toContain('Admin');
    });
  });

  describe('signed in as a doctor', () => {
    beforeEach(() => signInAs('doctor'));

    it('offers only the dashboard and logout', () => {
      expect(labels()).toEqual(['Dashboard']);
      expect(links()[0].getAttribute('href')).toBe('/doctor/dashboard');
      expect(logout()).toBeTruthy();
    });

    it('offers no patient pages', () => {
      expect(labels()).not.toContain('My Appointments');
      expect(labels()).not.toContain('Doctors');
    });
  });

  describe('signed in as an admin', () => {
    beforeEach(() => signInAs('admin'));

    it('offers only admin and logout', () => {
      expect(labels()).toEqual(['Admin']);
      expect(links()[0].getAttribute('href')).toBe('/admin');
      expect(logout()).toBeTruthy();
    });
  });

  describe('logging out', () => {
    it('returns to the logged-out links', async () => {
      signInAs('doctor');
      expect(labels()).toEqual(['Dashboard']);

      logout()!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(labels()).toEqual(['Home', 'Doctors', 'Hospitals', 'Login']);
      expect(logout()).toBeNull();
    });

    it('ends the session and returns home', async () => {
      signInAs('patient');

      logout()!.click();
      await fixture.whenStable();

      expect(auth.isAuthenticated()).toBe(false);
      expect(router.url).toBe('/');
    });
  });

  describe('active route', () => {
    it('highlights Home only at the root', async () => {
      await goTo('/');
      expect(active().map((link) => link.textContent?.trim())).toEqual(['Home']);

      await goTo('/doctors');
      expect(active().map((link) => link.textContent?.trim())).toEqual(['Doctors']);
    });

    it('keeps Doctors highlighted on a doctor profile', async () => {
      await goTo('/doctors/1');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Doctors']);
    });

    it('highlights Hospitals on the hospital pages', async () => {
      await goTo('/hospitals');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Hospitals']);
    });

    it('highlights the dashboard for a signed-in doctor', async () => {
      signInAs('doctor');
      await goTo('/doctor/dashboard');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Dashboard']);
    });

    it('highlights nothing on a page that is not in the navbar', async () => {
      await goTo('/book/1');

      expect(active()).toEqual([]);
    });

    it('marks the active link for assistive tech', async () => {
      await goTo('/doctors');

      expect(active()[0].getAttribute('aria-current')).toBe('page');
      expect(links()[0].getAttribute('aria-current')).toBeNull();
    });
  });

  describe('navigating', () => {
    it('routes when a link is followed', async () => {
      links()[2].click();
      await fixture.whenStable();

      expect(router.url).toBe('/hospitals');
    });

    it('reaches the sign-in page from the navbar', async () => {
      links()[3].click();
      await fixture.whenStable();

      expect(router.url).toBe('/login');
    });
  });

  describe('responsive behaviour', () => {
    it('wraps rather than hiding anything behind a menu', () => {
      expect(
        getComputedStyle(fixture.nativeElement.querySelector('.links') as HTMLElement).flexWrap,
      ).toBe('wrap');
    });

    it('has no hamburger, drawer or collapse control', () => {
      expect(fixture.nativeElement.querySelector('[aria-expanded]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.drawer, .sidebar, .hamburger')).toBeNull();
    });
  });
});
