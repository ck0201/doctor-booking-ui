import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentStatusFilter } from './appointment-status-filter';
import { AppointmentFilter } from '@core/models/booking.model';

@Component({
  imports: [AppointmentStatusFilter],
  template: `<app-appointment-status-filter [counts]="counts" [(selected)]="selected" />`,
})
class HostComponent {
  readonly counts: Readonly<Record<AppointmentFilter, number>> = {
    all: 8,
    upcoming: 3,
    completed: 3,
    cancelled: 2,
  };
  readonly selected = signal<AppointmentFilter>('all');
}

describe('AppointmentStatusFilter', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.filter')) as HTMLButtonElement[];
  const button = (filter: string) =>
    fixture.nativeElement.querySelector(`[data-testid="filter-${filter}"]`) as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('offers the four filters in order', () => {
    expect(buttons().map((item) => item.textContent?.trim().split(/\s+/)[0])).toEqual([
      'All',
      'Upcoming',
      'Completed',
      'Cancelled',
    ]);
  });

  it('shows the count for each', () => {
    expect(button('all').textContent).toContain('8');
    expect(button('upcoming').textContent).toContain('3');
    expect(button('cancelled').textContent).toContain('2');
  });

  it('marks the selected filter', () => {
    expect(button('all').getAttribute('aria-pressed')).toBe('true');
    expect(button('upcoming').getAttribute('aria-pressed')).toBe('false');
  });

  it('selects a filter on click', () => {
    button('completed').click();
    fixture.detectChanges();

    expect(host.selected()).toBe('completed');
    expect(button('completed').classList.contains('filter--selected')).toBe(true);
  });

  it('reflects a selection made from outside', () => {
    host.selected.set('cancelled');
    fixture.detectChanges();

    expect(button('cancelled').getAttribute('aria-pressed')).toBe('true');
    expect(button('all').getAttribute('aria-pressed')).toBe('false');
  });

  it('is exposed as a labelled group', () => {
    expect(
      fixture.nativeElement.querySelector('[role="group"]').getAttribute('aria-label'),
    ).toContain('Filter appointments');
  });
});
