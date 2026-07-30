import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ROLE_HOME, UserRole } from '../models/auth.model';
import { AuthService } from '../services/auth.service';

/**
 * Signed in, or sent to /login.
 *
 * The attempted URL travels as ?redirect=, so login can return the user where
 * they were going instead of dropping them on a default page.
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(['/login'], { queryParams: { redirect: state.url } });
};

/**
 * Signed in AND holding one of these roles.
 *
 * A signed-in user with the wrong role goes to their own home rather than to
 * /login — they are authenticated, just not entitled, and bouncing them to a
 * sign-in form they have already completed reads as a broken app.
 */
export function roleGuard(...roles: readonly UserRole[]): CanActivateFn {
  return (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    const role = auth.currentRole();
    if (role === null) {
      return authGuard(route, state);
    }

    return roles.includes(role) ? true : router.createUrlTree([ROLE_HOME[role]]);
  };
}
