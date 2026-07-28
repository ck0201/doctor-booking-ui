import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state [title]="title()">
      Nothing matched <strong class="term">{{ term() }}</strong
      >.
      @if (withAction()) {
        <button emptyStateActions>Reset</button>
      }
    </app-empty-state>
  `,
})
class HostComponent {
  readonly title = signal('No doctors found');
  readonly term = signal('cardiology');
  readonly withAction = signal(false);
}

describe('EmptyState', () => {
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
    expect(query('.empty-state-title')?.textContent?.trim()).toBe('No doctors found');
  });

  it('projects a message that may contain markup', () => {
    expect(query('.empty-state-body')?.textContent).toContain('Nothing matched');
    expect(query('.term')?.textContent?.trim()).toBe('cardiology');
  });

  it('owns the message paragraph, so callers cannot fight its typography', () => {
    expect(query('p.empty-state-body')).toBeTruthy();
  });

  it('leaves the action region empty until a caller fills it', () => {
    expect(query('.empty-state-actions')?.children.length).toBe(0);
  });

  it('projects caller-supplied actions', () => {
    host.withAction.set(true);
    fixture.detectChanges();

    expect(query('.empty-state-actions')?.textContent?.trim()).toBe('Reset');
  });

  it('tracks a changing title', () => {
    host.title.set('Start your search');
    fixture.detectChanges();

    expect(query('.empty-state-title')?.textContent?.trim()).toBe('Start your search');
  });
});
