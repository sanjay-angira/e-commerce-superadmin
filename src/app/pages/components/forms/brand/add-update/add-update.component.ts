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
import { generateSlug, normalizeIds } from '../../shared/form-utils';

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
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class BrandFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private slugManuallyDirty = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly categories = signal<SelectOption[]>([]);
  readonly offers = signal<SelectOption[]>([]);

  readonly form = this.fb.nonNullable.group({
    brandName: ['', [Validators.required, Validators.minLength(2)]],
    brandSlug: ['', Validators.required],
    shortDescription: [''],
    description: [''],
    website: [''],
    categoryIds: [[] as number[]],
    offerIds: [[] as number[]],
    metaTitle: [''],
    metaDescription: [''],
    metaKeywords: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.options.categories().subscribe((rows) => this.categories.set(rows));
    this.options.offers().subscribe((rows) => this.offers.set(rows));

    this.form.controls.brandName.valueChanges.subscribe((name) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.brandSlug.setValue(generateSlug(name), { emitEvent: false });
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
        brandName: String(data.brandName ?? ''),
        brandSlug: String(data.brandSlug ?? ''),
        shortDescription: String(data.shortDescription ?? ''),
        description: String(data.description ?? ''),
        website: String(data.website ?? ''),
        categoryIds: normalizeIds(data.categoryIds ?? data.categories),
        offerIds: normalizeIds(data.offerIds ?? data.brandOffers ?? data.offers),
        metaTitle: String(data.metaTitle ?? data.seo?.metaTitle ?? ''),
        metaDescription: String(data.metaDescription ?? data.seo?.metaDescription ?? ''),
        metaKeywords: String(data.metaKeywords ?? data.seo?.metaKeywords ?? ''),
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
        ...v,
        website: v.website || undefined,
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
