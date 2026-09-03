import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { generateSlug, toDateTimeLocal } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-offer-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatButtonModule,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class OfferFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private slugManuallyDirty = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly uploadPath = UPLOAD_PATHS.offers;

  readonly form = this.fb.nonNullable.group({
    offerName: ['', [Validators.required, Validators.minLength(2)]],
    offerSlug: ['', Validators.required],
    image: [''],
    discountType: ['percentage' as 'percentage' | 'fixed', Validators.required],
    discountValue: [0, Validators.required],
    timeBased: [false],
    startDateTime: [''],
    endDateTime: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.form.controls.offerName.valueChanges.subscribe((name) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.offerSlug.setValue(generateSlug(name), { emitEvent: false });
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
      this.slugManuallyDirty = true;
      this.form.patchValue({
        offerName: String(data.offerName ?? ''),
        offerSlug: String(data.offerSlug ?? ''),
        image: String(data.image ?? ''),
        discountType: (data.discountType ?? 'percentage') as 'percentage' | 'fixed',
        discountValue: Number(data.discountValue ?? 0),
        timeBased: Boolean(data.timeBased ?? false),
        startDateTime: toDateTimeLocal(data.startDateTime ?? data.startDate),
        endDateTime: toDateTimeLocal(data.endDateTime ?? data.endDate),
        isActive: Boolean(data.isActive ?? true),
      });
    });
  }

  markSlugDirty(): void {
    this.slugManuallyDirty = true;
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
        offerName: v.offerName,
        offerSlug: v.offerSlug,
        image: v.image || null,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        timeBased: v.timeBased,
        isActive: v.isActive,
        ...(v.timeBased
          ? {
              startDate: new Date(v.startDateTime).toISOString(),
              endDate: new Date(v.endDateTime).toISOString(),
            }
          : {}),
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
