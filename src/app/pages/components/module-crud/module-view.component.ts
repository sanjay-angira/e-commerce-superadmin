import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { KeyValuePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import {
  getAdminModuleApiPath,
  getAdminModuleTableConfig,
  isAdminModuleKey,
  type AdminModuleKey,
} from '../../../../static-data/admin-module-table.config';

@Component({
  selector: 'app-module-view',
  imports: [
    RouterLink,
    KeyValuePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './module-view.component.html',
  styleUrl: './module-view.component.scss',
})
export class ModuleViewComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(true);
  readonly record = signal<Record<string, unknown> | null>(null);

  moduleKey!: AdminModuleKey;
  label = '';
  recordId = '';
  supportsEdit = false;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const module = params.get('module') || '';
      const id = params.get('id') || '';
      if (!isAdminModuleKey(module) || !id) {
        this.router.navigateByUrl('/admin/dashboard');
        return;
      }

      if (module === 'orders') {
        this.router.navigateByUrl(`/admin/orders/view/${id}`);
        return;
      }

      const config = getAdminModuleTableConfig(module)!;
      this.moduleKey = module;
      this.label = config.label;
      this.recordId = id;
      this.supportsEdit = config.actions.includes('edit');
      this.loading.set(true);

      this.api.get(`/${getAdminModuleApiPath(module)}/${id}`).subscribe({
        next: (res) => {
          this.record.set(res?.data ?? res);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.snack.open('Failed to load record', 'Dismiss', { duration: 3500 });
        },
      });
    });
  }

  displayValue(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}
