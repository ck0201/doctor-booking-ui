import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { DoctorCard } from './doctor-card';
import { DoctorCardData, DoctorCardField } from '@core/models/doctor.model';

const FULL_DOCTOR: DoctorCardData = {
  id: 1,
  name: 'Dr. Asha Verma',
  primarySpecialty: { id: 1, name: 'Cardiologist' },
  qualifications: 'MBBS, MD (Cardiology)',
  experienceYears: 14,
  rating: { value: 4.8, reviewCount: 212 },
  consultationFee: 700,
  practice: {
    hospitalName: 'Sanjeevani Heart Centre',
    city: { id: 101, name: 'Deoria', districtId: 1 },
  },
  availability: { isAvailableToday: true },
  isVerified: true,
};

/** Only the three required fields — the recommendation-rail case. */
const SPARSE_DOCTOR: DoctorCardData = {
  id: 2,
  name: 'Dr. Ritu Sahani',
  primarySpecialty: { id: 13, name: 'Psychiatrist' },
};

@Component({
  imports: [DoctorCard],
  template: `
    <app-doctor-card [doctor]="doctor()" [omit]="omit()" [detailsRoute]="route()">
      @if (withActions()) {
        <button doctorCardActions>Book</button>
      }
    </app-doctor-card>
  `,
})
class HostComponent {
  readonly doctor = signal<DoctorCardData>(FULL_DOCTOR);
  readonly omit = signal<readonly DoctorCardField[]>([]);
  readonly route = signal<unknown[] | null>(null);
  readonly withActions = signal(false);
}

/** Gives RouterLink somewhere to land, so clicking a link cannot reject after teardown. */
@Component({ template: '' })
class BlankRouteComponent {}

describe('DoctorCard', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');
  const query = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([{ path: '**', component: BlankRouteComponent }])],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the mandatory fields', () => {
    expect(text()).toContain('Dr. Asha Verma');
    expect(text()).toContain('Cardiologist');
  });

  it('renders every optional field when the data is present', () => {
    expect(text()).toContain('MBBS, MD (Cardiology)');
    expect(text()).toContain('14 yrs experience');
    expect(text()).toContain('4.8');
    expect(text()).toContain('212');
    expect(text()).toContain('₹700');
    expect(text()).toContain('Sanjeevani Heart Centre');
    expect(text()).toContain('Deoria');
    expect(text()).toContain('Available today');
    expect(text()).toContain('Verified');
  });

  it('degrades to name and specialty when optional data is missing', () => {
    host.doctor.set(SPARSE_DOCTOR);
    fixture.detectChanges();

    expect(text()).toContain('Dr. Ritu Sahani');
    expect(text()).toContain('Psychiatrist');
    expect(query('.card-qualifications')).toBeNull();
    expect(query('.card-rating')).toBeNull();
    expect(query('.card-fee')).toBeNull();
    expect(query('.card-practice')).toBeNull();
    expect(query('.card-availability')).toBeNull();
    expect(query('.badge--verified')).toBeNull();
  });

  it('hides only the omitted regions', () => {
    host.omit.set(['practice', 'fee']);
    fixture.detectChanges();

    expect(query('.card-practice')).toBeNull();
    expect(query('.card-fee')).toBeNull();
    // Untouched neighbours stay.
    expect(query('.card-rating')).toBeTruthy();
    expect(text()).toContain('14 yrs experience');
  });

  it('shows the next slot when the doctor is not available today', () => {
    host.doctor.set({
      ...FULL_DOCTOR,
      availability: { isAvailableToday: false, nextSlotLabel: 'Tomorrow, 10:00 AM' },
    });
    fixture.detectChanges();

    expect(text()).toContain('Next available: Tomorrow, 10:00 AM');
  });

  it('falls back to initials when there is no photo', () => {
    expect(query('.avatar-initials').textContent?.trim()).toBe('AV');
    expect(query('.avatar-image')).toBeNull();
  });

  it('renders the photo when one is supplied', () => {
    host.doctor.set({ ...FULL_DOCTOR, photoUrl: '/doctors/asha.jpg' });
    fixture.detectChanges();

    expect(query('.avatar-image')).toBeTruthy();
    expect(query('.avatar-initials')).toBeNull();
  });

  it('exposes the name as a heading of the requested level', () => {
    const name = query('.card-name');
    expect(name.getAttribute('role')).toBe('heading');
    expect(name.getAttribute('aria-level')).toBe('3');
    expect(query('article').getAttribute('aria-labelledby')).toBe(name.id);
  });

  it('renders a plain name until a details route is supplied', () => {
    expect(query('.card-name-link')).toBeNull();

    host.route.set(['/doctors', 1]);
    fixture.detectChanges();

    expect(query('.card-name-link')).toBeTruthy();
  });

  it('emits selected when the linked name is activated', async () => {
    const seen: DoctorCardData[] = [];
    host.route.set(['/doctors', 1]);
    fixture.detectChanges();

    fixture.debugElement
      .query((node) => node.name === 'app-doctor-card')
      .componentInstance.selected.subscribe((doctor: DoctorCardData) => seen.push(doctor));

    query('.card-name-link').click();
    await fixture.whenStable();

    expect(seen).toEqual([FULL_DOCTOR]);
  });

  it('projects caller-supplied actions and stays empty otherwise', () => {
    expect(query('.card-actions').children.length).toBe(0);

    host.withActions.set(true);
    fixture.detectChanges();

    expect(query('.card-actions').textContent?.trim()).toBe('Book');
  });
});
