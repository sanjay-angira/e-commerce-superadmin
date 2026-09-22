import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

export type SelectOption = {
  label: string;
  value: number | string;
  displayType?: string;
  supportsImage?: boolean;
  raw?: Record<string, unknown>;
};

export type FormConfigAttributeOption = {
  id: number;
  value: string;
  slug?: string;
  hexCode?: string | null;
  swatchImageUrl?: string | null;
  sortOrder?: number;
};

export type FormConfigAttribute = {
  id: number;
  name: string;
  slug?: string;
  displayType: string;
  inputType: string;
  unit?: string | null;
  isActive?: boolean;
  options?: FormConfigAttributeOption[];
};

export type FormConfigCategoryAttribute = {
  id: number;
  sortOrder: number;
  required: boolean;
  fullWidth: boolean;
  attribute: FormConfigAttribute | null;
};

export type FormConfigAttributeGroup = {
  id: number;
  label: string;
  sortOrder: number;
  specTabId?: number;
  categoryAttributes: FormConfigCategoryAttribute[];
};

export type FormConfigTab = {
  id?: number;
  code: string;
  label: string;
  type: 'system' | 'attribute_group';
  sortOrder: number;
  attributeGroups: FormConfigAttributeGroup[];
};

export type CategoryFormConfig = {
  categoryId: number;
  tabs: FormConfigTab[];
};

@Injectable({ providedIn: 'root' })
export class FormOptionsService {
  private readonly api = inject(ApiService);

  private list(
    path: string,
    labelKey: string,
    opts?: { column?: string; order?: string; pageSize?: number }
  ): Observable<SelectOption[]> {
    return this.api
      .get(`/${path}`, {
        pageNumber: 1,
        pageSize: opts?.pageSize ?? 1000,
        column: opts?.column ?? 'id',
        order: opts?.order ?? 'DESC',
      })
      .pipe(
        map((res) => {
          const rows: any[] = res?.data?.rows ?? res?.data ?? [];
          return rows.map((row) => {
            const displayType = String(row.displayType ?? 'text');
            return {
              label: String(row[labelKey] ?? row.name ?? row.title ?? row.id),
              value: Number(row.id),
              displayType,
              supportsImage:
                displayType === 'swatch' ||
                displayType === 'image' ||
                Boolean(row.supportsImage),
              raw: row,
            };
          });
        })
      );
  }

  categories() {
    return this.list('categories', 'categoryName');
  }

  rootCategories() {
    return this.api.get('/categories/next/null').pipe(
      map((res) => {
        const rows: any[] = res?.data ?? res ?? [];
        return (Array.isArray(rows) ? rows : []).map((row) => ({
          label: String(row.categoryName ?? row.name ?? row.id),
          value: Number(row.id),
        }));
      })
    );
  }

  childCategories(parentId: number | string): Observable<SelectOption[]> {
    if (parentId === '' || parentId === null || parentId === undefined) {
      return of<SelectOption[]>([]);
    }
    return this.api.get(`/categories/next/${parentId}`).pipe(
      map((res) => {
        const rows: any[] = res?.data ?? res ?? [];
        return (Array.isArray(rows) ? rows : []).map((row) => ({
          label: String(row.categoryName ?? row.name ?? row.id),
          value: Number(row.id),
        }));
      })
    );
  }

  brands() {
    return this.list('brands', 'name');
  }

  offers() {
    return this.list('offers', 'offerName');
  }

  products() {
    return this.list('products', 'productName');
  }

  attributes() {
    return this.list('attributes', 'name');
  }

  roles() {
    return this.list('roles', 'roleName').pipe(
      map((rows) =>
        rows.filter((row) => String(row.label).trim().toLowerCase() !== 'manager'),
      ),
    );
  }

  blogCategories() {
    return this.list('blog-categories', 'title');
  }

  blogTags() {
    return this.list('blog-tags', 'title');
  }

  productTags() {
    return this.list('product-tags', 'tagName');
  }

  categoryFormConfig(categoryId: number | string) {
    return this.api.get(`/categories/${categoryId}/form-config`).pipe(
      map((res) => (res?.data ?? res) as CategoryFormConfig),
    );
  }

  specTabs() {
    return this.api.get('/spec-tabs').pipe(
      map((res) => {
        const rows: any[] = res?.data?.rows ?? res?.data ?? [];
        return Array.isArray(rows) ? rows : [];
      }),
    );
  }

  attributeGroups(categoryId: number, specTabId?: number) {
    return this.api
      .get(`/categories/${categoryId}/attribute-groups`, {
        ...(specTabId ? { specTabId } : {}),
      })
      .pipe(
        map((res) => {
          const rows: any[] = res?.data?.rows ?? res?.data ?? [];
          return Array.isArray(rows) ? rows : [];
        }),
      );
  }

  users(orderBy = 'firstName') {
    return this.api
      .get('/users', {
        pageNumber: 1,
        pageSize: 1000,
        column: orderBy,
        order: 'ASC',
      })
      .pipe(
        map((res) => {
          const rows: any[] = res?.data?.rows ?? res?.data ?? [];
          return rows.map((row) => {
            const name = `${row.firstName || ''} ${row.lastName || ''}`.trim();
            return {
              label: name ? `${name} (${row.email || ''})` : String(row.email || row.id),
              value: Number(row.id),
              raw: row,
            };
          });
        })
      );
  }

  blogs() {
    return this.list('blogs', 'title');
  }

  banners() {
    return this.list('banners', 'title');
  }

  faqs() {
    return this.list('faqs', 'question');
  }

  reviews() {
    return this.list('reviews', 'comment');
  }

  createProductTag(name: string) {
    const tagName = name.trim();
    const tagSlug = tagName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
    return this.api.post('/product-tags', { tagName, tagSlug, isActive: true });
  }
}
