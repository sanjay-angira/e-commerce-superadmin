import { Component, Type, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgComponentOutlet } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  getAdminModuleApiPath,
  getAdminModuleTableConfig,
  isAdminModuleKey,
  type AdminFormField,
  type AdminModuleKey,
} from '../../../../static-data/admin-module-table.config';
import { ApiService } from '../../../core/services/api.service';
import { getAdminFormComponent, hasAdminForm } from '../forms/form-registry';

@Component({
  selector: 'app-module-form',
  imports: [
    NgComponentOutlet,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './module-form.component.html',
  styleUrl: './module-form.component.scss',
})
export class ModuleFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly moduleKey = signal('');
  readonly recordId = signal<string | undefined>(undefined);
  readonly dedicatedForm = signal<Type<any> | null>(null);

  label = '';
  apiPath = '';
  fields: AdminFormField[] = [];
  form = this.fb.group({});

  readonly formInputs = computed(() => ({
    module: this.moduleKey(),
    recordId: this.recordId(),
  }));

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const module = params.get('module') || '';
      if (!isAdminModuleKey(module)) {
        this.router.navigateByUrl('/admin/dashboard');
        return;
      }

      this.moduleKey.set(module);
      this.recordId.set(params.get('id') || undefined);
      this.isEdit.set(!!params.get('id'));

      if (hasAdminForm(module)) {
        this.dedicatedForm.set(getAdminFormComponent(module));
        return;
      }

      // Fallback generic form for modules without a dedicated component
      this.dedicatedForm.set(null);
      const config = getAdminModuleTableConfig(module)!;
      this.apiPath = getAdminModuleApiPath(module);
      this.label = config.label;
      this.fields = config.formFields || [];
      this.buildForm();

      const id = params.get('id');
      if (id) {
        this.loading.set(true);
        this.api.get(`/${this.apiPath}/${id}`).subscribe({
          next: (res) => {
            this.form.patchValue(res?.data ?? res ?? {});
            this.loading.set(false);
          },
          error: () => {
            this.loading.set(false);
            this.snack.open('Failed to load record', 'Dismiss', { duration: 3500 });
          },
        });
      }
    });
  }

  private buildForm(): void {
    const group: Record<string, FormControl> = {};
    for (const field of this.fields) {
      const validators = field.required ? [Validators.required] : [];
      const initial =
        field.type === 'toggle' ? false : field.type === 'number' ? null : '';
      group[field.key] = new FormControl(initial, validators);
    }
    this.form = this.fb.group(group);
  }

  submit(): void {
    if (!this.fields.length) {
      this.snack.open('No form fields configured for this module', 'Dismiss', {
        duration: 3000,
      });
      return;
    }
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    const payload = this.form.getRawValue();
    const id = this.recordId();
    const req = id
      ? this.api.put(`/${this.apiPath}/${id}`, payload)
      : this.api.post(`/${this.apiPath}`, payload);

    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open(id ? 'Updated' : 'Created', 'OK', { duration: 2500 });
        this.router.navigateByUrl(`/admin/${this.moduleKey()}`);
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message || 'Save failed', 'Dismiss', {
          duration: 4000,
        });
      },
    });
  }
}
