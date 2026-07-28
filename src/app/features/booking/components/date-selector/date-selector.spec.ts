import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DateSelector } from './date-selector';
import { BookingDay } from '@core/models/booking.model';

const day = (date: string, label: string, availableSlotCount: number): BookingDay => ({
  date,
  label,
  slots: [],
  availableSlotCount,
});

const DAYS: readonly BookingDay[] = [
  day('2026-08-10', 'Mon 10 Aug', 3),
  day('2026-08-11', 'Tue 11 Aug', 0),
  day('2026-08-12', 'Wed 12 Aug', 5),
];

@Component({
  imports: [DateSelector],
  template: `<app-date-selector [days]="days" [(selectedDate)]="selected" />`,
})
class HostComponent {
  readonly days = DAYS;
  readonly selected = signal<string | null>(null);
}

describe('DateSelector', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.day')) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one option per day', () => {
    const labels = Array.from(
      fixture.nativeElement.querySelectorAll('.day-label') as NodeListOf<HTMLElement>,
    ).map((label) => label.textContent?.trim());

    expect(labels).toEqual(['Mon 10 Aug', 'Tue 11 Aug', 'Wed 12 Aug']);
  });

  it('shows how many slots are free', () => {
    expect(buttons()[0].textContent).toContain('3 free');
    expect(buttons()[2].textContent).toContain('5 free');
  });

  it('marks a fully booked day and disables it', () => {
    expect(buttons()[1].disabled).toBe(true);
    expect(buttons()[1].textContent).toContain('Fully booked');
  });

  it('selects a day on click', () => {
    buttons()[2].click();
    fixture.detectChanges();

    expect(host.selected()).toBe('2026-08-12');
    expect(buttons()[2].classList.contains('day--selected')).toBe(true);
  });

  it('refuses to select a fully booked day', () => {
    buttons()[1].click();
    fixture.detectChanges();

    expect(host.selected()).toBeNull();
  });

  it('reflects a selection made from outside', () => {
    host.selected.set('2026-08-10');
    fixture.detectChanges();

    expect(buttons()[0].getAttribute('aria-pressed')).toBe('true');
    expect(buttons()[2].getAttribute('aria-pressed')).toBe('false');
  });

  it('exposes the dates as a labelled list', () => {
    expect(fixture.nativeElement.querySelector('ul[aria-label="Available dates"]')).toBeTruthy();
  });
});
