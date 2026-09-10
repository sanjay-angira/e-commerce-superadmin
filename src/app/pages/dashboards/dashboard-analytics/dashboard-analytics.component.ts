import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { DashboardService } from '../../../core/services/dashboard.service';

@Component({
  selector: 'app-dashboard-analytics',
  imports: [
    DatePipe,
    MatCardModule,
    MatIconModule,
    MatTableModule,
    MatButtonModule,
    RouterLink,
  ],
  templateUrl: './dashboard-analytics.component.html',
  styleUrl: './dashboard-analytics.component.scss',
})
export class DashboardAnalyticsComponent {
  private readonly dashboard = inject(DashboardService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly summary = signal<any>(null);

  readonly orderColumns = ['orderNumber', 'customerName', 'total', 'orderStatus', 'createdAt'];
  readonly skeletonStats = [1, 2, 3, 4];
  readonly skeletonOrderRows = [1, 2, 3, 4, 5];
  readonly skeletonStockRows = [1, 2, 3, 4];

  constructor() {
    this.dashboard.getSummary().subscribe({
      next: (res) => {
        this.summary.set(res?.data ?? res);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard');
        this.loading.set(false);
      },
    });
  }
}
