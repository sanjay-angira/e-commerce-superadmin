import { Component, OnInit, inject, input, signal } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, type MatSelectChange } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatDialog } from '@angular/material/dialog';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { MultiImageUploadComponent } from '../../shared/multi-image-upload.component';
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { AddTagDialogComponent } from '../add-tag-dialog.component';
import {
  generateSlug,
  htmlRequired,
  normalizeColorCode,
  normalizeIds,
  SLUG_PATTERN,
  stripHtml,
} from '../../shared/form-utils';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-product-form',
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    AdminFormShellComponent,
    ImageUploadComponent,
    MultiImageUploadComponent,
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private readonly dialog = inject(MatDialog);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();
  readonly uploadPaths = UPLOAD_PATHS;

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly brands = signal<SelectOption[]>([]);
  readonly rootCategories = signal<SelectOption[]>([]);
  readonly childCategoryLevels = signal<SelectOption[][]>([[]]);
  readonly offers = signal<SelectOption[]>([]);
  readonly products = signal<SelectOption[]>([]);
  readonly attributes = signal<SelectOption[]>([]);
  readonly productTags = signal<SelectOption[]>([]);

  private slugDirty = false;
  private variantSlugDirty: boolean[] = [false];
  readonly addTagValue = '__add_tag__';

  readonly form = this.fb.group({
    productName: ['', [Validators.required, Validators.minLength(2)]],
    productSlug: [
      '',
      [Validators.required, Validators.minLength(3), Validators.maxLength(100), Validators.pattern(SLUG_PATTERN)],
    ],
    shortDescription: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', htmlRequired(2)],
    brandId: ['' as number | string | '', Validators.required],
    category: ['' as number | string | '', Validators.required],
    childCategories: this.fb.nonNullable.control<number[]>([]),
    productOffers: this.fb.nonNullable.control<number[]>([]),
    productTags: this.fb.nonNullable.control<number[]>([]),
    frequentlyBoughtTogether: this.fb.nonNullable.control<number[]>([]),
    images: this.fb.nonNullable.control<string[]>([], Validators.required),
    attributeIds: this.fb.nonNullable.control<number[]>([]),
    attributeCustomerDisplay: this.fb.nonNullable.group({}),
    variants: this.fb.array([this.createVariantGroup()]),
    seo: this.fb.group({
      metaTitle: ['', Validators.required],
      metaDescription: ['', Validators.required],
      metaKeywords: [''],
      canonicalUrl: [''],
      ogImage: [''],
    }),
    publishStatus: ['draft', Validators.required],
    isActive: [true],
  });

  get variants(): FormArray {
    return this.form.get('variants') as FormArray;
  }

  ngOnInit(): void {
    this.options.brands().subscribe((r) => this.brands.set(r));
    this.options.rootCategories().subscribe((r) => this.rootCategories.set(r));
    this.options.offers().subscribe((r) => this.offers.set(r));
    this.options.products().subscribe((r) => this.products.set(r));
    this.options.attributes().subscribe((r) => this.attributes.set(r));
    this.options.productTags().subscribe((r) => this.productTags.set(r));

    this.form.get('productName')?.valueChanges.subscribe((name) => {
      if (!this.isEdit() && !this.slugDirty) {
        this.form.patchValue({ productSlug: generateSlug(name || '') }, { emitEvent: false });
      }
    });

    this.form.get('attributeIds')?.valueChanges.subscribe((ids) => {
      this.syncAttributeDisplayControls(ids || []);
      this.syncAllVariantAttributes(ids || []);
    });

    this.form.get('category')?.valueChanges.subscribe((id) => {
      if (id) this.loadChildLevel(0, Number(id));
      else {
        this.childCategoryLevels.set([[]]);
        this.form.patchValue({ childCategories: [] }, { emitEvent: false });
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
      this.patchFromRecord(data);
    });
  }

  markSlugDirty(): void {
    this.slugDirty = true;
  }

  createVariantGroup(data?: any): FormGroup {
    const group = this.fb.group({
      id: [data?.id ?? null],
      name: [data?.name ?? '', Validators.required],
      slug: [
        data?.slug ?? '',
        [Validators.required, Validators.minLength(3), Validators.pattern(SLUG_PATTERN)],
      ],
      description: [data?.description ?? ''],
      sku: [data?.sku ?? ''],
      price: [data?.price ?? '', [Validators.required, Validators.min(0.01)]],
      stock: [data?.stock ?? 1, [Validators.required, Validators.min(0)]],
      productVariantOffers: [normalizeIds(data?.productVariantOffers ?? data?.productOffers)],
      images: [this.normalizeImageUrls(data?.images ?? data?.variantImages ?? data?.image)],
      variantAttributes: this.fb.array([] as any[]),
    });
    return group;
  }

  addVariant(): void {
    this.variants.push(this.createVariantGroup());
    this.variantSlugDirty.push(false);
    this.syncAllVariantAttributes(this.form.value.attributeIds || []);
  }

  removeVariant(index: number): void {
    if (this.variants.length <= 1) return;
    this.variants.removeAt(index);
    this.variantSlugDirty.splice(index, 1);
  }

  onVariantName(index: number): void {
    const group = this.variants.at(index);
    const name = group.get('name')?.value || '';
    if (!this.variantSlugDirty[index]) {
      group.patchValue({ slug: generateSlug(name) }, { emitEvent: false });
    }
  }

  markVariantSlugDirty(index: number): void {
    this.variantSlugDirty[index] = true;
  }

  variantAttributes(index: number): FormArray {
    return this.variants.at(index).get('variantAttributes') as FormArray;
  }

  attrSupportsImage(attrId: number): boolean {
    const attr = this.attributes().find((a) => Number(a.value) === Number(attrId));
    const name = (attr?.label || '').toLowerCase();
    return Boolean(attr?.supportsImage) || name === 'color' || name.includes('colour');
  }

  displayMode(attrId: number): string {
    const group = this.form.get('attributeCustomerDisplay') as FormGroup;
    return group.get(String(attrId))?.value || 'value';
  }

  onChildCategory(level: number, value: number | ''): void {
    const current = [...(this.form.value.childCategories || [])];
    const next = current.slice(0, level);
    if (value) next[level] = Number(value);
    this.form.patchValue({ childCategories: next });
    if (value) this.loadChildLevel(level + 1, Number(value));
    else {
      const levels = this.childCategoryLevels().slice(0, level + 1);
      levels[level] = levels[level] || [];
      this.childCategoryLevels.set(levels);
    }
  }

  private loadChildLevel(level: number, parentId: number): void {
    this.options.childCategories(parentId).subscribe((opts) => {
      const levels = [...this.childCategoryLevels()];
      levels[level] = opts;
      this.childCategoryLevels.set(levels.slice(0, level + 1));
    });
  }

  private syncAttributeDisplayControls(ids: number[]): void {
    const group = this.form.get('attributeCustomerDisplay') as FormGroup;
    Object.keys(group.controls).forEach((key) => {
      if (!ids.includes(Number(key))) group.removeControl(key);
    });
    ids.forEach((id) => {
      if (!group.contains(String(id)) && this.attrSupportsImage(id)) {
        group.addControl(String(id), this.fb.nonNullable.control('value'));
      }
    });
  }

  private syncAllVariantAttributes(ids: number[]): void {
    this.variants.controls.forEach((variantCtrl) => {
      const arr = variantCtrl.get('variantAttributes') as FormArray;
      const existing = new Map(
        arr.controls.map((c) => [Number(c.value.attributeId), c.value])
      );
      arr.clear();
      ids.forEach((attributeId) => {
        const prev = existing.get(attributeId);
        arr.push(
          this.fb.group({
            attributeId: [attributeId],
            value: [prev?.value ?? '', Validators.required],
            code: [prev?.code ?? ''],
            image: [prev?.image ?? ''],
            viewOption: [prev?.viewOption ?? ''],
          })
        );
      });
    });
  }

  private normalizeImageUrls(value: unknown): string[] {
    if (!value) return [];
    if (typeof value === 'string') return value ? [value] : [];
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'url' in item) return String((item as any).url);
        return '';
      })
      .filter(Boolean);
  }

  private getDeepestCategoryId(): number | '' {
    const children = this.form.value.childCategories || [];
    for (let i = children.length - 1; i >= 0; i--) {
      if (children[i]) return Number(children[i]);
    }
    const root = this.form.value.category;
    return root ? Number(root) : '';
  }

  private patchFromRecord(r: any): void {
    this.slugDirty = true;
    const attributeIds = normalizeIds(
      r.productAttributes?.map((pa: any) => pa.attribute?.id ?? pa.attributeId) ??
        r.attributes?.map((a: any) => a.attributeId ?? a.id) ??
        r.attributeIds
    );
    const variantsRaw = Array.isArray(r.variants) && r.variants.length ? r.variants : [{}];
    this.variants.clear();
    this.variantSlugDirty = [];
    variantsRaw.forEach((v: any) => {
      this.variants.push(this.createVariantGroup(v));
      this.variantSlugDirty.push(true);
    });

    this.form.patchValue({
      productName: r.productName ?? '',
      productSlug: r.productSlug ?? '',
      shortDescription: r.shortDescription ?? '',
      description: r.description ?? '',
      brandId: r.brandId ?? r.brand?.id ?? '',
      category: r.category?.id ?? r.category ?? '',
      childCategories: [],
      productOffers: normalizeIds(r.productOffers ?? r.offers),
      productTags: normalizeIds(r.productTags ?? r.tags),
      frequentlyBoughtTogether: normalizeIds(r.frequentlyBoughtTogether),
      images: this.normalizeImageUrls(r.images ?? r.productImages),
      attributeIds,
      publishStatus: r.publishStatus ?? 'draft',
      isActive: Boolean(r.isActive ?? true),
      seo: {
        metaTitle: r.seo?.metaTitle ?? r.metaTitle ?? '',
        metaDescription: r.seo?.metaDescription ?? r.metaDescription ?? '',
        metaKeywords: r.seo?.metaKeywords ?? r.metaKeywords ?? '',
        canonicalUrl: r.seo?.canonicalUrl ?? r.canonicalUrl ?? '',
        ogImage: r.seo?.ogImage ?? r.ogImage ?? '',
      },
    });

    this.syncAttributeDisplayControls(attributeIds);
    // restore display modes + variant attrs after patch
    setTimeout(() => {
      this.syncAllVariantAttributes(attributeIds);
      variantsRaw.forEach((v: any, vi: number) => {
        const attrs = v.variantAttributes || [];
        attrs.forEach((a: any) => {
          const attrId = Number(a.attributeId ?? a.attribute?.id);
          if (this.attrSupportsImage(attrId) && a.viewOption) {
            (this.form.get('attributeCustomerDisplay') as FormGroup)
              .get(String(attrId))
              ?.setValue(a.viewOption);
          }
          const control = this.variantAttributes(vi).controls.find(
            (c) => Number(c.value.attributeId) === attrId
          );
          control?.patchValue({
            value: a.value ?? '',
            code: a.code ?? '',
            image: a.image ?? '',
            viewOption: a.viewOption ?? '',
          });
        });
      });
    });
  }

  onTagsSelectionChange(event: MatSelectChange): void {
    const values = (event.value || []) as Array<number | string>;
    const wantsAdd = values.some((value) => String(value) === this.addTagValue);
    const selectedIds = values
      .filter((value) => String(value) !== this.addTagValue)
      .map(Number)
      .filter((id) => Number.isFinite(id) && id > 0);
    this.form.controls.productTags.setValue(selectedIds, { emitEvent: false });
    if (wantsAdd) {
      queueMicrotask(() => this.openAddTagDialog());
    }
  }

  private openAddTagDialog(): void {
    this.dialog
      .open(AddTagDialogComponent, {
        data: { existingNames: this.productTags().map((opt) => opt.label) },
        width: '480px',
        maxWidth: '90vw',
        panelClass: 'vr-dialog',
        autoFocus: 'first-tabbable',
      })
      .afterClosed()
      .subscribe((created?: SelectOption) => {
        if (!created?.value) return;
        const tagId = Number(created.value);
        if (!tagId) return;
        if (!this.productTags().some((opt) => Number(opt.value) === tagId)) {
          this.productTags.update((list) => [...list, created]);
        }
        const current = this.form.controls.productTags.value || [];
        if (!current.some((value) => Number(value) === tagId)) {
          this.form.controls.productTags.setValue([...current, tagId]);
        }
      });
  }

  isStepValid(step: number): boolean {
    const v = this.form.getRawValue();
    if (step === 1) {
      const categorySelected = Boolean(v.category || (v.childCategories || []).some(Boolean));
      const descriptionText = stripHtml(v.description || '');
      const displayGroup = this.form.get('attributeCustomerDisplay') as FormGroup;
      const displayValid = (v.attributeIds || [])
        .filter((id: number) => this.attrSupportsImage(id))
        .every((id: number) => Boolean(displayGroup.get(String(id))?.value));
      return (
        (v.productName || '').trim().length >= 2 &&
        SLUG_PATTERN.test((v.productSlug || '').trim()) &&
        (v.shortDescription || '').trim().length >= 2 &&
        descriptionText.length >= 2 &&
        !!v.brandId &&
        categorySelected &&
        (v.images || []).length >= 1 &&
        displayValid &&
        this.form.controls.productName.valid &&
        this.form.controls.productSlug.valid &&
        this.form.controls.shortDescription.valid &&
        this.form.controls.description.valid &&
        this.form.controls.brandId.valid &&
        this.form.controls.category.valid &&
        this.form.controls.images.valid
      );
    }
    if (step === 2) {
      if (!this.variants.length) return false;
      return this.variants.controls.every((ctrl) => {
        const variant = ctrl.getRawValue();
        const slug = String(variant.slug || '').trim();
        if (!String(variant.name || '').trim()) return false;
        if (!SLUG_PATTERN.test(slug)) return false;
        if (variant.price === '' || Number(variant.price) < 0.01) return false;
        if (variant.stock === '' || Number(variant.stock) < 0) return false;
        if (ctrl.invalid) return false;
        return (variant.variantAttributes || []).every((a: any) => {
          if (!String(a.value || '').trim()) return false;
          if (!this.attrSupportsImage(a.attributeId)) return true;
          const display = this.displayMode(a.attributeId);
          if (display === 'code') return Boolean(String(a.code || '').trim());
          if (display === 'image') return Boolean(String(a.image || '').trim());
          return true;
        });
      });
    }
    if (step === 3) {
      const seo = this.form.get('seo');
      return Boolean(seo?.valid);
    }
    if (step === 4) {
      return this.form.controls.publishStatus.valid;
    }
    return true;
  }

  submit(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.isStepValid(3) || !this.isStepValid(4)) {
      this.form.markAllAsTouched();
      this.variants.controls.forEach((ctrl) => ctrl.markAllAsTouched());
      this.submitError.set('Please complete all required fields before saving.');
      return;
    }
    const v = this.form.getRawValue();
    const displayGroup = this.form.get('attributeCustomerDisplay') as FormGroup;
    const payload = {
      productName: v.productName,
      productSlug: v.productSlug,
      shortDescription: v.shortDescription,
      description: v.description,
      publishStatus: v.publishStatus,
      isActive: v.isActive,
      brandId: Number(v.brandId),
      category: this.getDeepestCategoryId(),
      productOffers: v.productOffers,
      productTags: (v.productTags || []).map(Number).filter((id) => Number.isFinite(id) && id > 0),
      frequentlyBoughtTogether: v.frequentlyBoughtTogether,
      images: (v.images || []).map((url: string, i: number) => ({
        url,
        sortOrder: i + 1,
      })),
      attributes: (v.attributeIds || []).map((id: number) => ({ attributeId: id })),
      variants: this.variants.controls.map((ctrl) => {
        const variant = ctrl.getRawValue();
        return {
          ...(variant.id ? { id: variant.id } : {}),
          name: String(variant.name || '').trim(),
          slug: String(variant.slug || '').trim() || generateSlug(variant.name || ''),
          description: variant.description || undefined,
          price: Number(variant.price),
          stock: Number(variant.stock),
          ...(variant.sku ? { sku: variant.sku } : {}),
          images: (variant.images || []).map((url: string, i: number) => ({
            url,
            sortOrder: i + 1,
          })),
          productVariantOffers: variant.productVariantOffers || [],
          variantAttributes: (variant.variantAttributes || [])
            .filter((a: any) => String(a.value || '').trim())
            .map((a: any) => {
              const attributeId = Number(a.attributeId);
              const p: any = {
                attributeId,
                value: String(a.value).trim(),
              };
              if (this.attrSupportsImage(attributeId)) {
                const display = displayGroup.get(String(attributeId))?.value || 'value';
                p.viewOption = display;
                if (display === 'code') p.code = normalizeColorCode(a.code);
                if (display === 'image') p.image = String(a.image || '').trim();
              } else {
                if (a.code) p.code = String(a.code).trim();
                if (a.image) p.image = String(a.image).trim();
                if (a.viewOption) p.viewOption = a.viewOption;
              }
              return p;
            }),
        };
      }),
      seo: {
        metaTitle: v.seo.metaTitle,
        metaDescription: v.seo.metaDescription,
        metaKeywords: v.seo.metaKeywords,
        canonicalUrl: v.seo.canonicalUrl,
        ogImage: v.seo.ogImage,
        metaRobots: 'index, follow',
        twitterCard: 'summary_large_image',
        schemaType: 'Product',
      },
    };

    this.saving.set(true);
    this.submitError.set('');
    this.crud.save(this.module(), this.recordId(), payload).subscribe((res) => {
      this.saving.set(false);
      if (!res.success) {
        this.submitError.set(res.message);
        return;
      }
      this.crud.redirectToList(this.module());
    });
  }
}
