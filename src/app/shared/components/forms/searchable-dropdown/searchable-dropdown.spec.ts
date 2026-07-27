import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchableDropdown } from './searchable-dropdown';
import { LookupItem } from '@core/models/lookup-item.model';

const ITEMS: LookupItem[] = [
  { id: 1, name: 'Cardiologist' },
  { id: 2, name: 'Dermatologist' },
  { id: 3, name: 'Dentist' },
];

@Component({
  imports: [SearchableDropdown],
  template: ` <app-searchable-dropdown label="Specialty" [items]="items" [(value)]="value" /> `,
})
class HostComponent {
  readonly items = ITEMS;
  readonly value = signal<LookupItem | null>(null);
}

describe('SearchableDropdown', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const options = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.dropdown-item')) as HTMLElement[];
  const activeOption = () =>
    fixture.nativeElement.querySelector('.dropdown-item--active') as HTMLElement | null;

  const key = (name: string) => {
    input().dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  };

  const type = (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(host).toBeTruthy();
  });

  it('is closed initially', () => {
    expect(options().length).toBe(0);
  });

  it('opens on click and shows every item', () => {
    input().click();
    fixture.detectChanges();

    expect(options().length).toBe(ITEMS.length);
  });

  it('filters items by the typed text', () => {
    input().click();
    fixture.detectChanges();
    type('den');

    expect(options().map((o) => o.textContent?.trim())).toEqual(['Dentist']);
  });

  it('shows the empty message when nothing matches', () => {
    input().click();
    fixture.detectChanges();
    type('zzz');

    expect(options().length).toBe(0);
    expect(fixture.nativeElement.querySelector('.dropdown-empty')).toBeTruthy();
  });

  it('selects an item on click and closes', () => {
    input().click();
    fixture.detectChanges();
    options()[1].click();
    fixture.detectChanges();

    expect(host.value()).toEqual(ITEMS[1]);
    expect(options().length).toBe(0);
    expect(input().value).toBe('Dermatologist');
  });

  it('opens with ArrowDown and moves the highlight', () => {
    key('ArrowDown');
    expect(activeOption()?.textContent?.trim()).toBe('Cardiologist');

    key('ArrowDown');
    expect(activeOption()?.textContent?.trim()).toBe('Dermatologist');

    key('ArrowUp');
    expect(activeOption()?.textContent?.trim()).toBe('Cardiologist');
  });

  it('wraps the highlight around both ends', () => {
    key('ArrowDown');
    key('ArrowUp');
    expect(activeOption()?.textContent?.trim()).toBe('Dentist');

    key('ArrowDown');
    expect(activeOption()?.textContent?.trim()).toBe('Cardiologist');
  });

  it('selects the highlighted item with Enter', () => {
    key('ArrowDown');
    key('ArrowDown');
    key('Enter');

    expect(host.value()).toEqual(ITEMS[1]);
    expect(options().length).toBe(0);
  });

  it('closes on Escape without changing the selection', () => {
    key('ArrowDown');
    key('Escape');

    expect(options().length).toBe(0);
    expect(host.value()).toBeNull();
  });

  it('closes when clicking outside', () => {
    input().click();
    fixture.detectChanges();
    expect(options().length).toBe(ITEMS.length);

    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    fixture.detectChanges();

    expect(options().length).toBe(0);
  });

  it('highlights the selected item when reopened', () => {
    host.value.set(ITEMS[2]);
    fixture.detectChanges();

    input().click();
    fixture.detectChanges();

    const selected = fixture.nativeElement.querySelector('.dropdown-item--selected') as HTMLElement;
    expect(selected.textContent?.trim()).toContain('Dentist');
    expect(activeOption()?.textContent?.trim()).toContain('Dentist');
  });

  it('clears the selection with the clear button', () => {
    host.value.set(ITEMS[0]);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('.dropdown-action--clear') as HTMLElement).click();
    fixture.detectChanges();

    expect(host.value()).toBeNull();
    expect(input().value).toBe('');
  });
});
