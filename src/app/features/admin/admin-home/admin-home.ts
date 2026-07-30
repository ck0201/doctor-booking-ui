import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AuthService } from '@core/services/auth.service';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/**
 * Admin landing — a placeholder.
 *
 * /admin is where the admin role is sent and what the guards protect, so the
 * route has to exist or that redirect would bounce off the wildcard. The admin
 * portal itself is a later phase, so this page only proves the role landed.
 */
@Component({
  selector: 'app-admin-home',
  imports: [ProfileSection],
  templateUrl: './admin-home.html',
  styleUrl: './admin-home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminHome {
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;
}
