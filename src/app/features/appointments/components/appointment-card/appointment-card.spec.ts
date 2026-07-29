import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentCard } from './appointment-card';
import { Appointment } from '@core/models/booking.model';

const APPOINTMENT: Appointment = {
  reference: 'APT-2026-0004',
  doctor: {
    id: 11,
    name: 'Dr. Mohan Lal Srivastava',
    primarySpecialty: { id: 8, name: 'General Physician' },
    practice: {
      hospitalName: 'Gorakhpur General Hospital',
      city: { id: 201, name: 'Gorakhpur', districtId: 2 },
    },
  },
  time: { date: '2026-07-21', startsAt: '05:30 PM', endsAt: '05:45 PM' },
  status: 'completed',
};

@Component({
  imports: [AppointmentCard],
  template: `<app-appointment-card [appointment]="appointment()" [headingLevel]="2" />`,
})
class HostComponent {
  readonly appointment = signal<Appointment>(APPOINTMENT);
}

describe('AppointmentCard', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows every field the history needs', () => {
    expect(query('[data-testid="reference"]')?.textContent?.trim()).toBe('APT-2026-0004');
    expect(text()).toContain('Dr. Mohan Lal Srivastava');
    expect(text()).toContain('General Physician');
    expect(query('[data-testid="practice"]')?.textContent).toContain('Gorakhpur General Hospital');
    expect(query('[data-testid="practice"]')?.textContent).toContain('Gorakhpur');
    expect(query('[data-testid="date"]')?.textContent?.trim()).toBe('Tue 21 Jul 2026');
    expect(query('[data-testid="time"]')?.textContent?.trim()).toBe('05:30 PM – 05:45 PM');
    expect(query('[data-testid="status"]')?.textContent?.trim()).toBe('Completed');
  });

  it('labels and colours each status', () => {
    for (const [status, label] of [
      ['upcoming', 'Upcoming'],
      ['completed', 'Completed'],
      ['cancelled', 'Cancelled'],
    ] as const) {
      host.appointment.set({ ...APPOINTMENT, status });
      fixture.detectChanges();

      const badge = query('[data-testid="status"]')!;
      expect(badge.textContent?.trim()).toBe(label);
      expect(badge.classList.contains(`status--${status}`)).toBe(true);
    }
  });

  it('exposes the doctor name as a heading of the requested rank', () => {
    const heading = query('.doctor')!;

    expect(heading.getAttribute('role')).toBe('heading');
    expect(heading.getAttribute('aria-level')).toBe('2');
  });

  it('omits the location when the doctor has no listed practice', () => {
    host.appointment.set({
      ...APPOINTMENT,
      doctor: {
        id: 12,
        name: 'Dr. Ritu Sahani',
        primarySpecialty: { id: 13, name: 'Psychiatrist' },
      },
    });
    fixture.detectChanges();

    expect(query('[data-testid="practice"]')).toBeNull();
    expect(text()).toContain('Dr. Ritu Sahani');
  });

  it('is read only — nothing to click', () => {
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });

  it('formats the date the same way the confirmation does', () => {
    host.appointment.set({
      ...APPOINTMENT,
      time: { date: '2026-08-10', startsAt: '10:00 AM', endsAt: '10:15 AM' },
    });
    fixture.detectChanges();

    expect(query('[data-testid="date"]')?.textContent?.trim()).toBe('Mon 10 Aug 2026');
  });
});
