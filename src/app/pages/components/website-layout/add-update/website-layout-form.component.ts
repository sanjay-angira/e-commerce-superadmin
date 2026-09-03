import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';
import { FormOptionsService, type SelectOption } from '../../forms/shared/form-options.service';
import { generateSlug, normalizeIds } from '../../forms/shared/form-utils';

const SECTION_TYPES = [
  { label: 'Hero Banner', value: 'hero_banner' },
  { label: 'Newsletter', value: 'news_letter' },
  { label: 'Product Slider', value: 'product_slider' },
  { label: 'Category Slider', value: 'category_slider' },
  { label: 'Blog Section', value: 'blog_section' },
  { label: 'Offer Banner', value: 'offer_section' },
  { label: 'FAQ Section', value: 'faq_section' },
  { label: 'Review Section', value: 'review_section' },
  { label: 'Custom', value: 'custom' },
];

const CUSTOM_SECTIONS = [
  { label: 'Why Choose Vrindavan Rasa', value: 'why_choose' },
  { label: 'Recently Viewed Products', value: 'recently_viewed' },
];

@Component({
  selector: 'app-website-layout-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
  ],
  template: `
    <div class="vr-page">
      <div class="vr-page-header-band">
        <div class="vr-title-card">
          <div class="vr-title-left">
            <h1>{{ isEdit() ? 'Modify' : 'Add' }} section</h1>
            <div class="vr-breadcrumbs">
              <a routerLink="/admin/website-layout">
                <mat-icon style="font-size:16px;width:16px;height:16px">home</mat-icon>
              </a>
              <span class="dot"></span>
              <a routerLink="/admin/website-layout">Website layout</a>
              <span class="dot"></span>
              <span>{{ isEdit() ? 'Modify' : 'Add' }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="vr-page-content vr-form-content">
        <div class="vr-card vr-form-body">
          @if (loading()) {
            <div class="center"><mat-spinner diameter="36"></mat-spinner></div>
          } @else {
            <form [formGroup]="form" (ngSubmit)="submit()" class="vr-form">
              <mat-form-field appearance="outline">
                <mat-label>Section title</mat-label>
                <input matInput formControlName="title" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Slug</mat-label>
                <input matInput formControlName="slug" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Type</mat-label>
                <mat-select formControlName="type">
                  @for (t of types; track t.value) {
                    <mat-option [value]="t.value">{{ t.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              @if (form.value.type === 'custom') {
                <mat-form-field appearance="outline">
                  <mat-label>Custom section</mat-label>
                  <mat-select formControlName="customSection">
                    @for (t of customSections; track t.value) {
                      <mat-option [value]="t.value">{{ t.label }}</mat-option>
                    }
                  </mat-select>
                </mat-form-field>
              }
              @if (form.value.type === 'hero_banner') {
                <mat-form-field appearance="outline">
                  <mat-label>Banner effect</mat-label>
                  <mat-select formControlName="bannerEffect">
                    <mat-option value="fade">Fade</mat-option>
                    <mat-option value="slide">Slide</mat-option>
                  </mat-select>
                </mat-form-field>
              } @else if (form.value.type !== 'custom') {
                <mat-form-field appearance="outline">
                  <mat-label>Display style</mat-label>
                  <mat-select formControlName="displayStyle">
                    <mat-option value="grid">Grid</mat-option>
                    <mat-option value="carousel">Carousel</mat-option>
                    <mat-option value="list">List</mat-option>
                  </mat-select>
                </mat-form-field>
              }
              <mat-form-field appearance="outline">
                <mat-label>Max products</mat-label>
                <input matInput type="number" formControlName="maxProducts" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Eyebrow label</mat-label>
                <input matInput formControlName="subHeading" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Heading</mat-label>
                <input matInput formControlName="heading" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Accent word</mat-label>
                <input matInput formControlName="headingAccent" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Description</mat-label>
                <textarea matInput rows="3" formControlName="description"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full">
                <mat-label>Products</mat-label>
                <mat-select formControlName="productIds" multiple>
                  @for (opt of products(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Categories</mat-label>
                <mat-select formControlName="categoryIds" multiple>
                  @for (opt of categories(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Offers</mat-label>
                <mat-select formControlName="offerIds" multiple>
                  @for (opt of offers(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Blogs</mat-label>
                <mat-select formControlName="blogIds" multiple>
                  @for (opt of blogs(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>FAQs</mat-label>
                <mat-select formControlName="faqIds" multiple>
                  @for (opt of faqs(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Banners</mat-label>
                <mat-select formControlName="bannerIds" multiple>
                  @for (opt of banners(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Reviews</mat-label>
                <mat-select formControlName="reviewIds" multiple>
                  @for (opt of reviews(); track opt.value) {
                    <mat-option [value]="opt.value">{{ opt.label }}</mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-slide-toggle formControlName="status">Active</mat-slide-toggle>

              <div class="actions">
                <button mat-flat-button color="primary" type="submit" [disabled]="saving()">
                  {{ isEdit() ? 'Update section' : 'Create section' }}
                </button>
                <a mat-stroked-button routerLink="/admin/website-layout">Cancel</a>
              </div>
            </form>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .center {
        display: grid;
        place-items: center;
        padding: 32px;
      }
    `,
  ],
})
export class WebsiteLayoutFormComponent {
  private readonly api = inject(ApiService);
  private readonly options = inject(FormOptionsService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly types = SECTION_TYPES;
  readonly customSections = CUSTOM_SECTIONS;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly products = signal<SelectOption[]>([]);
  readonly categories = signal<SelectOption[]>([]);
  readonly offers = signal<SelectOption[]>([]);
  readonly blogs = signal<SelectOption[]>([]);
  readonly faqs = signal<SelectOption[]>([]);
  readonly banners = signal<SelectOption[]>([]);
  readonly reviews = signal<SelectOption[]>([]);
  private id: string | null = null;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    type: ['product_slider', Validators.required],
    customSection: [''],
    status: [true],
    displayStyle: ['grid'],
    bannerEffect: ['fade'],
    maxProducts: [8],
    heading: [''],
    headingAccent: [''],
    subHeading: [''],
    description: [''],
    productIds: [[] as number[]],
    categoryIds: [[] as number[]],
    blogIds: [[] as number[]],
    offerIds: [[] as number[]],
    faqIds: [[] as number[]],
    bannerIds: [[] as number[]],
    reviewIds: [[] as number[]],
    position: [1],
  });

  constructor() {
    forkJoin({
      products: this.options.products(),
      categories: this.options.categories(),
      offers: this.options.offers(),
      blogs: this.options.blogs(),
      faqs: this.options.faqs(),
      banners: this.options.banners(),
      reviews: this.options.reviews(),
    }).subscribe((opts) => {
      this.products.set(opts.products);
      this.categories.set(opts.categories);
      this.offers.set(opts.offers);
      this.blogs.set(opts.blogs);
      this.faqs.set(opts.faqs);
      this.banners.set(opts.banners);
      this.reviews.set(opts.reviews);
    });

    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed()).subscribe((title) => {
      if (!this.isEdit()) {
        this.form.controls.slug.setValue(generateSlug(title), { emitEvent: false });
      }
    });

    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      this.id = params.get('id');
      this.isEdit.set(!!this.id);
      if (!this.id) return;
      this.loading.set(true);
      this.api.get(`/cms-sections/${this.id}`).subscribe({
        next: (res) => {
          const section = res?.data ?? res;
          const data = section?.data ?? {};
          this.form.patchValue({
            title: section?.title || '',
            slug: section?.slug || generateSlug(section?.title || ''),
            type: section?.type || 'product_slider',
            customSection: String(data.customSection ?? data.sectionName ?? ''),
            status: Boolean(section?.status),
            displayStyle: String(data.displayStyle ?? 'grid'),
            bannerEffect: String(data.bannerEffect ?? 'fade') === 'slide' ? 'slide' : 'fade',
            maxProducts: Number(data.maxProducts ?? 8),
            heading: String(data.heading ?? ''),
            headingAccent: String(data.headingAccent ?? ''),
            subHeading: String(data.subHeading ?? ''),
            description: String(data.description ?? ''),
            productIds: normalizeIds(section?.products),
            categoryIds: normalizeIds(section?.categories),
            blogIds: normalizeIds(section?.blogs),
            offerIds: normalizeIds(section?.offers),
            faqIds: normalizeIds(section?.faqs),
            bannerIds: normalizeIds(section?.banners),
            reviewIds: normalizeIds(section?.reviews),
            position: section?.position ?? 1,
          });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      slug: value.slug.trim() || generateSlug(value.title),
      type: value.type,
      position: value.position,
      status: value.status,
      data: {
        displayStyle: value.displayStyle,
        bannerEffect: value.type === 'hero_banner' ? value.bannerEffect : undefined,
        maxProducts: value.maxProducts,
        heading: value.heading,
        headingAccent: value.headingAccent,
        subHeading: value.subHeading,
        description: value.description,
        ...(value.type === 'custom' && value.customSection
          ? { customSection: value.customSection }
          : {}),
      },
      productIds: value.productIds,
      categoryIds: value.categoryIds,
      blogIds: value.blogIds,
      offerIds: value.offerIds,
      faqIds: value.faqIds,
      bannerIds: value.bannerIds,
      reviewIds: value.reviewIds,
    };
    this.saving.set(true);
    const req = this.isEdit()
      ? this.api.put(`/cms-sections/${this.id}`, payload)
      : this.api.post('/cms-sections', payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.snack.open('Saved', 'OK', { duration: 2500 });
        this.router.navigateByUrl('/admin/website-layout');
      },
      error: (err) => {
        this.saving.set(false);
        this.snack.open(err?.error?.message || 'Save failed', 'Dismiss', { duration: 3500 });
      },
    });
  }
}
