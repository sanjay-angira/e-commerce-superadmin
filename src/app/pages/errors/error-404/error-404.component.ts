import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-error-404',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="vr-page">
      <div class="vr-page-header-band">
        <div class="vr-title-card">
          <div class="vr-title-left">
            <h1>Page not found</h1>
            <div class="vr-breadcrumbs">
              <a routerLink="/admin/dashboard">
                <mat-icon style="font-size:16px;width:16px;height:16px">home</mat-icon>
              </a>
              <span class="dot"></span>
              <span>404</span>
            </div>
          </div>
        </div>
      </div>
      <div class="vr-page-content" style="margin-top: 0; padding-top: 1rem">
        <div class="vr-card wrap">
          <mat-icon class="big">search_off</mat-icon>
          <h2>404</h2>
          <p>The page you requested could not be found.</p>
          <a mat-flat-button color="primary" routerLink="/admin/dashboard">Go to dashboard</a>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .wrap {
        min-height: 40vh;
        display: grid;
        place-content: center;
        text-align: center;
        gap: 8px;
        padding: 2.5rem;
      }
      .big {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin: 0 auto;
        opacity: 0.35;
      }
      h2 {
        margin: 0;
        font-size: 40px;
        font-weight: 500;
      }
      p {
        margin: 0 0 12px;
        color: #757575;
      }
    `,
  ],
})
export class Error404Component {}
