import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Breadcrumb, Breadcrumbs } from './breadcrumbs';

@Component({
  imports: [Breadcrumbs],
  template: `<app-breadcrumbs [items]="items()" />`,
})
class HostComponent {
  readonly items = signal<readonly Breadcrumb[]>([
    { label: 'Home', route: ['/'] },
    { label: 'Find Doctors', route: ['/doctors'] },
    { label: 'Dr. Asha Verma' },
  ]);
}

describe('Breadcrumbs', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const crumbs = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.breadcrumbs-item')) as HTMLElement[];
  const links = () =>
    Array.from(fixture.nativeElement.querySelectorAll('a.breadcrumbs-link')) as HTMLAnchorElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one item per crumb', () => {
    expect(crumbs().length).toBe(3);
  });

  it('links every crumb except the current page', () => {
    expect(links().map((link) => link.getAttribute('href'))).toEqual(['/', '/doctors']);
  });

  it('marks the last crumb as the current page', () => {
    const current = fixture.nativeElement.querySelector('[aria-current="page"]') as HTMLElement;

    expect(current.textContent?.trim()).toBe('Dr. Asha Verma');
  });

  it('never links the last crumb, even when given a route', () => {
    host.items.set([
      { label: 'Home', route: ['/'] },
      { label: 'Find Doctors', route: ['/doctors'] },
    ]);
    fixture.detectChanges();

    expect(links().map((link) => link.getAttribute('href'))).toEqual(['/']);
  });

  it('exposes the trail as a labelled navigation landmark', () => {
    expect(fixture.nativeElement.querySelector('nav[aria-label="Breadcrumb"]')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('ol')).toBeTruthy();
  });

  it('separates crumbs without announcing the separator', () => {
    const separators = fixture.nativeElement.querySelectorAll('.breadcrumbs-separator');

    expect(separators.length).toBe(2);
    expect(separators[0].getAttribute('aria-hidden')).toBe('true');
  });
});
