import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SlotGrid } from './slot-grid';
import { BookingSlot } from '@core/models/booking.model';

const slot = (id: string, startsAt: string, isAvailable: boolean): BookingSlot => ({
  id,
  date: '2026-08-10',
  startsAt,
  endsAt: startsAt,
  isAvailable,
});

const SLOTS: readonly BookingSlot[] = [
  slot('a', '10:00 AM', false),
  slot('b', '10:15 AM', true),
  slot('c', '05:00 PM', true),
];

@Component({
  imports: [SlotGrid],
  template: `<app-slot-grid [slots]="slots()" [(selectedSlotId)]="selected" />`,
})
class HostComponent {
  readonly slots = signal<readonly BookingSlot[]>(SLOTS);
  readonly selected = signal<string | null>(null);
}

describe('SlotGrid', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.slot')) as HTMLButtonElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders every slot, taken ones included', () => {
    expect(buttons().length).toBe(3);
  });

  it('disables a taken slot and says so for screen readers', () => {
    expect(buttons()[0].disabled).toBe(true);
    expect(buttons()[0].querySelector('.sr-only')?.textContent).toContain('already booked');
  });

  it('selects an available slot on click', () => {
    buttons()[1].click();
    fixture.detectChanges();

    expect(host.selected()).toBe('b');
    expect(buttons()[1].classList.contains('slot--selected')).toBe(true);
  });

  it('refuses to select a taken slot', () => {
    buttons()[0].click();
    fixture.detectChanges();

    expect(host.selected()).toBeNull();
  });

  it('moves the selection when another slot is picked', () => {
    buttons()[1].click();
    fixture.detectChanges();
    buttons()[2].click();
    fixture.detectChanges();

    expect(host.selected()).toBe('c');
    expect(buttons()[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('shows the empty message when there are no slots', () => {
    host.slots.set([]);
    fixture.detectChanges();

    expect(buttons().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.slots-empty').textContent).toContain('No slots');
  });
});
