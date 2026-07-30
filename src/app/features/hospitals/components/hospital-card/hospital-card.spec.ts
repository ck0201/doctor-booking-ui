import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HospitalCard } from './hospital-card';
import { HospitalCardData } from '@core/models/hospital.model';

const DEORIA = { id: 101, name: 'Deoria', districtId: 1 };
const DEORIA_DISTRICT = { id: 1, name: 'Deoria', stateId: 9, cities: [DEORIA] };

const HOSPITAL: HospitalCardData = {
  id: 1,
  name: 'Sanjeevani Heart Centre',
  rating: { value: 4.7, reviewCount: 168 },
  address: {
    line: 'Civil Lines, near Collectorate, Deoria',
    city: DEORIA,
    district: DEORIA_DISTRICT,
  },
  departments: [
    { id: 1, name: 'Cardiologist' },
    { id: 8, name: 'General Physician' },
  ],
  doctorCount: 2,
  openingHours: [{ days: ['Mon', 'Tue'], opensAt: '09:00 AM', closesAt: '05:00 PM' }],
  isOpen24Hours: false,
};

@Component({
  imports: [HospitalCard],
  template: `
    <app-hospital-card [hospital]="hospital()" [detailsRoute]="route()" [headingLevel]="2" />
  `,
})
class HostComponent {
  readonly hospital = signal<HospitalCardData>(HOSPITAL);
  readonly route = signal<unknown[]>(['/hospitals', 1]);
}

describe('HospitalCard', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the name, city and short address', () => {
    expect(query('[data-testid="name"]')?.textContent?.trim()).toBe('Sanjeevani Heart Centre');
    expect(query('[data-testid="city"]')?.textContent?.trim()).toBe('Deoria');
    expect(query('[data-testid="address"]')?.textContent?.trim()).toBe(
      'Civil Lines, near Collectorate, Deoria',
    );
  });

  it('shows the rating through the shared component', () => {
    expect(query('app-rating-stars')).toBeTruthy();
    expect(text()).toContain('4.7');
    expect(text()).toContain('168');
  });

  it('omits the rating when the hospital has none', () => {
    host.hospital.set({ ...HOSPITAL, rating: undefined });
    fixture.detectChanges();

    expect(query('app-rating-stars')).toBeNull();
  });

  it('shows how many doctors practise there, pluralised', () => {
    expect(query('[data-testid="doctor-count"]')?.textContent?.trim()).toBe('2 doctors');

    host.hospital.set({ ...HOSPITAL, doctorCount: 1 });
    fixture.detectChanges();

    expect(query('[data-testid="doctor-count"]')?.textContent?.trim()).toBe('1 doctor');
  });

  it('summarises the departments through the shared tag list', () => {
    expect(query('app-tag-list')).toBeTruthy();
    expect(text()).toContain('Cardiologist');
    expect(text()).toContain('General Physician');
    expect(query('[data-testid="more-departments"]')).toBeNull();
  });

  it('caps the departments shown and counts the rest', () => {
    host.hospital.set({
      ...HOSPITAL,
      departments: [
        { id: 1, name: 'Cardiologist' },
        { id: 2, name: 'Dentist' },
        { id: 3, name: 'Dermatologist' },
        { id: 5, name: 'ENT Specialist' },
        { id: 6, name: 'Eye Specialist' },
      ],
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.tag').length).toBe(3);
    expect(query('[data-testid="more-departments"]')?.textContent?.trim()).toBe('+2 more');
  });

  it('uses the shared avatar for the logo', () => {
    expect(query('app-avatar')).toBeTruthy();
    expect(query('.avatar-initials')?.textContent?.trim()).toBe('SC');
  });

  it('flags a round-the-clock hospital', () => {
    expect(text()).not.toContain('Open 24 hours');

    host.hospital.set({ ...HOSPITAL, isOpen24Hours: true, openingHours: [] });
    fixture.detectChanges();

    expect(text()).toContain('Open 24 hours');
  });

  it('exposes the name as a heading of the requested rank', () => {
    const heading = query('[data-testid="name"]')!;

    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('2');
  });

  it('links View Details at the hospital profile', () => {
    const cta = query('[data-testid="view-details"]')!;

    expect(cta.tagName).toBe('A');
    expect(cta.getAttribute('href')).toBe('/hospitals/1');
    expect(cta.hasAttribute('disabled')).toBe(false);
  });

  it('follows whichever hospital it was given', () => {
    host.route.set(['/hospitals', 9]);
    fixture.detectChanges();

    expect(query('[data-testid="view-details"]')?.getAttribute('href')).toBe('/hospitals/9');
  });

  it('shows no booking action', () => {
    expect(text()).not.toContain('Book');
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(0);
  });
});
