import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BookingConfirmation } from './booking-confirmation';
import { BookingSlot, PatientInfo } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';

const DOCTOR: DoctorCardData = {
  id: 1,
  name: 'Dr. Asha Verma',
  primarySpecialty: { id: 1, name: 'Cardiologist' },
  practice: {
    hospitalName: 'Sanjeevani Heart Centre',
    city: { id: 101, name: 'Deoria', districtId: 1 },
  },
};

const SLOT: BookingSlot = {
  id: '1-2026-08-10-1030',
  date: '2026-08-10',
  startsAt: '10:30 AM',
  endsAt: '10:45 AM',
  isAvailable: true,
};

const PATIENT: PatientInfo = {
  fullName: 'Ramesh Gupta',
  phoneNumber: '9876543210',
  age: '42',
  gender: 'male',
  reasonForVisit: '',
};

@Component({
  imports: [BookingConfirmation],
  template: `
    <app-booking-confirmation
      [reference]="reference()"
      [doctor]="doctor()"
      [slot]="slot()"
      [patient]="patient()"
    />
  `,
})
class HostComponent {
  readonly reference = signal('APT-2026-0007');
  readonly doctor = signal<DoctorCardData>(DOCTOR);
  readonly slot = signal<BookingSlot>(SLOT);
  readonly patient = signal<PatientInfo>(PATIENT);
}

describe('BookingConfirmation', () => {
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

  it('announces success', () => {
    expect(text()).toContain('Appointment confirmed');
    expect(query('.tick')).toBeTruthy();
    expect(query('.sr-only')?.textContent).toContain('Success');
  });

  it('shows the reference in the headline and the detail list', () => {
    expect(query('[data-testid="booking-reference"]')?.textContent).toBe('APT-2026-0007');
    expect(text()).toContain('APT-2026-0007');
  });

  it('shows the doctor with their specialty', () => {
    expect(query('[data-testid="confirmed-doctor"]')?.textContent).toContain('Dr. Asha Verma');
    expect(query('[data-testid="confirmed-doctor"]')?.textContent).toContain('Cardiologist');
  });

  it('shows the date and the time separately', () => {
    expect(query('[data-testid="confirmed-date"]')?.textContent?.trim()).toBe('Mon 10 Aug 2026');
    expect(query('[data-testid="confirmed-time"]')?.textContent?.trim()).toBe(
      '10:30 AM – 10:45 AM',
    );
  });

  it('shows the patient', () => {
    expect(query('[data-testid="confirmed-patient"]')?.textContent?.trim()).toBe('Ramesh Gupta');
  });

  it('shows where to go', () => {
    expect(text()).toContain('Sanjeevani Heart Centre');
    expect(text()).toContain('Deoria');
  });

  it('omits the location when the doctor has no listed practice', () => {
    host.doctor.set({
      id: 2,
      name: 'Dr. Ritu Sahani',
      primarySpecialty: { id: 13, name: 'Psychiatrist' },
    });
    fixture.detectChanges();

    expect(text()).not.toContain('Where');
    expect(query('[data-testid="confirmed-doctor"]')?.textContent).toContain('Dr. Ritu Sahani');
  });

  it('offers a way back to the doctor and to the search', () => {
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('a.btn') as NodeListOf<HTMLAnchorElement>,
    );

    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/doctors/1', '/doctors']);
    expect(links[0].textContent?.trim()).toBe('Back to doctor profile');
    expect(links[1].textContent?.trim()).toBe('Find another doctor');
  });

  it('points back at whichever doctor was booked', () => {
    host.doctor.set({ ...DOCTOR, id: 9 });
    fixture.detectChanges();

    expect(query('a.btn')?.getAttribute('href')).toBe('/doctors/9');
  });

  it('reuses the shared empty state and profile section', () => {
    expect(query('app-empty-state')).toBeTruthy();
    expect(query('app-profile-section')).toBeTruthy();
    expect(query('.section-title')?.textContent?.trim()).toBe('Appointment details');
  });
});
