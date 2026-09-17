import { Component, inject, input, OnInit, signal } from '@angular/core';
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
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';
import { normalizeColorCode } from '../../shared/form-utils';

@Component({
  selector: 'app-attribute-option-form',
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
  styleUrl: './add-update.component.scss',
})
export class AttributeOptionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();
  readonly swatchPath = UPLOAD_PATHS.attributeColors;

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly attributes = signal<SelectOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    attributeId: [null as number | null, Validators.required],
    value: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(150)]],
    normalizedValue: [''],
    hexCode: [''],
    swatchImageUrl: [''],
    sortOrder: [0, [Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    this.options.attributes().subscribe((rows) => this.attributes.set(rows));

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        attributeId: data.attributeId != null ? Number(data.attributeId) : null,
        value: String(data.value ?? ''),
        normalizedValue: String(data.normalizedValue ?? ''),
        hexCode: String(data.hexCode ?? ''),
        swatchImageUrl: String(data.swatchImageUrl ?? ''),
        sortOrder: Number(data.sortOrder ?? 0),
        isActive: data.isActive !== false,
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        attributeId: Number(v.attributeId),
        value: v.value.trim(),
        normalizedValue: v.normalizedValue.trim() || null,
        hexCode: v.hexCode.trim() ? normalizeColorCode(v.hexCode) : null,
        swatchImageUrl: v.swatchImageUrl.trim() || null,
        sortOrder: Number(v.sortOrder || 0),
        isActive: v.isActive,
      })
      .subscribe((res) => {
        this.saving.set(false);
        if (!res.success) {
          this.submitError.set(res.message);
          return;
        }
        this.crud.redirectToList(this.module());
      });
  }
}
