import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';

/**
 * Placeholder for setup step two, so Save and Continue has somewhere to land.
 *
 * Departments themselves are the next phase. Inline template and styles because
 * there is nothing here yet worth three files, and it composes the shared
 * EmptyState rather than inventing a surface the real page will replace.
 */
@Component({
  selector: 'app-hospital-departments',
  imports: [RouterLink, EmptyState],
  template: `
    <section class="departments-page">
      <app-empty-state title="Departments come next">
        Your contact details are saved. Choosing the departments your hospital runs arrives in the
        next phase.

        <a emptyStateActions class="btn btn--primary" routerLink="/">Back to Home</a>
      </app-empty-state>
    </section>
  `,
  styles: `
    .departments-page {
      max-width: 560px;
      min-height: 100vh;
      margin: 0 auto;
      padding: 48px 16px 64px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalDepartments {}
