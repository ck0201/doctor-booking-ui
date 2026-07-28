import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagList } from './tag-list';

@Component({
  imports: [TagList],
  template: ` <app-tag-list [items]="items()" [variant]="variant()" [ariaLabel]="ariaLabel()" /> `,
})
class HostComponent {
  readonly items = signal<readonly string[]>(['Hindi', 'English']);
  readonly variant = signal<'primary' | 'neutral'>('primary');
  readonly ariaLabel = signal<string | undefined>(undefined);
}

describe('TagList', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const tags = () => Array.from(fixture.nativeElement.querySelectorAll('.tag')) as HTMLElement[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one tag per item', () => {
    expect(tags().map((tag) => tag.textContent?.trim())).toEqual(['Hindi', 'English']);
  });

  it('renders a real list so the count is announced', () => {
    expect(fixture.nativeElement.querySelector('ul')).toBeTruthy();
    expect(tags()[0].tagName).toBe('LI');
  });

  it('defaults to the primary variant', () => {
    expect(tags()[0].classList.contains('tag--neutral')).toBe(false);
  });

  it('applies the neutral variant when asked', () => {
    host.variant.set('neutral');
    fixture.detectChanges();

    expect(tags().every((tag) => tag.classList.contains('tag--neutral'))).toBe(true);
  });

  it('labels the list when a label is supplied', () => {
    host.ariaLabel.set('Specialties');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('ul').getAttribute('aria-label')).toBe(
      'Specialties',
    );
  });

  it('renders nothing for an empty list', () => {
    host.items.set([]);
    fixture.detectChanges();

    expect(tags().length).toBe(0);
  });
});
