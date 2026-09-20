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
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-brand-form',
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
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class BrandFormComponent implements OnInit {
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
  readonly categories = signal<SelectOption[]>([]);
  readonly offers = signal<SelectOption[]>([]);
  readonly paths = UPLOAD_PATHS.brands;

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(150)]],
    website: ['', Validators.maxLength(255)],
    description: [''],
    countryOfOrigin: ['', Validators.maxLength(100)],
    gstNumber: ['', Validators.maxLength(50)],
    supportEmail: ['', Validators.maxLength(150)],
    supportPhone: ['', Validators.maxLength(20)],
    instagramUrl: ['', Validators.maxLength(255)],
    facebookUrl: ['', Validators.maxLength(255)],
    metaTitle: ['', Validators.maxLength(160)],
    metaDescription: ['', Validators.maxLength(300)],
    sortOrder: [0, [Validators.min(0)]],
    logoUrl: [''],
    bannerImageUrl: [''],
    ogImageUrl: [''],
    trademarkCertificateUrl: [''],
    categoryIds: [[] as number[]],
    offerIds: [[] as number[]],
    isVerified: [false],
    isFeatured: [false],
    isActive: [true],
  });

  ngOnInit(): void {
    this.options.categories().subscribe((rows) => this.categories.set(rows));
    this.options.offers().subscribe((rows) => this.offers.set(rows));

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        name: String(data.name ?? data.brandName ?? ''),
        website: String(data.website ?? ''),
        description: String(data.description ?? ''),
        countryOfOrigin: String(data.countryOfOrigin ?? ''),
        gstNumber: String(data.gstNumber ?? ''),
        supportEmail: String(data.supportEmail ?? ''),
        supportPhone: String(data.supportPhone ?? ''),
        instagramUrl: String(data.instagramUrl ?? ''),
        facebookUrl: String(data.facebookUrl ?? ''),
        metaTitle: String(data.metaTitle ?? ''),
        metaDescription: String(data.metaDescription ?? ''),
        sortOrder: Number(data.sortOrder ?? 0),
        logoUrl: String(data.logoUrl ?? data.logo ?? ''),
        bannerImageUrl: String(data.bannerImageUrl ?? ''),
        ogImageUrl: String(data.ogImageUrl ?? ''),
        trademarkCertificateUrl: String(data.trademarkCertificateUrl ?? ''),
        categoryIds: normalizeIds(data.categoryIds ?? data.categories),
        offerIds: normalizeIds(data.offerIds ?? data.brandOffers ?? data.offers),
        isVerified: Boolean(data.isVerified),
        isFeatured: Boolean(data.isFeatured),
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
    const emptyToNull = (value: string) => value.trim() || null;
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        name: v.name.trim(),
        website: emptyToNull(v.website),
        description: emptyToNull(v.description),
        countryOfOrigin: emptyToNull(v.countryOfOrigin),
        gstNumber: emptyToNull(v.gstNumber),
        supportEmail: emptyToNull(v.supportEmail),
        supportPhone: emptyToNull(v.supportPhone),
        instagramUrl: emptyToNull(v.instagramUrl),
        facebookUrl: emptyToNull(v.facebookUrl),
        metaTitle: emptyToNull(v.metaTitle),
        metaDescription: emptyToNull(v.metaDescription),
        sortOrder: Number(v.sortOrder || 0),
        logoUrl: emptyToNull(v.logoUrl),
        bannerImageUrl: emptyToNull(v.bannerImageUrl),
        ogImageUrl: emptyToNull(v.ogImageUrl),
        trademarkCertificateUrl: emptyToNull(v.trademarkCertificateUrl),
        categoryIds: v.categoryIds,
        offerIds: v.offerIds,
        isVerified: v.isVerified,
        isFeatured: v.isFeatured,
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
