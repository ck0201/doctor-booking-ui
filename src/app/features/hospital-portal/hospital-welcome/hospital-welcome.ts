import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';

/**
 * Placeholder, so the sign-in has somewhere to land (ADR-038).
 *
 * The portal itself — profile completion, departments, facilities, opening hours
 * — is the next phase. Inline template and styles because there is nothing here
 * yet worth three files, and it composes the shared EmptyState rather than
 * inventing a surface the real page will replace.
 */
@Component({
  selector: 'app-hospital-welcome',
  imports: [RouterLink, EmptyState],
  template: `
    <section class="welcome-page">
      <app-empty-state title="You are signed in">
        Your hospital portal opens here. Completing your departments, facilities and opening hours
        arrives in the next phase.

        <a emptyStateActions class="btn btn--primary" routerLink="/">Back to Home</a>
      </app-empty-state>
    </section>
  `,
  styles: `
    .welcome-page {
      max-width: 560px;
      min-height: 100vh;
      margin: 0 auto;
      padding: 48px 16px 64px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalWelcome {}
