import { Component, inject, input, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { generateSlug, normalizeIds, stripHtml } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-category-form',
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    AdminFormShellComponent,
    ImageUploadComponent,
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss',
})
export class CategoryFormComponent implements OnInit {
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

  readonly paths = UPLOAD_PATHS.categories;
  readonly shortDescMax = 500;
  readonly metaTitleMax = 70;
  readonly metaDescMax = 320;

  readonly form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    categorySlug: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
    shortDescription: ['', [Validators.required, Validators.maxLength(this.shortDescMax)]],
    description: ['', [this.quillRequired]],
    parentId: [null as number | null],
    offerIds: [[] as number[]],
    publishStatus: ['draft' as 'draft' | 'published'],
    isActive: [true],
    showOnHomePage: [false],
    image: [''],
    video: [''],
    icon: [''],
    imageAltText: [''],
    seo: this.fb.nonNullable.group({
      metaTitle: ['', [Validators.required, Validators.maxLength(this.metaTitleMax)]],
      metaDescription: ['', [Validators.required, Validators.maxLength(this.metaDescMax)]],
      metaKeywords: [''],
    }),
  });

  ngOnInit(): void {
    this.options.categories().subscribe((rows) => this.categories.set(rows));
    this.options.offers().subscribe((rows) => this.offers.set(rows));

    this.form.controls.categoryName.valueChanges.subscribe((name) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.categorySlug.setValue(generateSlug(name), { emitEvent: false });
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
      const seo = data.seo ?? {};
      const parentIdRaw = data.parentId ?? data.parent?.id;
      this.form.patchValue({
        categoryName: String(data.categoryName ?? ''),
        categorySlug: String(data.categorySlug ?? ''),
        shortDescription: String(data.shortDescription ?? ''),
        description: String(data.description ?? ''),
        parentId: parentIdRaw != null && parentIdRaw !== '' ? Number(parentIdRaw) : null,
        offerIds: normalizeIds(data.offerIds ?? data.categoryOffers),
        publishStatus: data.publishStatus === 'published' ? 'published' : 'draft',
        isActive: Boolean(data.isActive ?? true),
        showOnHomePage: Boolean(data.showOnHomePage ?? false),
        image: String(data.image ?? ''),
        video: String(data.video ?? ''),
        icon: String(data.icon ?? ''),
        imageAltText: String(data.imageAltText ?? ''),
        seo: {
          metaTitle: String(seo.metaTitle ?? data.metaTitle ?? ''),
          metaDescription: String(seo.metaDescription ?? data.metaDescription ?? ''),
          metaKeywords: String(seo.metaKeywords ?? data.metaKeywords ?? ''),
        },
      });
    });
  }

  markSlugDirty(): void {
    this.slugManuallyDirty = true;
  }

  shortDescLength(): number {
    return this.form.controls.shortDescription.value.length;
  }

  metaTitleLength(): number {
    return this.form.controls.seo.controls.metaTitle.value.length;
  }

  metaDescLength(): number {
    return this.form.controls.seo.controls.metaDescription.value.length;
  }

  isStepValid(step: number): boolean {
    if (step === 1) {
      return (
        this.form.controls.categoryName.valid &&
        this.form.controls.categorySlug.valid &&
        this.form.controls.shortDescription.valid &&
        this.form.controls.description.valid
      );
    }
    if (step === 3) {
      return this.form.controls.seo.valid;
    }
    return true;
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
        categoryName: v.categoryName,
        categorySlug: v.categorySlug,
        shortDescription: v.shortDescription,
        description: v.description,
        parentId: v.parentId ? Number(v.parentId) : null,
        offerIds: v.offerIds,
        publishStatus: v.publishStatus,
        isActive: v.isActive,
        showOnHomePage: v.showOnHomePage,
        image: v.image || null,
        video: v.video || null,
        icon: v.icon || null,
        imageAltText: v.imageAltText || null,
        seo: v.seo,
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

  private quillRequired(control: AbstractControl): ValidationErrors | null {
    return stripHtml(String(control.value || '')) ? null : { required: true };
  }
}
