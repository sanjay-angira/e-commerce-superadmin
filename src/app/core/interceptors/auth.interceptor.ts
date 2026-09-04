import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { JwtService } from '../services/jwt.service';
import { ApiService } from '../services/api.service';
import { LoginService } from '../services/login.service';

let isRefreshing = false;
const refreshedAccessToken$ = new BehaviorSubject<string | null>(null);

function isAuthSkipUrl(url: string): boolean {
  return url.includes('/auth/login') || url.includes('/refresh-token');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwt = inject(JwtService);
  const login = inject(LoginService);
  const api = inject(ApiService);

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = jwt.getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || isAuthSkipUrl(req.url)) {
        return throwError(() => err);
      }

      const refresh = jwt.getRefreshToken();
      if (!refresh) {
        login.logout();
        return throwError(() => err);
      }

      if (isRefreshing) {
        return refreshedAccessToken$.pipe(
          filter((value): value is string => Boolean(value)),
          take(1),
          switchMap((accessToken) =>
            next(
              req.clone({
                setHeaders: {
                  ...headers,
                  Authorization: `Bearer ${accessToken}`,
                },
              }),
            ),
          ),
        );
      }

      isRefreshing = true;
      refreshedAccessToken$.next(null);

      return api.post('/user/refresh-token', { refreshToken: refresh }).pipe(
        switchMap((res) => {
          const accessToken = res?.data?.accessToken as string | undefined;
          if (!res?.success || !accessToken) {
            isRefreshing = false;
            login.logout();
            return throwError(() => err);
          }
          login.setAuth(res.data);
          isRefreshing = false;
          refreshedAccessToken$.next(accessToken);
          return next(
            req.clone({
              setHeaders: {
                ...headers,
                Authorization: `Bearer ${accessToken}`,
              },
            }),
          );
        }),
        catchError((refreshErr) => {
          isRefreshing = false;
          login.logout();
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
