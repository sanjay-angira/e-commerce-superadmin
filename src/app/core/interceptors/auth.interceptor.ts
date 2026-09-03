import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { JwtService } from '../services/jwt.service';
import { ApiService } from '../services/api.service';
import { LoginService } from '../services/login.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const jwt = inject(JwtService);
  const token = jwt.getToken();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (!(req.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return next(req.clone({ setHeaders: headers })).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401 || req.url.includes('/auth/login') || req.url.includes('/user/refresh-token')) {
        return throwError(() => err);
      }

      const refresh = jwt.getRefreshToken();
      if (!refresh) {
        inject(LoginService).logout();
        return throwError(() => err);
      }

      const api = inject(ApiService);
      const login = inject(LoginService);

      return api.post('/user/refresh-token', { refreshToken: refresh }).pipe(
        switchMap((res) => {
          if (res?.success && res?.data) {
            login.setAuth(res.data);
            const newToken = inject(JwtService).getToken();
            return next(
              req.clone({
                setHeaders: {
                  ...headers,
                  Authorization: `Bearer ${newToken}`,
                },
              })
            );
          }
          login.logout();
          return throwError(() => err);
        }),
        catchError((refreshErr) => {
          inject(LoginService).logout();
          return throwError(() => refreshErr);
        })
      );
    })
  );
};
