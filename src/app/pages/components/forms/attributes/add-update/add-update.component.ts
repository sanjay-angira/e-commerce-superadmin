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

@Component({
  selector: 'app-attribute-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    AdminFormShellComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class AttributeFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly displayTypes = [
    { value: 'swatch', label: 'Swatch' },
    { value: 'image', label: 'Image' },
    { value: 'text', label: 'Text' },
    { value: 'dropdown', label: 'Dropdown' },
    { value: 'radio', label: 'Radio' },
  ];

  readonly inputTypes = [
    { value: 'single', label: 'Single' },
    { value: 'multiple', label: 'Multiple' },
  ];

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    displayType: ['text', Validators.required],
    inputType: ['single', Validators.required],
    unit: ['', Validators.maxLength(20)],
    isVariantDefining: [true],
    isFilterable: [true],
    sortOrder: [0, [Validators.min(0)]],
    isActive: [true],
  });

  ngOnInit(): void {
    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        name: String(data.name ?? ''),
        displayType: String(data.displayType ?? 'text'),
        inputType: String(data.inputType ?? 'single'),
        unit: String(data.unit ?? ''),
        isVariantDefining: data.isVariantDefining !== false,
        isFilterable: data.isFilterable !== false,
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
        name: v.name.trim(),
        displayType: v.displayType,
        inputType: v.inputType,
        unit: v.unit.trim() || null,
        isVariantDefining: v.isVariantDefining,
        isFilterable: v.isFilterable,
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
