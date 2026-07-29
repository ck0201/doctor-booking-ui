import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvailabilityPanel } from './availability-panel';
import { DoctorDashboardAvailability } from '@core/models/doctor-dashboard.model';

const AVAILABILITY: DoctorDashboardAvailability = {
  workingHours: { opensAt: '09:00 AM', closesAt: '05:00 PM' },
  slotDurationMinutes: 30,
  isAvailableToday: true,
};

@Component({
  imports: [AvailabilityPanel],
  template: `
    <app-availability-panel [availability]="availability()" [(isAvailable)]="isAvailable" />
  `,
})
class HostComponent {
  readonly availability = signal<DoctorDashboardAvailability>(AVAILABILITY);
  readonly isAvailable = signal(true);
}

describe('AvailabilityPanel', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;
  const toggle = () => query('[data-testid="availability-toggle"]')!;
  const state = () => query('[data-testid="availability-state"]')?.textContent?.trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the working hours as a range', () => {
    expect(query('[data-testid="working-hours"]')?.textContent?.trim()).toBe('09:00 AM – 05:00 PM');
  });

  it('shows the slot duration in minutes', () => {
    expect(query('[data-testid="slot-duration"]')?.textContent?.trim()).toBe('30 minutes');
  });

  it('shows today as available to begin with', () => {
    expect(state()).toBe('Available');
    expect(toggle().getAttribute('aria-checked')).toBe('true');
  });

  it('flips to unavailable when toggled', () => {
    toggle().click();
    fixture.detectChanges();

    expect(host.isAvailable()).toBe(false);
    expect(state()).toBe('Unavailable');
    expect(toggle().getAttribute('aria-checked')).toBe('false');
    expect(toggle().textContent).toContain('Unavailable');
  });

  it('flips back again', () => {
    toggle().click();
    fixture.detectChanges();
    toggle().click();
    fixture.detectChanges();

    expect(host.isAvailable()).toBe(true);
    expect(state()).toBe('Available');
  });

  it('reflects a state set from outside', () => {
    host.isAvailable.set(false);
    fixture.detectChanges();

    expect(state()).toBe('Unavailable');
  });

  it('is exposed as a switch to assistive tech', () => {
    expect(toggle().getAttribute('role')).toBe('switch');
  });

  it('offers exactly one control, and says the change is not saved', () => {
    expect(fixture.nativeElement.querySelectorAll('button').length).toBe(1);
    expect(query('.note')?.textContent).toContain('not saved');
  });

  it('does not offer to change the working hours', () => {
    expect(fixture.nativeElement.querySelector('input')).toBeNull();
    expect(fixture.nativeElement.querySelector('select')).toBeNull();
  });

  it('follows a different slot duration', () => {
    host.availability.set({ ...AVAILABILITY, slotDurationMinutes: 15 });
    fixture.detectChanges();

    expect(query('[data-testid="slot-duration"]')?.textContent?.trim()).toBe('15 minutes');
  });
});
