import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCard } from './stat-card';

@Component({
  imports: [StatCard],
  template: ` <app-stat-card [label]="label()" [value]="value()" [caption]="caption()" /> `,
})
class HostComponent {
  readonly label = signal("Today's appointments");
  readonly value = signal(7);
  readonly caption = signal<string | undefined>('Mon 10 Aug 2026');
}

describe('StatCard', () => {
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

  it('shows the figure and its label', () => {
    expect(query('[data-testid="stat-value"]')?.textContent?.trim()).toBe('7');
    expect(query('[data-testid="stat-label"]')?.textContent?.trim()).toBe("Today's appointments");
  });

  it('shows the caption when given one', () => {
    expect(query('.stat-caption')?.textContent?.trim()).toBe('Mon 10 Aug 2026');
  });

  it('omits the caption when not given one', () => {
    host.caption.set(undefined);
    fixture.detectChanges();

    expect(query('.stat-caption')).toBeNull();
  });

  it('shows a zero rather than hiding it', () => {
    host.value.set(0);
    fixture.detectChanges();

    expect(query('[data-testid="stat-value"]')?.textContent?.trim()).toBe('0');
  });

  it('is a statistic, not a control', () => {
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
  });
});
