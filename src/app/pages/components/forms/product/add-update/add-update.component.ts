import { Component, DestroyRef, OnInit, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule, type MatSelectChange } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRadioModule } from '@angular/material/radio';
import { MatDialog } from '@angular/material/dialog';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type CategoryFormConfig, type FormConfigTab, type SelectOption } from '../../shared/form-options.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { MultiImageUploadComponent } from '../../shared/multi-image-upload.component';
import { QuillEditorComponent } from '../../shared/quill-editor.component';
import { DynamicAttributeTabComponent } from '../../shared/dynamic-attribute-tab.component';
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
    MatTabsModule,
    MatRadioModule,
    AdminFormShellComponent,
    ImageUploadComponent,
    MultiImageUploadComponent,
    QuillEditorComponent,
    DynamicAttributeTabComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class ProductFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  readonly formTick = signal(0);

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
  readonly formConfig = signal<CategoryFormConfig | null>(null);
  readonly formConfigLoading = signal(false);
  private readonly formConfigCache = new Map<number, CategoryFormConfig>();
  private lastFormConfigCategoryId: number | null = null;
  private pendingAttributeValues: Array<{ attributeId: number; optionId?: number | null; value?: string | null }> = [];

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
    attributeIds: this.fb.nonNullable.control<number[]>([]),
    attributeCustomerDisplay: this.fb.nonNullable.group({}),
    attributeValues: this.fb.array([] as FormGroup[]),
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

  get attributeValues(): FormArray {
    return this.form.get('attributeValues') as FormArray;
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
      const normalized = this.normalizeAttributeIds(ids);
      this.syncAttributeDisplayControls(normalized);
      this.syncAllVariantAttributes(normalized);
    });

    this.form.get('category')?.valueChanges.subscribe((id) => {
      if (id) this.loadChildLevel(0, Number(id));
      else {
        this.childCategoryLevels.set([[]]);
        this.form.patchValue({ childCategories: [] }, { emitEvent: false });
      }
      this.onCategoryPathChanged();
    });

    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((n) => n + 1);
    });
    this.form.statusChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.formTick.update((n) => n + 1);
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
        [Validators.required, Validators.pattern(SLUG_PATTERN)],
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
    this.syncAllVariantAttributes(this.form.value.attributeIds);
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

  attrSupportsImage(attrId: number | string | null | undefined): boolean {
    const id = Number(attrId);
    if (!Number.isFinite(id)) return false;
    const attr = this.attributes().find((a) => Number(a.value) === id);
    const name = (attr?.label || '').toLowerCase();
    const displayType = String(attr?.displayType || '').toLowerCase();
    return (
      displayType === 'swatch' ||
      displayType === 'image' ||
      Boolean(attr?.supportsImage) ||
      name === 'color' ||
      name.includes('colour')
    );
  }

  hasImageCapableAttributes(): boolean {
    return (this.form.value.attributeIds || []).some((id: number) => this.attrSupportsImage(id));
  }

  displayMode(attrId: number | string | null | undefined): string {
    const group = this.form.get('attributeCustomerDisplay') as FormGroup;
    return group.get(String(Number(attrId)))?.value || 'value';
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
    this.onCategoryPathChanged();
  }

  specTabs(): FormConfigTab[] {
    return (this.formConfig()?.tabs || []).filter((tab) => tab.type === 'attribute_group');
  }

  valuesForGroup(groupId: number): FormGroup[] {
    return this.attributeValues.controls.filter(
      (ctrl) => Number(ctrl.get('groupId')?.value) === groupId,
    ) as FormGroup[];
  }

  isChoiceAttribute(ctrl: AbstractControl): boolean {
    const displayType = String(ctrl.get('displayType')?.value || '');
    const options = (ctrl.get('options')?.value || []) as Array<{ id: number }>;
    return (
      options.length > 0 &&
      (displayType === 'dropdown' ||
        displayType === 'radio' ||
        displayType === 'swatch' ||
        displayType === 'image')
    );
  }

  isRichtext(ctrl: AbstractControl): boolean {
    return String(ctrl.get('displayType')?.value || '') === 'richtext';
  }

  isNumberInput(ctrl: AbstractControl): boolean {
    return Boolean(String(ctrl.get('unit')?.value || '').trim()) && !this.isChoiceAttribute(ctrl) && !this.isRichtext(ctrl);
  }

  specStepHint(): string {
    this.formTick();
    for (const ctrl of this.attributeValues.controls) {
      if (!ctrl.get('required')?.value) continue;
      const label = String(ctrl.get('label')?.value || 'Field');
      if (this.isChoiceAttribute(ctrl)) {
        if (!Number(ctrl.get('optionId')?.value)) return `${label} is required.`;
      } else if (this.isRichtext(ctrl)) {
        if (!stripHtml(String(ctrl.get('value')?.value || ''))) return `${label} is required.`;
      } else if (!String(ctrl.get('value')?.value || '').trim()) {
        return `${label} is required.`;
      }
    }
    return '';
  }

  private onCategoryPathChanged(): void {
    const categoryId = this.getDeepestCategoryId();
    if (!categoryId) {
      this.formConfig.set(null);
      this.lastFormConfigCategoryId = null;
      this.attributeValues.clear();
      return;
    }
    this.loadFormConfig(Number(categoryId));
  }

  private loadFormConfig(categoryId: number): void {
    if (this.lastFormConfigCategoryId === categoryId && this.formConfig()) {
      this.applyPendingAttributeValues();
      return;
    }
    const cached = this.formConfigCache.get(categoryId);
    if (cached) {
      this.applyFormConfig(cached, categoryId);
      return;
    }
    this.formConfigLoading.set(true);
    this.options.categoryFormConfig(categoryId).subscribe({
      next: (config) => {
        this.formConfigCache.set(categoryId, config);
        this.applyFormConfig(config, categoryId);
        this.formConfigLoading.set(false);
      },
      error: () => {
        this.formConfigLoading.set(false);
        this.formConfig.set(null);
      },
    });
  }

  private applyFormConfig(config: CategoryFormConfig, categoryId: number): void {
    const previous = new Map(
      this.attributeValues.controls.map((ctrl) => [
        Number(ctrl.get('attributeId')?.value),
        {
          optionId: ctrl.get('optionId')?.value ?? null,
          value: ctrl.get('value')?.value ?? '',
        },
      ]),
    );
    this.lastFormConfigCategoryId = categoryId;
    this.formConfig.set(config);
    this.attributeValues.clear();
    for (const tab of config.tabs || []) {
      if (tab.type !== 'attribute_group') continue;
      for (const group of tab.attributeGroups || []) {
        for (const row of group.categoryAttributes || []) {
          const attribute = row.attribute;
          if (!attribute?.id) continue;
          const existing = previous.get(attribute.id);
          const isChoice =
            (attribute.options || []).length > 0 &&
            ['dropdown', 'radio', 'swatch', 'image'].includes(attribute.displayType);
          this.attributeValues.push(
            this.fb.group({
              categoryAttributeId: [row.id],
              attributeId: [attribute.id],
              tabCode: [tab.code],
              tabLabel: [tab.label],
              groupId: [group.id],
              groupLabel: [group.label],
              label: [attribute.name],
              displayType: [attribute.displayType],
              inputType: [attribute.inputType],
              unit: [attribute.unit ?? ''],
              required: [Boolean(row.required)],
              fullWidth: [Boolean(row.fullWidth)],
              options: [attribute.options ?? []],
              optionId: [
                existing?.optionId ?? '',
                row.required && isChoice ? Validators.required : [],
              ],
              value: [
                existing?.value ?? '',
                row.required && !isChoice ? Validators.required : [],
              ],
            }),
          );
        }
      }
    }
    this.applyPendingAttributeValues();
  }

  private applyPendingAttributeValues(): void {
    if (!this.pendingAttributeValues.length) return;
    this.pendingAttributeValues.forEach((row) => {
      const ctrl = this.attributeValues.controls.find(
        (item) => Number(item.get('attributeId')?.value) === Number(row.attributeId),
      );
      ctrl?.patchValue({
        optionId: row.optionId ?? '',
        value: row.value ?? '',
      });
    });
    this.pendingAttributeValues = [];
  }

  private loadChildLevel(level: number, parentId: number): void {
    this.options.childCategories(parentId).subscribe((opts) => {
      const levels = [...this.childCategoryLevels()];
      levels[level] = opts;
      this.childCategoryLevels.set(levels.slice(0, level + 1));
    });
  }

  private normalizeAttributeIds(ids: Array<number | string> | null | undefined): number[] {
    return [...new Set((ids || []).map(Number).filter((id) => Number.isFinite(id) && id > 0))];
  }

  private attributeInputValue(ctrl: AbstractControl | null | undefined): string {
    const raw = ctrl?.get('value')?.value;
    if (raw === null || raw === undefined) return '';
    return String(raw).trim();
  }

  private variantAttributesFrom(variantCtrl: AbstractControl): Array<{
    attributeId: number;
    value: string;
    code: string;
    image: string;
    viewOption: string;
  }> {
    const arr = variantCtrl.get('variantAttributes') as FormArray | null;
    if (!arr) return [];
    return arr.controls
      .map((ctrl) => ({
        attributeId: Number(ctrl.get('attributeId')?.value),
        value: this.attributeInputValue(ctrl),
        code: String(ctrl.get('code')?.value || '').trim(),
        image: String(ctrl.get('image')?.value || '').trim(),
        viewOption: String(ctrl.get('viewOption')?.value || '').trim(),
      }))
      .filter((row) => row.attributeId && row.value);
  }

  attrLabel(attributeId: number | string | null | undefined): string {
    const id = Number(attributeId);
    return this.attributes().find((opt) => Number(opt.value) === id)?.label || 'Attribute';
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

  private syncAllVariantAttributes(ids: Array<number | string> | null | undefined): void {
    const uniqueIds = this.normalizeAttributeIds(ids);
    this.variants.controls.forEach((variantCtrl) => {
      const arr = variantCtrl.get('variantAttributes') as FormArray;

      for (let index = arr.length - 1; index >= 0; index--) {
        const id = Number(arr.at(index).get('attributeId')?.value);
        if (!uniqueIds.includes(id)) {
          arr.removeAt(index);
        }
      }

      const existingIds = new Set(
        arr.controls.map((ctrl) => Number(ctrl.get('attributeId')?.value)),
      );

      uniqueIds.forEach((attributeId) => {
        if (existingIds.has(attributeId)) return;
        arr.push(
          this.fb.group({
            attributeId: [attributeId],
            value: ['', Validators.required],
            code: [''],
            image: [''],
            viewOption: [''],
          }),
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

  getDeepestCategoryId(): number | '' {
    const children = this.form.value.childCategories || [];
    for (let i = children.length - 1; i >= 0; i--) {
      if (children[i]) return Number(children[i]);
    }
    const root = this.form.value.category;
    return root ? Number(root) : '';
  }

  private patchFromRecord(r: any): void {
    this.slugDirty = true;
    const variantsRaw = Array.isArray(r.variants) && r.variants.length ? r.variants : [{}];
    const fromVariants = variantsRaw.flatMap((v: any) =>
      (v.variantAttributes || []).map((a: any) => Number(a.attributeId ?? a.attribute?.id)),
    );
    const productAttrs = r.productAttributes || r.attributeValues || r.attributes || [];
    this.pendingAttributeValues = productAttrs
      .map((pa: any) => ({
        attributeId: Number(pa.attribute?.id ?? pa.attributeId),
        optionId: pa.optionId ?? pa.option?.id ?? null,
        value: pa.value ?? '',
      }))
      .filter((row: { attributeId: number }) => Number.isFinite(row.attributeId) && row.attributeId > 0);
    const legacyIds = productAttrs
      .filter((pa: any) => !pa.optionId && !pa.option?.id && !String(pa.value || '').trim())
      .map((pa: any) => Number(pa.attribute?.id ?? pa.attributeId));
    const attributeIds = this.normalizeAttributeIds(
      fromVariants.length ? fromVariants : (legacyIds.length ? legacyIds : r.attributeIds),
    );
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
            (c) => Number(c.get('attributeId')?.value) === attrId
          );
          control?.patchValue({
            value: a.value ?? '',
            code: a.code ?? '',
            image: a.image ?? '',
            viewOption: a.viewOption ?? '',
          });
        });
      });
      this.onCategoryPathChanged();
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

  variantStepHint(): string {
    this.formTick();
    if (!this.variants.length) {
      return 'Add at least one variant to continue.';
    }

    for (let i = 0; i < this.variants.length; i++) {
      const variant = this.variants.at(i).getRawValue();
      const label = String(variant.name || '').trim() || `Variant #${i + 1}`;
      const slug = String(variant.slug || '').trim();
      const price = variant.price;
      const stock = variant.stock;

      if (!String(variant.name || '').trim()) {
        return `${label}: name is required.`;
      }
      if (!slug || !SLUG_PATTERN.test(slug)) {
        return `${label}: enter a URL-friendly slug (lowercase letters, numbers, hyphens).`;
      }
      if (price === '' || price === null || price === undefined || Number.isNaN(Number(price)) || Number(price) < 0.01) {
        return `${label}: enter a price greater than 0.`;
      }
      if (stock === '' || stock === null || stock === undefined || Number.isNaN(Number(stock)) || Number(stock) < 0) {
        return `${label}: enter a stock quantity of 0 or more.`;
      }

      for (const ctrl of this.variantAttributes(i).controls) {
        const attributeId = Number(ctrl.get('attributeId')?.value);
        const attrName = this.attrLabel(attributeId);
        if (!this.attributeInputValue(ctrl)) {
          return `${label}: ${attrName} value is required.`;
        }
        if (!this.attrSupportsImage(attributeId)) {
          continue;
        }
        const display = this.displayMode(attributeId);
        if (display === 'code' && !String(ctrl.get('code')?.value || '').trim()) {
          return `${label}: ${attrName} color code is required.`;
        }
        if (display === 'image' && !String(ctrl.get('image')?.value || '').trim()) {
          return `${label}: ${attrName} image is required.`;
        }
      }
    }

    return '';
  }

  goNext(stepper: MatStepper, step: number): void {
    if (this.isStepValid(step)) {
      this.submitError.set('');
      if (stepper.selected) {
        stepper.selected.completed = true;
      }
      stepper.next();
      return;
    }

    if (step === 2) {
      this.attributeValues.controls.forEach((ctrl) => ctrl.markAllAsTouched());
      this.submitError.set(this.specStepHint() || 'Please complete required specification fields.');
      return;
    }

    if (step === 3) {
      this.variants.controls.forEach((ctrl) => ctrl.markAllAsTouched());
      this.submitError.set(this.variantStepHint());
      return;
    }

    this.form.markAllAsTouched();
    this.submitError.set('Please complete all required fields before continuing.');
  }

  isStepValid(step: number): boolean {
    this.formTick();
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
        displayValid &&
        this.form.controls.productName.valid &&
        this.form.controls.productSlug.valid &&
        this.form.controls.shortDescription.valid &&
        this.form.controls.description.valid &&
        this.form.controls.brandId.valid &&
        this.form.controls.category.valid
      );
    }
    if (step === 2) {
      return !this.specStepHint();
    }
    if (step === 3) {
      return !this.variantStepHint();
    }
    if (step === 4) {
      const seo = this.form.get('seo');
      return Boolean(seo?.valid);
    }
    if (step === 5) {
      return this.form.controls.publishStatus.valid;
    }
    return true;
  }

  submit(): void {
    if (!this.isStepValid(1) || !this.isStepValid(2) || !this.isStepValid(3) || !this.isStepValid(4) || !this.isStepValid(5)) {
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
      attributes: (v.attributeIds || []).map((id: number) => ({ attributeId: id })),
      attributeValues: this.attributeValues.controls.map((ctrl) => {
        const row = ctrl.getRawValue();
        const payload: { attributeId: number; optionId?: number; value?: string } = {
          attributeId: Number(row.attributeId),
        };
        const optionId = Number(row.optionId);
        if (Number.isFinite(optionId) && optionId > 0) payload.optionId = optionId;
        const value = this.isRichtext(ctrl) ? String(row.value || '') : String(row.value || '').trim();
        if (value) payload.value = value;
        return payload;
      }),
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
          variantAttributes: this.variantAttributesFrom(ctrl).map((a) => {
            const attributeId = Number(a.attributeId);
            const p: Record<string, unknown> = {
              attributeId,
              value: a.value,
            };
            if (this.attrSupportsImage(attributeId)) {
              const display = displayGroup.get(String(attributeId))?.value || 'value';
              p['viewOption'] = display;
              if (display === 'code') p['code'] = normalizeColorCode(a.code);
              if (display === 'image') p['image'] = String(a.image || '').trim();
            } else {
              if (a.code) p['code'] = String(a.code).trim();
              if (a.image) p['image'] = String(a.image).trim();
              if (a.viewOption) p['viewOption'] = a.viewOption;
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
