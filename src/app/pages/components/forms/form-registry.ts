import type { Type } from '@angular/core';
import { AttributeFormComponent } from './attributes/add-update/add-update.component';
import { BannerFormComponent } from './banner/add-update/add-update.component';
import { BlogCategoryFormComponent } from './blog-category/add-update/add-update.component';
import { BlogFormComponent } from './blog/add-update/add-update.component';
import { BlogTagFormComponent } from './blog-tags/add-update/add-update.component';
import { BrandFormComponent } from './brand/add-update/add-update.component';
import { CategoryFormComponent } from './product-category/add-update/add-update.component';
import { CmsPageFormComponent } from './cms-pages/add-update/add-update.component';
import { CouponFormComponent } from './coupon/add-update/add-update.component';
import { OfferFormComponent } from './offer/add-update/add-update.component';
import { ProductFaqFormComponent } from './product-faq/add-update/add-update.component';
import { ProductFormComponent } from './product/add-update/add-update.component';
import { ReviewFormComponent } from './reviews/add-update/add-update.component';
import { ContactLeadFormComponent } from './contact-us-leads/add-update/add-update.component';
import { UserFormComponent } from './user/add-update/add-update.component';

/** Maps admin module keys → dedicated form components (parity with vr-frontend adminFormRegistry). */
export const ADMIN_FORM_REGISTRY: Record<string, Type<unknown>> = {
  products: ProductFormComponent,
  attributes: AttributeFormComponent,
  banners: BannerFormComponent,
  'blog-categories': BlogCategoryFormComponent,
  'blog-tags': BlogTagFormComponent,
  blogs: BlogFormComponent,
  brands: BrandFormComponent,
  categories: CategoryFormComponent,
  'cms-pages': CmsPageFormComponent,
  coupons: CouponFormComponent,
  offers: OfferFormComponent,
  'product-faq': ProductFaqFormComponent,
  reviews: ReviewFormComponent,
  'product-reviews': ReviewFormComponent,
  users: UserFormComponent,
  admins: UserFormComponent,
  customers: UserFormComponent,
  sellers: UserFormComponent,
  'contact-us-leads': ContactLeadFormComponent,
};

export function getAdminFormComponent(module: string): Type<any> | null {
  return ADMIN_FORM_REGISTRY[module] ?? null;
}

export function hasAdminForm(module: string): boolean {
  return module in ADMIN_FORM_REGISTRY;
}
