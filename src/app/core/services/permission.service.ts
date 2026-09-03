import { Injectable } from '@angular/core';

export type UserPermission = {
  moduleName?: string;
  moduleSlug?: string;
  canView?: boolean;
  canAdd?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
};

@Injectable({ providedIn: 'root' })
export class PermissionService {
  private permissions: UserPermission[] = [];

  setPermissions(permissions: UserPermission[]): void {
    this.permissions = permissions ?? [];
    localStorage.setItem('user_permissions', JSON.stringify(this.permissions));
  }

  loadFromStorage(): void {
    try {
      this.permissions = JSON.parse(localStorage.getItem('user_permissions') || '[]');
    } catch {
      this.permissions = [];
    }
  }

  clearPermissions(): void {
    this.permissions = [];
    localStorage.removeItem('user_permissions');
  }

  /** Superadmin: allow all /admin routes when no matrix, or when permission grants view */
  canAccessUrl(url: string): boolean {
    this.loadFromStorage();
    if (!this.permissions.length) return true;

    const always = ['/admin', '/admin/dashboard', '/admin/profile'];
    if (always.some((p) => url === p || url.startsWith(`${p}/`))) return true;

    const slug = url.replace(/^\/admin\/?/, '').split('/')[0];
    if (!slug) return true;

    const match = this.permissions.find(
      (p) =>
        (p.moduleSlug || '').toLowerCase() === slug.toLowerCase() ||
        (p.moduleName || '').toLowerCase().replace(/\s+/g, '-') === slug.toLowerCase()
    );

    if (!match) return true;
    if (url.includes('/add')) return !!match.canAdd;
    if (url.includes('/modify') || url.includes('/edit')) return !!match.canEdit;
    if (url.includes('/view')) return !!match.canView;
    return !!match.canView;
  }
}
