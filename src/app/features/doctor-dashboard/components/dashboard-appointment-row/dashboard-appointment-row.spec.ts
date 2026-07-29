import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAppointmentRow } from './dashboard-appointment-row';
import { DashboardAppointment } from '@core/models/doctor-dashboard.model';

const APPOINTMENT: DashboardAppointment = {
  reference: 'APT-2026-0034',
  patientName: 'Meena Kumari',
  time: { date: '2026-08-10', startsAt: '10:30 AM', endsAt: '11:00 AM' },
  status: 'in-progress',
};

@Component({
  imports: [DashboardAppointmentRow],
  template: `<app-dashboard-appointment-row [appointment]="appointment()" />`,
})
class HostComponent {
  readonly appointment = signal<DashboardAppointment>(APPOINTMENT);
}

describe('DashboardAppointmentRow', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the patient, the time, the reference and the status', () => {
    expect(query('[data-testid="patient"]')?.textContent?.trim()).toBe('Meena Kumari');
    expect(query('[data-testid="time"]')?.textContent?.trim()).toBe('10:30 AM – 11:00 AM');
    expect(query('[data-testid="reference"]')?.textContent?.trim()).toBe('APT-2026-0034');
    expect(query('[data-testid="status"]')?.textContent?.trim()).toBe('In Progress');
  });

  it('labels and colours each status', () => {
    for (const [status, label] of [
      ['upcoming', 'Upcoming'],
      ['in-progress', 'In Progress'],
      ['completed', 'Completed'],
    ] as const) {
      host.appointment.set({ ...APPOINTMENT, status });
      fixture.detectChanges();

      const badge = query('[data-testid="status"]')!;
      expect(badge.textContent?.trim()).toBe(label);
      expect(badge.classList.contains(`status--${status}`)).toBe(true);
    }
  });

  it('marks out the consultation that is running', () => {
    expect(query('.row')?.classList.contains('row--active')).toBe(true);

    host.appointment.set({ ...APPOINTMENT, status: 'upcoming' });
    fixture.detectChanges();

    expect(query('.row')?.classList.contains('row--active')).toBe(false);
  });

  it('shows no doctor — the doctor is the one reading it', () => {
    expect(fixture.nativeElement.textContent).not.toContain('Dr.');
  });

  it('is read only — nothing to click', () => {
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
  });

  it('formats the time the same way the rest of the app does', () => {
    host.appointment.set({
      ...APPOINTMENT,
      time: { date: '2026-08-10', startsAt: '09:00 AM', endsAt: '09:30 AM' },
    });
    fixture.detectChanges();

    expect(query('[data-testid="time"]')?.textContent?.trim()).toBe('09:00 AM – 09:30 AM');
  });
});
