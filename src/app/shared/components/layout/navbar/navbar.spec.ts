import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { Navbar } from './navbar';

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

  const links = () =>
    Array.from(fixture.nativeElement.querySelectorAll('a.link')) as HTMLAnchorElement[];
  const active = () =>
    Array.from(fixture.nativeElement.querySelectorAll('a.link--active')) as HTMLAnchorElement[];

  /** Navigates and lets the router-link-active state settle. */
  const goTo = async (url: string) => {
    await router.navigateByUrl(url);
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
          { path: 'appointments', component: BlankComponent },
          { path: 'doctor/dashboard', component: BlankComponent },
          { path: 'book/:doctorId', component: BlankComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  describe('rendering', () => {
    it('renders', () => {
      expect(fixture.nativeElement.querySelector('nav')).toBeTruthy();
    });

    it('shows the brand', () => {
      expect(fixture.nativeElement.querySelector('.brand h2')?.textContent?.trim()).toBe('DocBook');
    });

    it('is a labelled navigation landmark holding a list', () => {
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;

      expect(nav.getAttribute('aria-label')).toBe('Main');
      expect(nav.querySelector('ul')).toBeTruthy();
    });
  });

  describe('navigation items', () => {
    it('offers exactly the four features', () => {
      expect(links().map((link) => link.textContent?.trim())).toEqual([
        'Home',
        'Doctors',
        'My Appointments',
        'Doctor Dashboard',
      ]);
    });

    it('points each one at its route', () => {
      expect(links().map((link) => link.getAttribute('href'))).toEqual([
        '/',
        '/doctors',
        '/appointments',
        '/doctor/dashboard',
      ]);
    });

    it('has no dead links left', () => {
      const all = Array.from(
        fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>,
      );

      expect(all.length).toBe(4);
      expect(all.every((link) => link.getAttribute('href') !== '#')).toBe(true);
    });

    it('carries none of the things this shell is not', () => {
      const text = (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

      for (const absent of ['Login', 'Register', 'Sign in', 'Profile', 'Specialties', 'About']) {
        expect(text).not.toContain(absent);
      }
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(fixture.nativeElement.querySelector('input')).toBeNull();
    });
  });

  describe('active route', () => {
    it('highlights Home at the root', async () => {
      await goTo('/');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Home']);
    });

    it('highlights only the current page', async () => {
      await goTo('/appointments');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['My Appointments']);
    });

    it('does not leave Home highlighted elsewhere', async () => {
      await goTo('/doctors');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Doctors']);
    });

    it('keeps Doctors highlighted on a doctor profile', async () => {
      await goTo('/doctors/1');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Doctors']);
    });

    it('highlights the dashboard without also matching Doctors', async () => {
      await goTo('/doctor/dashboard');

      expect(active().map((link) => link.textContent?.trim())).toEqual(['Doctor Dashboard']);
    });

    it('highlights nothing on a page that is not in the navbar', async () => {
      await goTo('/book/1');

      expect(active()).toEqual([]);
    });

    it('marks the active link for assistive tech', async () => {
      await goTo('/appointments');

      expect(active()[0].getAttribute('aria-current')).toBe('page');
      expect(links()[0].getAttribute('aria-current')).toBeNull();
    });

    it('moves the highlight as the user navigates', async () => {
      await goTo('/doctors');
      expect(active()[0].textContent?.trim()).toBe('Doctors');

      await goTo('/doctor/dashboard');
      expect(active()[0].textContent?.trim()).toBe('Doctor Dashboard');

      await goTo('/');
      expect(active()[0].textContent?.trim()).toBe('Home');
    });
  });

  describe('navigating', () => {
    it('routes when a link is followed', async () => {
      links()[2].click();
      await fixture.whenStable();

      expect(router.url).toBe('/appointments');
    });

    it('reaches every feature from the navbar', async () => {
      for (const [index, expected] of [
        [1, '/doctors'],
        [3, '/doctor/dashboard'],
        [0, '/'],
      ] as const) {
        links()[index].click();
        await fixture.whenStable();

        expect(router.url).toBe(expected);
      }
    });
  });

  describe('responsive behaviour', () => {
    it('wraps rather than hiding anything behind a menu', () => {
      const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
      const list = fixture.nativeElement.querySelector('.links') as HTMLElement;

      expect(getComputedStyle(nav).flexWrap).toBe('wrap');
      expect(getComputedStyle(list).flexWrap).toBe('wrap');
    });

    it('has no hamburger, drawer or collapse control', () => {
      expect(fixture.nativeElement.querySelector('button')).toBeNull();
      expect(fixture.nativeElement.querySelector('[aria-expanded]')).toBeNull();
      expect(fixture.nativeElement.querySelector('.drawer, .sidebar, .hamburger')).toBeNull();
    });

    it('keeps every link reachable at any width', () => {
      // Nothing is display:none at any breakpoint — the list only reflows.
      expect(links().every((link) => getComputedStyle(link).display !== 'none')).toBe(true);
    });
  });
});
