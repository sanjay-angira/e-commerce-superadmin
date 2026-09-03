import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export type AdminNavModule = {
  id?: number;
  name?: string;
  router_link?: string;
  icon?: string;
  order?: number;
  categories?: string | null;
  categoryOrderNo?: number;
  category_icon?: string;
  isActive?: boolean;
};

export type ModuleApiResponse = {
  success?: boolean;
  status?: boolean;
  data?: { rows?: AdminNavModule[]; count?: number } | null;
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class ModuleService {
  private readonly api = inject(ApiService);

  getAllModules(params: Record<string, string | number | boolean> = {}): Observable<ModuleApiResponse> {
    return this.api.get('/modules', params);
  }

  addModule(payload: Partial<AdminNavModule>): Observable<ModuleApiResponse> {
    return this.api.post('/modules', payload);
  }

  updateModule(moduleId: number, payload: Partial<AdminNavModule>): Observable<ModuleApiResponse> {
    return this.api.put(`/modules/${moduleId}`, payload);
  }

  deleteModule(moduleId: number): Observable<ModuleApiResponse> {
    return this.api.delete(`/modules/${moduleId}`);
  }

  updateModuleOrder(payload: { modules: { id: number; order: number; category: string | null }[] }): Observable<ModuleApiResponse> {
    return this.api.put('/modules/update-modules-order', payload);
  }

  updateModuleCategory(moduleId: number, category: string): Observable<ModuleApiResponse> {
    return this.api.put(`/modules/${moduleId}/updateCategory`, { category });
  }

  updateCategoryOrder(payload: { categories: { category: string | null; order: number }[] }): Observable<ModuleApiResponse> {
    return this.api.put('/modules/update-modules-category-order', payload);
  }

  deleteCategory(category: string): Observable<ModuleApiResponse> {
    return this.api.delete(`/modules/delete-modules-category?category=${encodeURIComponent(category)}`);
  }

  updateCategoryName(payload: {
    oldCategory: string | null;
    newCategory: string;
    categoryIcon?: string;
  }): Observable<ModuleApiResponse> {
    const body: Record<string, string> = {
      oldCategory: payload.oldCategory || '',
      newCategory: payload.newCategory,
    };
    if (payload.categoryIcon !== undefined) {
      body['category_icon'] = payload.categoryIcon;
    }
    return this.api.put('/modules/update-modules-category-name', body);
  }
}
