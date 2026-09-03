import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  private formatErrors(error: unknown) {
    return throwError(() => error);
  }

  get(path: string, params: HttpParams | Record<string, string | number | boolean> = {}): Observable<any> {
    let httpParams = new HttpParams();
    if (params instanceof HttpParams) {
      httpParams = params;
    } else {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          httpParams = httpParams.set(key, String(value));
        }
      });
    }
    return this.http
      .get(`${environment.api_url}${path.startsWith('/') ? path : `/${path}`}`, { params: httpParams })
      .pipe(catchError(this.formatErrors));
  }

  post(path: string, body: object = {}): Observable<any> {
    return this.http
      .post(`${environment.api_url}${path.startsWith('/') ? path : `/${path}`}`, body)
      .pipe(catchError(this.formatErrors));
  }

  put(path: string, body: object = {}): Observable<any> {
    return this.http
      .put(`${environment.api_url}${path.startsWith('/') ? path : `/${path}`}`, body)
      .pipe(catchError(this.formatErrors));
  }

  patch(path: string, body: object = {}): Observable<any> {
    return this.http
      .patch(`${environment.api_url}${path.startsWith('/') ? path : `/${path}`}`, body)
      .pipe(catchError(this.formatErrors));
  }

  delete(path: string): Observable<any> {
    return this.http
      .delete(`${environment.api_url}${path.startsWith('/') ? path : `/${path}`}`)
      .pipe(catchError(this.formatErrors));
  }
}
