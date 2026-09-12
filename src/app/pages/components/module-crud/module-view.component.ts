import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
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
  type AdminModuleTableConfig,
} from '../../../../static-data/admin-module-table.config';

type RoleProfileView = {
  roleId: string | number;
  roleName: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImage: string;
  isActive: boolean;
  isDeleted: boolean;
};

const PEOPLE_MODULES = new Set([
  'users',
  'admins',
  'customers',
  'sellers',
  'delete-requests',
]);

const HIDDEN_KEYS = new Set([
  'password',
  'emails',
  'userRoles',
  'adminProfile',
  'customerProfile',
  'sellerProfile',
  'roleEmails',
  'roleProfiles',
  'permissions',
  'roleIds',
]);

@Component({
  selector: 'app-module-view',
  imports: [
    RouterLink,
    DatePipe,
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
  readonly moduleKey = signal<AdminModuleKey>('users');

  label = '';
  recordId = '';
  supportsEdit = false;
  private config: AdminModuleTableConfig | null = null;

  readonly isPeopleModule = computed(() => PEOPLE_MODULES.has(this.moduleKey()));

  readonly roleProfiles = computed(() => this.buildRoleProfiles(this.record()));

  readonly summaryFields = computed(() => {
    const row = this.record();
    if (!row) return [];
    if (this.isPeopleModule()) {
      return this.peopleSummaryFields(row);
    }
    return this.genericFields(row);
  });

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
      this.config = config;
      this.moduleKey.set(module);
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

  roleChipClass(roleName: string): string {
    const normalized = roleName.trim().toLowerCase();
    if (normalized === 'admin') return 'admin';
    if (normalized === 'customer' || normalized === 'user') return 'user';
    if (normalized === 'seller') return 'seller';
    return 'default';
  }

  fullName(profile: RoleProfileView): string {
    return `${profile.firstName} ${profile.lastName}`.trim() || '—';
  }

  private peopleSummaryFields(
    row: Record<string, unknown>,
  ): Array<{ label: string; value: string }> {
    const roles = this.roleProfiles().map((profile) => profile.roleName);
    return [
      { label: 'Phone Number', value: this.asText(row['phoneNumber']) },
      {
        label: 'Roles',
        value: roles.length ? roles.join(', ') : this.asText(row['role']),
      },
      {
        label: 'Created On',
        value: this.asText(row['createdAt']),
      },
      {
        label: 'Updated On',
        value: this.asText(row['updatedAt']),
      },
    ];
  }

  private genericFields(
    row: Record<string, unknown>,
  ): Array<{ label: string; value: string }> {
    const preferredKeys =
      this.config?.columns
        ?.filter((col) => col.property !== 'actions' && col.visible)
        .map((col) => col.property) ?? [];

    const formKeys = this.config?.formFields?.map((field) => field.key) ?? [];
    const keys = [...new Set([...preferredKeys, ...formKeys, 'id'])].filter(
      (key) => !HIDDEN_KEYS.has(key) && key in row,
    );

    if (!keys.length) {
      return Object.keys(row)
        .filter((key) => !HIDDEN_KEYS.has(key) && !this.isComplex(row[key]))
        .map((key) => ({
          label: this.prettyLabel(key),
          value: this.formatValue(row[key], key),
        }));
    }

    return keys.map((key) => {
      const column = this.config?.columns?.find((col) => col.property === key);
      const field = this.config?.formFields?.find((item) => item.key === key);
      return {
        label: column?.label || field?.label || this.prettyLabel(key),
        value: this.formatValue(row[key], key, column?.datatype),
      };
    });
  }

  private buildRoleProfiles(
    row: Record<string, unknown> | null,
  ): RoleProfileView[] {
    if (!row || !this.isPeopleModule()) return [];

    const profiles = row['roleProfiles'];
    if (Array.isArray(profiles) && profiles.length) {
      return profiles.map((item, index) => this.toRoleProfile(item, index, row));
    }

    const roleEmails = row['roleEmails'];
    if (Array.isArray(roleEmails) && roleEmails.length) {
      return roleEmails.map((item, index) => this.toRoleProfile(item, index, row));
    }

    const roles = Array.isArray(row['userRoles']) ? row['userRoles'] : [];
    if (roles.length) {
      return roles.map((item, index) => this.toRoleProfile(item, index, row));
    }

    if (row['firstName'] || row['email']) {
      return [
        {
          roleId: 'primary',
          roleName: this.moduleKey() === 'customers'
            ? 'Customer'
            : this.moduleKey() === 'sellers'
              ? 'Seller'
              : this.moduleKey() === 'admins'
                ? 'Admin'
                : 'User',
          firstName: String(row['firstName'] ?? ''),
          lastName: String(row['lastName'] ?? ''),
          email: String(row['email'] ?? ''),
          profileImage: String(row['profileImage'] ?? ''),
          isActive: row['isActive'] !== false,
          isDeleted: Boolean(row['isDeleted'] ?? row['isDeleteRequested'] ?? false),
        },
      ];
    }

    return [];
  }

  private toRoleProfile(
    item: unknown,
    index: number,
    row: Record<string, unknown>,
  ): RoleProfileView {
    const record =
      item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const nestedRole =
      record['role'] && typeof record['role'] === 'object'
        ? (record['role'] as Record<string, unknown>)
        : null;

    const roleName = String(
      record['roleName'] ?? nestedRole?.['roleName'] ?? 'Role',
    ).trim() || 'Role';

    return {
      roleId: (record['roleId'] as string | number) ?? index,
      roleName,
      firstName: String(record['firstName'] ?? row['firstName'] ?? '').trim(),
      lastName: String(record['lastName'] ?? row['lastName'] ?? '').trim(),
      email: String(record['email'] ?? row['email'] ?? '').trim(),
      profileImage: String(
        record['profileImage'] ?? row['profileImage'] ?? '',
      ).trim(),
      isActive:
        record['isActive'] === undefined
          ? row['isActive'] !== false
          : Boolean(record['isActive']),
      isDeleted: Boolean(
        record['isDeleted'] ??
          record['isDeleteRequested'] ??
          row['isDeleted'] ??
          row['isDeleteRequested'] ??
          false,
      ),
    };
  }

  private formatValue(value: unknown, key: string, datatype?: string): string {
    if (datatype === 'status' || datatype === 'on-off' || key === 'isActive') {
      return this.boolLabel(value);
    }
    if (datatype === 'name') {
      return this.asText(value) === '—'
        ? this.asText(
            `${String((this.record() || {})['firstName'] ?? '')} ${String((this.record() || {})['lastName'] ?? '')}`.trim(),
          )
        : this.asText(value);
    }
    return this.asText(value);
  }

  private asText(value: unknown): string {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'object') return '—';
    return String(value);
  }

  private boolLabel(value: unknown): string {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === 1 || value === '1' || value === 'active') return 'Yes';
    if (value === 0 || value === '0' || value === 'inactive') return 'No';
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
  }

  private prettyLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/[_-]+/g, ' ')
      .replace(/^\w/, (char) => char.toUpperCase())
      .trim();
  }

  private isComplex(value: unknown): boolean {
    return value !== null && typeof value === 'object';
  }
}
