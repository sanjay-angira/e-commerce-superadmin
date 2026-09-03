import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { ApiService } from '../../../../core/services/api.service';

export type SelectOption = {
  label: string;
  value: number | string;
  supportsImage?: boolean;
  raw?: Record<string, unknown>;
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
          return rows.map((row) => ({
            label: String(row[labelKey] ?? row.name ?? row.title ?? row.id),
            value: Number(row.id),
            supportsImage: Boolean(row.supportsImage),
            raw: row,
          }));
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
    return this.list('brands', 'brandName');
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
    return this.list('roles', 'roleName');
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
