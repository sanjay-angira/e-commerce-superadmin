import { Component, computed, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

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
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class UserFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly roles = signal<SelectOption[]>([]);

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

  readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.minLength(2)]],
    lastName: [''],
    email: ['', [Validators.required, Validators.email]],
    phoneNumber: ['', [Validators.required, Validators.pattern(/^[0-9]{5,10}$/)]],
    roleIds: [[] as number[]],
    profileImage: [''],
    isActive: [false],
  });

  ngOnInit(): void {
    this.options.roles().subscribe((rows) => {
      this.roles.set(rows);
      const directoryRole = this.directoryRole();
      if (!directoryRole || this.isEdit()) return;
      const match = rows.find(
        (row) => String(row.label).trim().toLowerCase() === directoryRole,
      );
      if (match) {
        this.form.patchValue({ roleIds: [Number(match.value)] });
      }
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      const roleIds = Array.isArray(data.roleIds)
        ? normalizeIds(data.roleIds)
        : normalizeIds((data.userRoles ?? []).map((ur: any) => ur?.role?.id ?? ur?.roleId ?? ur));
      this.form.patchValue({
        firstName: String(data.firstName ?? ''),
        lastName: String(data.lastName ?? ''),
        email: String(data.email ?? ''),
        phoneNumber: String(data.phoneNumber ?? ''),
        roleIds,
        profileImage: String(data.profileImage ?? ''),
        isActive: Boolean(data.isActive ?? false),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
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
    this.saving.set(true);
    this.submitError.set('');
    this.crud.save(this.module(), this.recordId(), v).subscribe((res) => {
      this.saving.set(false);
      if (!res.success) {
        this.submitError.set(res.message);
        return;
      }
      this.crud.redirectToList(this.module());
    });
  }
}
