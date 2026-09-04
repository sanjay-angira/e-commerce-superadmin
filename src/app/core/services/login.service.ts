import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, ReplaySubject, map } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from './api.service';
import { JwtService } from './jwt.service';
import { PermissionService } from './permission.service';
import { NavigationService } from './navigation.service';

@Injectable({ providedIn: 'root' })
export class LoginService {
  private readonly api = inject(ApiService);
  private readonly jwt = inject(JwtService);
  private readonly router = inject(Router);
  private readonly snackbar = inject(MatSnackBar);
  private readonly permissions = inject(PermissionService);
  private readonly navigation = inject(NavigationService);

  private currentUserSubject = new BehaviorSubject<any>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new ReplaySubject<boolean>(1);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor() {
    const token = this.jwt.getToken();
    if (token && this.decodeJwtToken()) {
      this.isAuthenticatedSubject.next(true);
      this.permissions.loadFromStorage();
      try {
        const stored = localStorage.getItem('admin_user');
        if (stored) this.currentUserSubject.next(JSON.parse(stored));
      } catch {
        /* ignore */
      }
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  decodeJwtToken(): any | null {
    const token = this.jwt.getToken();
    if (!token) return null;
    try {
      const decoded: any = jwtDecode(token);
      if (decoded?.exp && decoded.exp * 1000 < Date.now()) {
        this.logout(false);
        return null;
      }
      return decoded;
    } catch {
      return null;
    }
  }

  setAuth(data: any): void {
    this.jwt.saveToken(data?.accessToken || data?.createToken?.access_token);
    this.jwt.saveRefreshToken(data?.refreshToken || data?.createToken?.refreshToken);
    const user = data?.user || data?.checkUserByEmail;
    this.currentUserSubject.next(user);
    localStorage.setItem('admin_user', JSON.stringify(user || {}));
    this.permissions.setPermissions(user?.permissions || []);
    this.isAuthenticatedSubject.next(true);
    const expiry = this.decodeJwtToken();
    if (expiry?.exp) localStorage.setItem('expiryTime', String(expiry.exp));
    localStorage.setItem(
      'user_name',
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    );
  }

  attemptLogin(email: string, password: string): Observable<any> {
    return this.api.post('/auth/login', { email, password }).pipe(
      map((res) => {
        if (!res?.success) {
          throw new Error(res?.message || 'Login failed');
        }
        const user = res?.data?.user;
        const hasAdminRole = user?.userRoles?.find((role: any) => role.roleId == 1);
        if (!hasAdminRole) {
          this.logout(false);
          this.snackbar.open('You are not authorized to access the admin panel.', 'Dismiss', {
            duration: 4000,
          });
          throw new Error('Unauthorized');
        }
        this.setAuth(res.data);
        return res;
      })
    );
  }

  forgotPassword(email: string): Observable<any> {
    return this.api.post('/auth/send-otp', { email });
  }

  checkEmailExists(email: string): Observable<any> {
    return this.api.get(`/auth/checkEmailExists/${encodeURIComponent(email)}`);
  }

  resetPassword(payload: {
    email: string;
    otp: string;
    password: string;
  }): Observable<any> {
    return this.api.post('/auth/reset-password', payload);
  }

  setPassword(payload: {
    token: string;
    password: string;
    confirmPassword: string;
  }): Observable<any> {
    return this.api.post('/auth/reset-password', payload);
  }

  changePassword(payload: {
    oldPassword: string;
    newPassword: string;
  }): Observable<any> {
    return this.api.post('/auth/change-password', payload);
  }

  logout(navigate = true): void {
    this.jwt.destroyToken();
    this.jwt.destroyRefreshToken();
    this.permissions.clearPermissions();
    this.navigation.clear();
    this.currentUserSubject.next(null);
    localStorage.removeItem('admin_user');
    localStorage.removeItem('expiryTime');
    localStorage.removeItem('user_name');
    this.isAuthenticatedSubject.next(false);
    if (navigate) this.router.navigateByUrl('/login');
  }

  get displayName(): string {
    return localStorage.getItem('user_name') || 'Admin';
  }

  updateCurrentUser(user: any): void {
    this.currentUserSubject.next(user);
    localStorage.setItem('admin_user', JSON.stringify(user || {}));
    localStorage.setItem(
      'user_name',
      `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    );
  }
}
