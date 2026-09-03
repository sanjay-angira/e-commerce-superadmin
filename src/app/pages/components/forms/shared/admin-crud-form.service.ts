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
  ): Observable<{ success: boolean; message: string }> {
    const apiPath = getAdminModuleApiPath(module as AdminModuleKey);
    const req = recordId
      ? this.api.put(`/${apiPath}/${recordId}`, payload as object)
      : this.api.post(`/${apiPath}`, payload as object);

    return req.pipe(
      map((res) => ({
        success: res?.success !== false,
        message: res?.message || (recordId ? 'Updated' : 'Created'),
      })),
      catchError((err) =>
        of({
          success: false,
          message: err?.error?.message || err?.message || 'Save failed.',
        })
      )
    );
  }

  redirectToList(module: string): void {
    this.router.navigateByUrl(`/admin/${module}`);
  }
}
