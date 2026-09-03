import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JwtService {
  getToken(): string | null {
    return localStorage.getItem('currentUser');
  }

  saveToken(token: string): void {
    localStorage.setItem('currentUser', token);
  }

  destroyToken(): void {
    localStorage.removeItem('currentUser');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  saveRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  }

  destroyRefreshToken(): void {
    localStorage.removeItem('refreshToken');
  }
}
