import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, tap } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import {
  getAdminModuleApiPath,
  type AdminModuleKey,
} from '../../../../../static-data/admin-module-table.config';

@Injectable({ providedIn: 'root' })
export class AdminCrudFormService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  loadRecord(module: string, recordId: string): Observable<{ data: any; error: string }> {
    const apiPath = getAdminModuleApiPath(module as AdminModuleKey);
    return this.api.get(`/${apiPath}/${recordId}`).pipe(
      map((res) => ({ data: res?.data ?? res, error: '' })),
      catchError(() => of({ data: null, error: 'Failed to load record.' }))
    );
  }

  save(
    module: string,
    recordId: string | null | undefined,
    payload: unknown
  ): Observable<{ success: boolean; message: string; data?: any }> {
    const apiPath = getAdminModuleApiPath(module as AdminModuleKey);
    const req = recordId
      ? this.api.put(`/${apiPath}/${recordId}`, payload as object)
      : this.api.post(`/${apiPath}`, payload as object);

    return req.pipe(
      map((res) => ({
        success: res?.success !== false,
        message: res?.message || (recordId ? 'Updated' : 'Created'),
        data: res?.data ?? res,
      })),
      catchError((err) => {
        const raw = err?.error?.message ?? err?.message ?? 'Save failed.';
        const message = Array.isArray(raw)
          ? raw
              .map((item) =>
                typeof item === 'string'
                  ? item
                  : item?.constraints
                    ? Object.values(item.constraints).join(', ')
                    : JSON.stringify(item),
              )
              .join(' ')
          : String(raw);
        return of({
          success: false,
          message,
          data: null,
        });
      }),
    );
  }

  redirectToList(module: string): void {
    this.router.navigateByUrl(`/admin/${module}`);
  }

  checkPhone(
    phoneNumber: string,
    excludeUserId?: number | string | null,
  ): Observable<{ exists: boolean; available: boolean }> {
    return this.api
      .get('/users/check-phone', {
        phoneNumber,
        ...(excludeUserId ? { excludeUserId: Number(excludeUserId) } : {}),
      })
      .pipe(
        map((res) => ({
          exists: Boolean(res?.data?.exists),
          available: Boolean(res?.data?.available ?? !res?.data?.exists),
        })),
        catchError(() => of({ exists: false, available: true })),
      );
  }

  checkEmail(
    email: string,
    excludeUserId?: number | string | null,
    roleId?: number | string | null,
  ): Observable<{
    exists: boolean;
    available: boolean;
    isVerified: boolean;
    existsForRole: boolean;
    roleName: string;
    message: string;
  }> {
    return this.api
      .get('/users/check-email', {
        email,
        ...(excludeUserId ? { excludeUserId: Number(excludeUserId) } : {}),
        ...(roleId ? { roleId: Number(roleId) } : {}),
      })
      .pipe(
        map((res) => ({
          exists: Boolean(res?.data?.exists),
          available: Boolean(res?.data?.available ?? !res?.data?.exists),
          isVerified: Boolean(res?.data?.isVerified),
          existsForRole: Boolean(res?.data?.existsForRole),
          roleName: String(res?.data?.roleName || ''),
          message: String(res?.message || ''),
        })),
        catchError(() =>
          of({
            exists: false,
            available: true,
            isVerified: false,
            existsForRole: false,
            roleName: '',
            message: '',
          }),
        ),
      );
  }
}
