import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  AsyncValidatorFn,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';
import { ApiService } from '../../../../../core/services/api.service';
import {
  PermissionMatrixComponent,
  type PermissionMatrixRow,
} from '../../shared/permission-matrix.component';

type RoleProfileValue = {
  roleId: number;
  firstName: string;
  lastName?: string;
  email: string;
  profileImage?: string;
  isActive?: boolean;
  isDeleted?: boolean;
};

function atLeastOneRole(control: AbstractControl): ValidationErrors | null {
  return Array.isArray(control.value) && control.value.length > 0
    ? null
    : { required: true };
}

@Component({
  selector: 'app-user-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatExpansionModule,
    AdminFormShellComponent,
    ImageUploadComponent,
    PermissionMatrixComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private readonly api = inject(ApiService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly roles = signal<SelectOption[]>([]);
  readonly selectedRoleIds = signal<number[]>([]);
  readonly permissions = signal<PermissionMatrixRow[]>([]);
  private permissionsTouched = false;
  readonly uploadPath = UPLOAD_PATHS.users;
  readonly directoryRole = computed(() => {
    const module = this.module();
    if (module === 'admins') return 'admin';
    if (module === 'customers') return 'customer';
    if (module === 'sellers') return 'seller';
    return null;
  });
  readonly personLabel = computed(() => {
    const module = this.module();
    if (module === 'admins') return 'Admin';
    if (module === 'customers') return 'Customer';
    if (module === 'sellers') return 'Seller';
    return 'User';
  });
  readonly selectedRoles = computed(() => {
    const selected = new Set(this.selectedRoleIds());
    return this.roles().filter((role) => selected.has(Number(role.value)));
  });
  /** Module permissions apply only to Admin (role id 1). */
  readonly showPermissions = computed(() => {
    if (this.directoryRole() === 'admin') return true;
    if (this.directoryRole()) return false;
    return this.hasAdminRoleId(this.selectedRoleIds());
  });
  private readonly adminRoleId = 1;

  readonly roleProfiles = this.fb.nonNullable.group({});
  readonly form = this.fb.nonNullable.group({
    firstName: [''],
    lastName: [''],
    email: [''],
    phoneNumber: [
      '',
      {
        validators: [Validators.required, Validators.pattern(/^[0-9]{5,10}$/)],
        asyncValidators: [this.phoneAvailabilityValidator()],
        updateOn: 'change',
      },
    ],
    roleIds: [[] as number[]],
    roleProfiles: this.roleProfiles,
    profileImage: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    if (this.directoryRole()) {
      this.form.controls.firstName.addValidators([
        Validators.required,
        Validators.minLength(2),
      ]);
      this.form.controls.email.addValidators([Validators.required, Validators.email]);
      this.form.controls.email.addAsyncValidators([
        this.emailAvailabilityValidator(() => this.directoryRoleId()),
      ]);
      this.form.controls.isActive.setValue(true, { emitEvent: false });
    } else {
      this.form.controls.roleIds.addValidators([atLeastOneRole]);
    }
    this.form.controls.firstName.updateValueAndValidity({ emitEvent: false });
    this.form.controls.email.updateValueAndValidity({ emitEvent: false });
    this.form.controls.roleIds.updateValueAndValidity({ emitEvent: false });

    this.form.controls.roleIds.valueChanges.subscribe((ids) => {
      const roleIds = normalizeIds(ids);
      this.selectedRoleIds.set(roleIds);
      // Directory forms (admins/customers/sellers) use top-level fields only.
      if (this.directoryRole()) {
        this.clearRoleProfileControls();
        return;
      }
      this.syncRoleProfileControls(roleIds);
      if (!this.hasAdminRoleId(roleIds)) {
        this.permissions.set([]);
        this.permissionsTouched = false;
        return;
      }
      // Keep saved/edited permissions on edit unless the user hasn't touched them yet.
      if (!this.isEdit() || !this.permissionsTouched) {
        this.loadPermissionsFromRoles(roleIds);
      }
    });

    this.options.roles().subscribe((rows) => {
      this.roles.set(rows);
      const directoryRole = this.directoryRole();
      if (directoryRole) {
        const match = rows.find(
          (row) => String(row.label).trim().toLowerCase() === directoryRole,
        );
        if (match && !this.isEdit()) {
          this.form.patchValue(
            { roleIds: [Number(match.value)] },
            { emitEvent: false },
          );
          this.selectedRoleIds.set([Number(match.value)]);
          this.clearRoleProfileControls();
          if (this.isAdminRole(match)) {
            this.loadPermissionsFromRoles([Number(match.value)]);
          }
        }
        this.form.controls.email.updateValueAndValidity({ emitEvent: true });
        return;
      }
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) {
      if (this.directoryRole() === 'admin') {
        this.api.get('/users/template/permissions').subscribe({
          next: (res) =>
            this.permissions.set(this.normalizePermissions(res?.data ?? [])),
        });
      }
      return;
    }
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      const roleIds = Array.isArray(data.roleIds)
        ? normalizeIds(data.roleIds)
        : normalizeIds(
            (data.userRoles ?? []).map(
              (ur: any) => ur?.role?.id ?? ur?.roleId ?? ur,
            ),
          );
      // Avoid roleIds valueChanges wiping / reloading permissions during hydrate.
      this.form.patchValue(
        {
          firstName: String(data.firstName ?? ''),
          lastName: String(data.lastName ?? ''),
          email: String(data.email ?? ''),
          phoneNumber: String(data.phoneNumber ?? ''),
          roleIds,
          profileImage: String(data.profileImage ?? ''),
          isActive: Boolean(data.isActive ?? false),
        },
        { emitEvent: false },
      );
      this.selectedRoleIds.set(roleIds);
      this.syncRoleProfileControls(roleIds);
      const savedProfiles = Array.isArray(data.roleProfiles)
        ? data.roleProfiles
        : Array.isArray(data.roleEmails)
          ? data.roleEmails
          : [];
      for (const row of savedProfiles) {
        const group = this.roleProfiles.get(String(row.roleId)) as FormGroup | null;
        if (!group) continue;
        group.patchValue({
          firstName: String(row.firstName ?? data.firstName ?? ''),
          lastName: String(row.lastName ?? data.lastName ?? ''),
          email: String(row.email ?? ''),
          profileImage: String(row.profileImage ?? data.profileImage ?? ''),
          isActive:
            row.isActive !== undefined
              ? Boolean(row.isActive)
              : Boolean(data.isActive ?? false),
          isDeleted: Boolean(row.isDeleted ?? row.isDeleteRequested ?? false),
        });
      }
      if (this.hasAdminRoleId(roleIds)) {
        if (Array.isArray(data.permissions) && data.permissions.length) {
          this.permissionsTouched = true;
          this.permissions.set(this.normalizePermissions(data.permissions));
        } else {
          this.permissionsTouched = false;
          this.loadPermissionsFromRoles(roleIds);
        }
      } else {
        this.permissions.set([]);
        this.permissionsTouched = false;
      }
    });
  }

  roleProfileGroup(roleId: number | string): FormGroup {
    return this.roleProfiles.get(String(roleId)) as FormGroup;
  }

  submit(): void {
    if (this.form.pending) {
      this.submitError.set('Please wait while phone/email validation finishes.');
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (!this.directoryRole()) {
        this.roleProfiles.markAllAsTouched();
      }
      this.submitError.set('Please fix the highlighted fields and try again.');
      return;
    }
    const v = this.form.getRawValue();
    const directoryRole = this.directoryRole();
    if (directoryRole) {
      const match = this.roles().find(
        (row) => String(row.label).trim().toLowerCase() === directoryRole,
      );
      if (match) {
        v.roleIds = [Number(match.value)];
      }
    }

    const payload: Record<string, unknown> = {
      phoneNumber: v.phoneNumber,
      roleIds: v.roleIds,
    };

    if (directoryRole) {
      payload['firstName'] = v.firstName;
      payload['lastName'] = v.lastName;
      payload['email'] = v.email;
      payload['profileImage'] = v.profileImage;
      payload['isActive'] = v.isActive;
    } else {
      const roleProfiles = this.selectedRoles().map((role) => {
        const group = this.roleProfileGroup(role.value);
        const raw = group.getRawValue();
        return {
          roleId: Number(role.value),
          firstName: String(raw.firstName || '').trim(),
          lastName: String(raw.lastName || '').trim(),
          email: String(raw.email || '').trim(),
          profileImage: String(raw.profileImage || '').trim() || undefined,
          isActive: Boolean(raw.isActive),
          isDeleted: Boolean(raw.isDeleted),
        } satisfies RoleProfileValue;
      });
      payload['roleProfiles'] = roleProfiles;
      payload['email'] = this.accountEmailFromProfiles(roleProfiles);
      const primary = this.primaryProfile(roleProfiles);
      payload['firstName'] = primary?.firstName || '';
      payload['lastName'] = primary?.lastName || '';
      payload['profileImage'] = primary?.profileImage || '';
      payload['isActive'] = primary?.isActive ?? false;
    }
    if (this.showPermissions()) {
      const permissionRows = this.permissions().map((row) => ({
        moduleId: Number(row.moduleId),
        canView: Boolean(row.canView),
        canAdd: Boolean(row.canAdd),
        canEdit: Boolean(row.canEdit),
        canDelete: Boolean(row.canDelete),
      }));
      const hasExplicitFlags = permissionRows.some(
        (row) => row.canView || row.canAdd || row.canEdit || row.canDelete,
      );
      // On create, omit empty template so backend applies Admin role defaults.
      if (this.isEdit() || this.permissionsTouched || hasExplicitFlags) {
        payload['permissions'] = permissionRows;
      }
    }

    this.saving.set(true);
    this.submitError.set('');
    this.crud.save(this.module(), this.recordId(), payload).subscribe((res) => {
      this.saving.set(false);
      if (!res.success) {
        this.submitError.set(res.message);
        return;
      }
      this.crud.redirectToList(this.module());
    });
  }

  private clearRoleProfileControls(): void {
    for (const key of Object.keys(this.roleProfiles.controls)) {
      this.roleProfiles.removeControl(key);
    }
  }

  private syncRoleProfileControls(roleIds: number[]): void {
    if (this.directoryRole()) {
      this.clearRoleProfileControls();
      return;
    }
    const keep = new Set(roleIds.map(String));
    for (const key of Object.keys(this.roleProfiles.controls)) {
      if (!keep.has(key)) {
        this.roleProfiles.removeControl(key);
      }
    }
    for (const roleId of roleIds) {
      const key = String(roleId);
      if (!this.roleProfiles.contains(key)) {
        this.roleProfiles.addControl(
          key,
          this.fb.nonNullable.group({
            firstName: ['', [Validators.required, Validators.minLength(2)]],
            lastName: [''],
            email: [
              '',
              {
                validators: [Validators.required, Validators.email],
                asyncValidators: [
                  this.emailAvailabilityValidator(() => Number(roleId)),
                ],
                updateOn: 'change',
              },
            ],
            profileImage: [''],
            isActive: [true],
            isDeleted: [false],
          }),
        );
      }
    }
  }

  private phoneAvailabilityValidator(): AsyncValidatorFn {
    return (control) => {
      const value = String(control.value ?? '').trim();
      if (!value || !/^[0-9]{5,10}$/.test(value)) {
        return of(null);
      }
      return timer(400).pipe(
        switchMap(() => this.crud.checkPhone(value, this.recordId())),
        map((res) => (res.available ? null : { phoneTaken: true })),
        catchError(() => of(null)),
      );
    };
  }

  private emailAvailabilityValidator(
    resolveRoleId: () => number | null | undefined,
  ): AsyncValidatorFn {
    return (control) => {
      const value = String(control.value ?? '').trim();
      if (!value || control.hasError('email') || control.hasError('required')) {
        return of(null);
      }
      const roleId = resolveRoleId();
      return timer(400).pipe(
        switchMap(() =>
          this.crud.checkEmail(value, this.recordId(), roleId || undefined),
        ),
        map((res) => {
          if (res.available) return null;
          const roleName = res.roleName || '';
          if (res.isVerified) {
            return {
              emailTakenVerified: true,
              emailCheckMessage:
                res.message ||
                (roleName
                  ? `${roleName} email already exists and is verified`
                  : 'Email already exists and is verified'),
            };
          }
          return {
            emailTaken: true,
            emailCheckMessage:
              res.message ||
              (res.existsForRole && roleName
                ? `${roleName} email already exists`
                : 'Email already exists'),
          };
        }),
        catchError(() => of(null)),
      );
    };
  }

  private directoryRoleId(): number | null {
    const directoryRole = this.directoryRole();
    if (!directoryRole) return null;
    const match = this.roles().find(
      (row) => String(row.label).trim().toLowerCase() === directoryRole,
    );
    return match ? Number(match.value) : null;
  }

  emailErrorMessage(control: AbstractControl | null | undefined): string {
    if (!control) return '';
    if (control.hasError('required')) return 'Email is required';
    if (control.hasError('email')) return 'Enter a valid email';
    const msg = control.getError('emailCheckMessage');
    if (typeof msg === 'string' && msg) return msg;
    if (control.hasError('emailTakenVerified')) {
      return 'Email already exists and is verified';
    }
    if (control.hasError('emailTaken')) return 'Email already exists';
    return '';
  }

  private primaryProfile(roleProfiles: RoleProfileValue[]) {
    const preference = ['admin', 'customer', 'seller'];
    for (const name of preference) {
      const role = this.roles().find(
        (row) => String(row.label).trim().toLowerCase() === name,
      );
      const match = roleProfiles.find(
        (row) => Number(row.roleId) === Number(role?.value),
      );
      if (match) return match;
    }
    return roleProfiles[0];
  }

  private accountEmailFromProfiles(roleProfiles: RoleProfileValue[]): string {
    return this.primaryProfile(roleProfiles)?.email || roleProfiles[0]?.email || '';
  }

  onPermissionsChange(rows: PermissionMatrixRow[]): void {
    this.permissionsTouched = true;
    this.permissions.set(rows);
  }

  isAdminRole(role: SelectOption): boolean {
    const pk = Number(role.value);
    const businessId = Number(role.raw?.['roleId'] ?? pk);
    return pk === this.adminRoleId || businessId === this.adminRoleId;
  }

  private hasAdminRoleId(roleIds: number[]): boolean {
    if (this.directoryRole() === 'admin') return true;
    const ids = roleIds.map(Number);
    if (ids.includes(this.adminRoleId)) return true;
    const selected = new Set(ids);
    return this.roles().some(
      (role) => selected.has(Number(role.value)) && this.isAdminRole(role),
    );
  }

  private adminRoleIdsFrom(roleIds: number[]): number[] {
    const selected = new Set(roleIds.map(Number));
    return this.roles()
      .filter((role) => selected.has(Number(role.value)) && this.isAdminRole(role))
      .map((role) => Number(role.value));
  }

  private loadPermissionsFromRoles(roleIds: number[]): void {
    const adminIds = this.adminRoleIdsFrom(roleIds);
    if (!adminIds.length && this.directoryRole() !== 'admin') {
      this.permissions.set([]);
      return;
    }
    const ids =
      adminIds.length > 0
        ? adminIds
        : roleIds.length
          ? roleIds
          : [this.adminRoleId];
    this.api
      .get('/users/permissions/from-roles', { roleIds: ids.join(',') })
      .subscribe({
        next: (res) =>
          this.permissions.set(this.normalizePermissions(res?.data ?? [])),
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
