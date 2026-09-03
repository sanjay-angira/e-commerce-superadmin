import { Component, inject, signal, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import {
  getAdminModuleApiPath,
  getAdminModuleTableConfig,
  isAdminModuleKey,
  type AdminModuleKey,
} from '../../../../static-data/admin-module-table.config';
import type { AdminTableColumnDefinition } from '../../../../static-data/static-common-table-columns';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

@Component({
  selector: 'app-module-list',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatChipsModule,
    MatTooltipModule,
    MatMenuModule,
    MatCheckboxModule,
  ],
  templateUrl: './module-list.component.html',
  styleUrl: './module-list.component.scss',
})
export class ModuleListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly count = signal(0);
  readonly pageNumber = signal(1);
  readonly pageSize = signal(10);

  moduleKey!: AdminModuleKey;
  apiPath = '';
  label = '';
  description = '';
  addLabel = '';
  displayedColumns: string[] = [];
  /** All columns for the visibility menu (cloned so we do not mutate static config). */
  columnOptions: AdminTableColumnDefinition[] = [];
  /** Data columns that always have a MatTable def (visibility only affects display). */
  dataColumns: AdminTableColumnDefinition[] = [];
  supportsAdd = false;
  supportsEdit = false;
  supportsView = false;
  supportsDelete = false;

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const module = params.get('module') || '';
      if (!isAdminModuleKey(module)) {
        this.router.navigateByUrl('/admin/dashboard');
        return;
      }
      const config = getAdminModuleTableConfig(module)!;
      if (config.customRoute && module === 'website-layout') {
        this.router.navigateByUrl('/admin/website-layout');
        return;
      }
      this.moduleKey = module;
      this.apiPath = getAdminModuleApiPath(module);
      this.label = config.label;
      this.description = config.description || '';
      this.addLabel = config.addLabel || `Add ${config.label}`;
      this.supportsAdd = config.actions.includes('add');
      this.supportsEdit = config.actions.includes('edit');
      this.supportsView = config.actions.includes('view');
      this.supportsDelete = config.actions.includes('delete');
      this.columnOptions = config.columns.map((column) => ({ ...column }));
      this.dataColumns = this.columnOptions.filter((c) => c.datatype !== 'button');
      this.syncDisplayedColumns();
      this.pageNumber.set(1);
      this.load();
    });

    this.searchControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.pageNumber.set(1);
        this.load();
      });
  }

  syncDisplayedColumns(): void {
    const visible = this.columnOptions.filter((c) => c.visible);
    const columns = visible.map((c) =>
      c.datatype === 'button' ? 'actions' : c.property
    );
    const hasActionsDef = this.columnOptions.some((c) => c.datatype === 'button');
    const actionsChecked = visible.some((c) => c.datatype === 'button');
    const canShowActions =
      this.supportsView || this.supportsEdit || this.supportsDelete;

    if (canShowActions && (!hasActionsDef || actionsChecked)) {
      if (!columns.includes('actions')) columns.push('actions');
    } else {
      const index = columns.indexOf('actions');
      if (index >= 0) columns.splice(index, 1);
    }

    this.displayedColumns = columns;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    const config = getAdminModuleTableConfig(this.moduleKey)!;
    const search = this.searchControl.value.trim();
    this.api
      .get(`/${this.apiPath}`, {
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize(),
        column: config.sortColumn ?? 'id',
        order: 'DESC',
        ...(search ? { search } : {}),
      })
      .subscribe({
        next: (res) => {
          const rows = res?.data?.rows ?? res?.data ?? [];
          this.rows.set(Array.isArray(rows) ? rows.map((row) => this.normalizeRow(row)) : []);
          this.count.set(res?.data?.count ?? res?.count ?? 0);
          this.loading.set(false);
        },
        error: () => {
          this.error.set('Failed to load data. Please try again.');
          this.rows.set([]);
          this.count.set(0);
          this.loading.set(false);
        },
      });
  }

  onPage(event: PageEvent): void {
    this.pageNumber.set(event.pageIndex + 1);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  cellValue(row: Record<string, unknown>, property: string, datatype: string): string {
    if (datatype === 'name') {
      return this.displayName(row) || '—';
    }
    if (datatype === 'role') {
      const roles = this.roleNames(row);
      return roles.length ? roles.join(', ') : '—';
    }
    const value = row[property];
    if (datatype === 'status' || datatype === 'on-off') {
      if (typeof value === 'boolean') return value ? 'Active' : 'Inactive';
      if (value === 1 || value === '1' || value === 'active') return 'Active';
      if (value === 0 || value === '0' || value === 'inactive') return 'Inactive';
    }
    if (datatype === 'date' || datatype === 'time') {
      return value ? String(value) : '—';
    }
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  roleNames(row: Record<string, unknown>): string[] {
    const userRoles = row['userRoles'];
    if (Array.isArray(userRoles) && userRoles.length > 0) {
      const fromRelations = userRoles
        .map((userRole) => this.roleNameFromUnknown(userRole))
        .filter((name): name is string => Boolean(name));
      if (fromRelations.length) return [...new Set(fromRelations)];
    }

    const propertyValue = row['role'] ?? row['roles'] ?? row['roleName'];
    if (Array.isArray(propertyValue)) {
      return [
        ...new Set(
          propertyValue
            .map((item) => this.roleNameFromUnknown(item))
            .filter((name): name is string => Boolean(name)),
        ),
      ];
    }
    if (propertyValue && typeof propertyValue === 'object') {
      const name = this.roleNameFromUnknown(propertyValue);
      return name ? [name] : [];
    }
    if (typeof propertyValue === 'string' && propertyValue.trim()) {
      return propertyValue
        .split(',')
        .map((name) => name.trim())
        .filter(Boolean);
    }
    return ['Customer'];
  }

  roleChipClass(roleName: string): string {
    const normalized = roleName.trim().toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'user' || normalized === 'customer') return 'user';
    return 'default';
  }

  private displayName(row: Record<string, unknown>): string {
    const firstName = String(row['firstName'] ?? '').trim();
    const lastName = String(row['lastName'] ?? '').trim();
    return `${firstName} ${lastName}`.trim() || String(row['name'] ?? '').trim();
  }

  private roleNameFromUnknown(value: unknown): string {
    if (typeof value === 'string') return value.trim();
    if (!value || typeof value !== 'object') return '';
    const record = value as Record<string, unknown>;
    const nested = record['role'];
    const nestedRecord =
      nested && typeof nested === 'object' ? (nested as Record<string, unknown>) : null;
    return String(
      record['roleName'] ??
        nestedRecord?.['roleName'] ??
        record['name'] ??
        nestedRecord?.['name'] ??
        '',
    ).trim();
  }

  private normalizeRow(row: Record<string, unknown>): Record<string, unknown> {
    const roles = this.roleNames(row);
    return {
      ...row,
      name: this.displayName(row) || row['name'],
      role: roles.join(', '),
    };
  }

  deleteRow(row: Record<string, unknown>): void {
    const firstName = String(row['firstName'] ?? '').trim();
    const lastName = String(row['lastName'] ?? '').trim();
    const fullName = `${firstName} ${lastName}`.trim();
    const label = String(
      fullName ||
        row['productName'] ||
        row['name'] ||
        row['title'] ||
        row['categoryName'] ||
        row['brandName'] ||
        row['offerName'] ||
        row['couponCode'] ||
        row['question'] ||
        row['orderNumber'] ||
        row['id'] ||
        '',
    );
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Confirm delete',
        message: label
          ? `Are you sure you want to delete "${label}"? This cannot be undone.`
          : `Delete this ${this.label.toLowerCase()} record?`,
      },
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'vr-dialog',
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.delete(`/${this.apiPath}/${row['id']}`).subscribe({
        next: () => {
          this.snack.open('Deleted', 'OK', { duration: 2500 });
          if (this.rows().length === 1 && this.pageNumber() > 1) {
            this.pageNumber.update((n) => n - 1);
          }
          this.load();
        },
        error: () => this.snack.open('Delete failed', 'Dismiss', { duration: 3500 }),
      });
    });
  }
}
