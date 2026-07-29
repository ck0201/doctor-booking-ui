import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { App } from './app';

@Component({ template: '<p class="page">A feature page</p>' })
class PageComponent {}

/**
 * The shell's job: render the navbar once, above whatever the router puts in the
 * outlet, on every route.
 */
describe('App', () => {
  let fixture: ComponentFixture<App>;
  let router: Router;

  const navbars = () => fixture.nativeElement.querySelectorAll('app-navbar');

  const goTo = async (url: string) => {
    await router.navigateByUrl(url);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: '', component: PageComponent },
          { path: 'doctors', component: PageComponent },
          { path: 'appointments', component: PageComponent },
          { path: 'doctor/dashboard', component: PageComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(App);
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  it('renders the navbar', () => {
    expect(navbars().length).toBe(1);
    expect(fixture.nativeElement.querySelector('app-navbar nav')).toBeTruthy();
  });

  it('renders the navbar above the routed page', async () => {
    await goTo('/doctors');

    const children = Array.from(fixture.nativeElement.children as HTMLCollection).map((node) =>
      node.tagName.toLowerCase(),
    );

    expect(children.indexOf('app-navbar')).toBeLessThan(children.indexOf('router-outlet'));
  });

  it('keeps exactly one navbar on every route', async () => {
    for (const url of ['/', '/doctors', '/appointments', '/doctor/dashboard']) {
      await goTo(url);

      expect(navbars().length).toBe(1);
      expect(fixture.nativeElement.querySelector('.page')).toBeTruthy();
    }
  });

  it('does not rebuild the navbar as the user navigates', async () => {
    await goTo('/doctors');
    const first = navbars()[0];

    await goTo('/appointments');

    expect(navbars()[0]).toBe(first);
  });

  it('has a router outlet for the features to load into', () => {
    expect(fixture.nativeElement.querySelector('router-outlet')).toBeTruthy();
  });
});
