import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { JwtService } from '../core/services/jwt.service';
import { LoginService } from '../core/services/login.service';
import { PermissionService } from '../core/services/permission.service';

/** Protect /admin/* — requires JWT */
export const authGuardUser: CanActivateFn = (_route, state) => {
  const jwt = inject(JwtService);
  const login = inject(LoginService);
  const permissions = inject(PermissionService);
  const router = inject(Router);

  if (!jwt.getToken() && !jwt.getRefreshToken()) {
    return router.createUrlTree(['/login']);
  }

  if (!login.decodeJwtToken() && !jwt.getRefreshToken()) {
    return router.createUrlTree(['/login']);
  }

  if (state.url.startsWith('/admin') && !permissions.canAccessUrl(state.url)) {
    return router.createUrlTree(['/admin/dashboard']);
  }

  return true;
};

/** Guest-only auth pages — redirect if already logged in */
export const guestGuard: CanActivateFn = () => {
  const login = inject(LoginService);
  const jwt = inject(JwtService);
  const router = inject(Router);
  if (login.decodeJwtToken() || jwt.getRefreshToken()) {
    return router.createUrlTree(['/admin/dashboard']);
  }
  return true;
};
