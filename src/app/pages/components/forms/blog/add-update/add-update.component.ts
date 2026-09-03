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
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { generateSlug, normalizeIds } from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-blog-form',
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
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class BlogFormComponent implements OnInit {
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
  readonly tags = signal<SelectOption[]>([]);

  readonly uploadPath = UPLOAD_PATHS.blogs;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    content: ['', Validators.required],
    excerpt: [''],
    categoryId: [null as number | null, Validators.required],
    blogImage: ['', Validators.required],
    blogImageAlt: [''],
    tagIds: [[] as number[]],
    status: ['draft' as 'draft' | 'published' | 'scheduled'],
    isActive: [true],
    isFeatured: [false],
    metaTitle: [''],
    metaDescription: [''],
  });

  ngOnInit(): void {
    this.options.blogCategories().subscribe((rows) => this.categories.set(rows));
    this.options.blogTags().subscribe((rows) => this.tags.set(rows));

    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.slug.setValue(generateSlug(title), { emitEvent: false });
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
      const tagIds = normalizeIds(data.tagIds ?? data.tags);
      const categoryId = Number(data.categoryId ?? data.category?.id ?? null) || null;
      this.form.patchValue({
        title: String(data.title ?? ''),
        slug: String(data.slug ?? ''),
        content: String(data.content ?? ''),
        excerpt: String(data.excerpt ?? ''),
        categoryId,
        blogImage: String(data.blogImage ?? data.featuredImage ?? ''),
        blogImageAlt: String(data.blogImageAlt ?? ''),
        tagIds,
        status: (data.status ?? data.publishStatus ?? 'draft') as 'draft' | 'published' | 'scheduled',
        isActive: Boolean(data.isActive ?? true),
        isFeatured: Boolean(data.isFeatured ?? false),
        metaTitle: String(seo.metaTitle ?? data.metaTitle ?? ''),
        metaDescription: String(seo.metaDescription ?? data.metaDescription ?? ''),
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
        title: v.title,
        slug: v.slug,
        content: v.content,
        excerpt: v.excerpt,
        categoryId: Number(v.categoryId),
        blogImage: v.blogImage,
        blogImageAlt: v.blogImageAlt || null,
        tagIds: v.tagIds,
        status: v.status,
        publishStatus: v.status,
        isActive: v.isActive,
        isFeatured: v.isFeatured,
        seo: {
          metaTitle: v.metaTitle,
          metaDescription: v.metaDescription,
        },
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
