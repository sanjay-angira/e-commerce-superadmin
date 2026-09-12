import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ApiService } from '../../../../../core/services/api.service';
import {
  PermissionMatrixComponent,
  type PermissionMatrixRow,
} from '../../shared/permission-matrix.component';

@Component({
  selector: 'app-role-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AdminFormShellComponent,
    PermissionMatrixComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class RoleFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly api = inject(ApiService);
  private readonly adminRoleId = 1;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly permissions = signal<PermissionMatrixRow[]>([]);
  readonly businessRoleId = signal(this.adminRoleId);
  readonly showPermissions = computed(
    () => this.businessRoleId() === this.adminRoleId,
  );

  readonly form = this.fb.nonNullable.group({
    roleName: ['', [Validators.required, Validators.minLength(2)]],
    roleId: [this.adminRoleId as number, [Validators.required]],
  });

  ngOnInit(): void {
    this.form.controls.roleId.valueChanges.subscribe((value) => {
      this.businessRoleId.set(Number(value) || 0);
    });

    const id = this.recordId();
    this.isEdit.set(!!id);

    if (!id) {
      this.loading.set(true);
      this.api.get('/users/template/permissions').subscribe({
        next: (res) => {
          this.permissions.set(this.normalizePermissions(res?.data ?? []));
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadError.set('Failed to load permission template.');
        },
      });
      return;
    }

    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      if (error || !data) {
        this.loading.set(false);
        this.loadError.set(error || 'Failed to load role.');
        return;
      }
      const roleId = Number(data.roleId ?? data.id ?? 1);
      this.form.patchValue({
        roleName: String(data.roleName ?? ''),
        roleId,
      });
      this.businessRoleId.set(roleId);

      if (roleId !== this.adminRoleId) {
        this.permissions.set([]);
        this.loading.set(false);
        return;
      }

      if (Array.isArray(data.permissions)) {
        this.permissions.set(this.normalizePermissions(data.permissions));
        this.loading.set(false);
        return;
      }
      this.api.get(`/roles/permissions/${id}`).subscribe({
        next: (res) => {
          this.permissions.set(this.normalizePermissions(res?.data ?? []));
          this.loading.set(false);
        },
        error: () => {
          this.api.get('/users/template/permissions').subscribe({
            next: (res) => {
              this.permissions.set(this.normalizePermissions(res?.data ?? []));
              this.loading.set(false);
            },
            error: () => {
              this.loading.set(false);
              this.loadError.set('Failed to load role permissions.');
            },
          });
        },
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');

    this.crud.save(this.module(), this.recordId(), payload).subscribe((res) => {
      if (!res.success) {
        this.saving.set(false);
        this.submitError.set(res.message);
        return;
      }

      const roleId =
        this.recordId() ||
        String(res.data?.id ?? res.data?.data?.id ?? '');

      if (!roleId || Number(payload.roleId) !== this.adminRoleId) {
        this.saving.set(false);
        this.crud.redirectToList(this.module());
        return;
      }

      this.api
        .put(`/roles/permissions/${roleId}`, {
          permissions: this.permissions(),
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.crud.redirectToList(this.module());
          },
          error: (err) => {
            this.saving.set(false);
            this.submitError.set(
              err?.error?.message || 'Role saved but permissions failed.',
            );
          },
        });
    });
  }

  private normalizePermissions(rows: any[]): PermissionMatrixRow[] {
    return (rows || []).map((row) => ({
      moduleId: Number(row.moduleId),
      moduleName: String(row.moduleName || row.name || `Module ${row.moduleId}`),
      routerLink: String(row.routerLink || row.router_link || ''),
      category: row.category ?? row.categories ?? null,
      canView: Boolean(row.canView),
      canAdd: Boolean(row.canAdd),
      canEdit: Boolean(row.canEdit),
      canDelete: Boolean(row.canDelete),
    }));
  }
}
