import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileSection } from './profile-section';

@Component({
  imports: [ProfileSection],
  template: `
    <app-profile-section [title]="title()" [headingLevel]="headingLevel()">
      <p class="projected">Section body</p>
    </app-profile-section>
  `,
})
class HostComponent {
  readonly title = signal('About');
  readonly headingLevel = signal<2 | 3 | 4>(2);
}

describe('ProfileSection', () => {
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

  it('renders the title', () => {
    expect(query('.section-title')?.textContent?.trim()).toBe('About');
  });

  it('projects the body', () => {
    expect(query('.projected')?.textContent?.trim()).toBe('Section body');
  });

  it('uses a real h2 by default, with no aria-level override', () => {
    const heading = query('h2');

    expect(heading).toBeTruthy();
    expect(heading?.getAttribute('aria-level')).toBeNull();
  });

  it('overrides the rank with aria-level rather than swapping the tag', () => {
    host.headingLevel.set(3);
    fixture.detectChanges();

    expect(query('h2')?.getAttribute('aria-level')).toBe('3');
  });

  it('wraps the content in a section landmark', () => {
    expect(query('section.section')).toBeTruthy();
  });

  it('tracks a changing title', () => {
    host.title.set('Experience');
    fixture.detectChanges();

    expect(query('.section-title')?.textContent?.trim()).toBe('Experience');
  });
});
