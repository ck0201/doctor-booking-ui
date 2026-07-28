import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RatingStars } from './rating-stars';

@Component({
  imports: [RatingStars],
  template: `<app-rating-stars [value]="value()" [reviewCount]="reviewCount()" />`,
})
class HostComponent {
  readonly value = signal(4.8);
  readonly reviewCount = signal<number | undefined>(212);
}

describe('RatingStars', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const text = () => (fixture.nativeElement.textContent as string).replace(/\s+/g, ' ').trim();
  const query = (selector: string) =>
    fixture.nativeElement.querySelector(selector) as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows the value and the count', () => {
    expect(text()).toContain('4.8');
    expect(query('.rating-count')?.textContent?.trim()).toBe('(212)');
  });

  it('omits the count when none is given', () => {
    host.reviewCount.set(undefined);
    fixture.detectChanges();

    expect(query('.rating-count')).toBeNull();
    expect(text()).toContain('4.8');
  });

  it('spells the rating out for screen readers', () => {
    expect(query('.sr-only')?.textContent?.trim()).toBe('4.8 out of 5 from 212 ratings');
  });

  it('drops the count from the spoken sentence when there is none', () => {
    host.reviewCount.set(undefined);
    fixture.detectChanges();

    expect(query('.sr-only')?.textContent?.trim()).toBe('4.8 out of 5');
  });

  it('hides the decorative glyph from assistive tech', () => {
    const glyph = query('[aria-hidden="true"]');

    expect(glyph?.textContent).toContain('★');
  });

  it('renders a count of zero rather than treating it as absent', () => {
    host.reviewCount.set(0);
    fixture.detectChanges();

    expect(query('.rating-count')?.textContent?.trim()).toBe('(0)');
  });
});
