import { Injectable, inject, signal } from '@angular/core';
import { AdminMenuItem, AdminMenuSection } from '../../../static-data/admin-menu';
import { AdminNavModule, ModuleService } from './module.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly modules = inject(ModuleService);

  readonly sections = signal<AdminMenuSection[]>([]);
  readonly loading = signal(false);
  readonly searchActive = signal(false);

  load(search?: string): void {
    this.loading.set(true);
    const params: Record<string, string> = {};
    const query = (search || '').trim();
    if (query) {
      params['search'] = query;
    }

    this.modules.getAllModules(params).subscribe({
      next: (res) => {
        const rows = Array.isArray(res?.data?.rows) ? res.data.rows : [];
        this.sections.set(this.buildSections(rows));
        this.loading.set(false);
      },
      error: () => {
        this.sections.set([]);
        this.loading.set(false);
      },
    });
  }

  clear(): void {
    this.sections.set([]);
    this.searchActive.set(false);
  }

  /**
   * Same grouping as vr-admin LoginService.createNavigationItems:
   * sort by categoryOrderNo → module.order → id, then nest links under categories.
   */
  private buildSections(modules: AdminNavModule[]): AdminMenuSection[] {
    const sorted = [...modules].sort((a, b) => {
      const categoryOrderA = a.categoryOrderNo ?? 9999;
      const categoryOrderB = b.categoryOrderNo ?? 9999;
      if (categoryOrderA !== categoryOrderB) {
        return categoryOrderA - categoryOrderB;
      }
      const orderA = a.order ?? 0;
      const orderB = b.order ?? 0;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return (a.id ?? 0) - (b.id ?? 0);
    });

    const sections: AdminMenuSection[] = [];
    const existingLabels = new Map<string, number>();

    for (const element of sorted) {
      if (!element.categories) {
        continue;
      }

      const item: AdminMenuItem = {
        label: element.name || 'Untitled',
        href: this.normalizeNavigationRoute(element.router_link),
        icon: this.toMaterialIcon(element.icon),
      };

      const existingIndex = existingLabels.get(element.categories);
      if (existingIndex !== undefined) {
        sections[existingIndex].items.push(item);
        continue;
      }

      sections.push({
        title: element.categories,
        icon: this.toMaterialIcon(element.category_icon || element.icon),
        items: [item],
      });
      existingLabels.set(element.categories, sections.length - 1);
    }

    return sections;
  }

  private normalizeNavigationRoute(route?: string): string {
    const trimmedRoute = (route || '').trim();
    if (!trimmedRoute) {
      return '/admin/dashboard';
    }

    const cleanedRoute = trimmedRoute.split('?')[0].split('#')[0];
    let normalized: string;
    if (cleanedRoute === '/admin' || cleanedRoute.startsWith('/admin/')) {
      normalized = cleanedRoute;
    } else if (cleanedRoute === 'admin' || cleanedRoute.startsWith('admin/')) {
      normalized = `/${cleanedRoute}`;
    } else if (cleanedRoute.startsWith('/')) {
      normalized = `/admin${cleanedRoute}`;
    } else {
      normalized = `/admin/${cleanedRoute}`;
    }

    return this.ROUTE_ALIASES[normalized] || normalized;
  }

  /**
   * vr-admin module rows use older slugs; superadmin CRUD keys differ for a few modules.
   */
  private readonly ROUTE_ALIASES: Record<string, string> = {
    '/admin/product-categories': '/admin/categories',
    '/admin/offers-deals': '/admin/offers',
    '/admin/banner': '/admin/banners',
    '/admin/blog-posts': '/admin/blogs',
    '/admin/product-faqs': '/admin/product-faq',
    '/admin/delete-request': '/admin/delete-requests',
  };

  /** DB stores VEX svg keys like `mat:dashboard`; superadmin uses Material font icons. */
  toMaterialIcon(icon?: string | null): string {
    const raw = (icon || '').trim();
    if (!raw) {
      return 'folder';
    }
    const withoutNs = raw.replace(/^(mat|icon):/i, '').trim();
    const ligature = withoutNs.replace(/-/g, '_');
    return ligature || 'folder';
  }
}
