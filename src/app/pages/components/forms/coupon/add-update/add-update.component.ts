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
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { normalizeIds, toDateInput } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-coupon-form',
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
export class CouponFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private usersLoaded = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly users = signal<SelectOption[]>([]);

  readonly uploadPath = UPLOAD_PATHS.coupons;

  readonly form = this.fb.nonNullable.group({
    couponCode: ['', [Validators.required, Validators.minLength(2)]],
    image: [''],
    discountType: ['percentage' as 'percentage' | 'fixed', Validators.required],
    discountValue: [0, Validators.required],
    startDate: ['', Validators.required],
    endDate: ['', Validators.required],
    isActive: [true],
    isUserSpecific: [false],
    userIds: [[] as number[]],
  });

  ngOnInit(): void {
    this.form.controls.isUserSpecific.valueChanges.subscribe((enabled) => {
      if (enabled) this.ensureUsersLoaded();
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      const isUserSpecific = Boolean(data.isUserSpecific ?? false);
      if (isUserSpecific) this.ensureUsersLoaded();
      this.form.patchValue({
        couponCode: String(data.couponCode ?? ''),
        image: String(data.image ?? ''),
        discountType: (data.discountType ?? 'percentage') as 'percentage' | 'fixed',
        discountValue: Number(data.discountValue ?? 0),
        startDate: toDateInput(data.startDate),
        endDate: toDateInput(data.endDate),
        isActive: Boolean(data.isActive ?? true),
        isUserSpecific,
        userIds: normalizeIds(data.userIds ?? data.users),
      });
    });
  }

  private ensureUsersLoaded(): void {
    if (this.usersLoaded) return;
    this.usersLoaded = true;
    this.options.users().subscribe((rows) => this.users.set(rows));
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
        couponCode: v.couponCode.trim(),
        image: v.image || null,
        discountType: v.discountType,
        discountValue: Number(v.discountValue),
        startDate: v.startDate,
        endDate: v.endDate,
        isActive: v.isActive,
        isUserSpecific: v.isUserSpecific,
        ...(v.isUserSpecific ? { userIds: v.userIds } : {}),
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
