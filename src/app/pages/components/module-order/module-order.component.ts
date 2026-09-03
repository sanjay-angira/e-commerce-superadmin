import { Component, inject, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { RouterLink } from '@angular/router';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AdminNavModule, ModuleService } from '../../../core/services/module.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import { AddModuleDialogComponent } from './add-module-dialog.component';
import { EditCategoryDialogComponent } from './edit-category-dialog.component';

export type CategoryGroup = {
  category: string | null;
  categoryIcon?: string | null;
  modules: AdminNavModule[];
  id: string;
  order?: number;
  categoryOrderNo?: number;
};

@Component({
  selector: 'app-module-order',
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
  ],
  templateUrl: './module-order.component.html',
  styleUrl: './module-order.component.scss',
})
export class ModuleOrderComponent implements OnInit {
  private readonly moduleService = inject(ModuleService);
  private readonly navigation = inject(NavigationService);
  private readonly snackbar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly isLoading = signal(true);
  readonly categories = signal<CategoryGroup[]>([]);
  readonly uncategorizedModules = signal<AdminNavModule[]>([]);
  readonly uncategorizedId = 'uncategorized';
  readonly expandedIds = signal<Set<string>>(new Set());

  ngOnInit(): void {
    this.loadModules();
  }

  loadModules(refreshNav = false): void {
    this.isLoading.set(true);
    this.moduleService
      .getAllModules()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          const rows = res?.data?.rows;
          if (this.isSuccess(res) && Array.isArray(rows)) {
            this.organizeModulesByCategory(rows);
          } else {
            this.categories.set([]);
            this.uncategorizedModules.set([]);
            this.snackbar.open(res?.message || 'Failed to load modules', 'Dismiss', { duration: 3000 });
          }
          if (refreshNav) {
            this.navigation.load();
          }
        },
        error: () => {
          this.snackbar.open('Failed to load modules', 'Dismiss', { duration: 3000 });
        },
      });
  }

  organizeModulesByCategory(modules: AdminNavModule[]): void {
    const categorized = modules.filter((m) => {
      const value = typeof m.categories === 'string' ? m.categories.trim() : '';
      return value !== '';
    });
    const uncategorized = modules.filter((m) => {
      const value = typeof m.categories === 'string' ? m.categories.trim() : '';
      return value === '';
    });

    const categoryMap = new Map<string, AdminNavModule[]>();
    categorized.forEach((module) => {
      const category = String(module.categories);
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(module);
    });

    categoryMap.forEach((group) => {
      group.sort((a, b) => (a.order || 0) - (b.order || 0));
    });

    const categoryArray = Array.from(categoryMap.entries()).map(([category, group]) => {
      const categOrderNo = group[0]?.categoryOrderNo || 9999;
      const categoryIcon = group.find((m) => m.category_icon)?.category_icon ?? null;
      return {
        category,
        categoryIcon: categoryIcon || undefined,
        modules: group,
        id: `category-${category}`,
        order: categOrderNo,
        categoryOrderNo: categOrderNo,
      };
    });

    categoryArray.sort((a, b) => (a.categoryOrderNo || 9999) - (b.categoryOrderNo || 9999));
    this.categories.set(categoryArray);

    if (this.expandedIds().size === 0) {
      this.expandedIds.set(new Set(categoryArray.map((cat) => cat.id)));
    }

    this.uncategorizedModules.set(uncategorized.sort((a, b) => (a.order || 0) - (b.order || 0)));
  }

  getAllCategoryIds(): string[] {
    return [...this.categories().map((c) => c.id), this.uncategorizedId];
  }

  onModuleDrop(event: CdkDragDrop<AdminNavModule[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.syncListsAfterDrop();
      this.updateOrderForCategory(event.container.id, event.container.data);
      return;
    }

    transferArrayItem(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex
    );
    this.syncListsAfterDrop();

    const currentCategory = this.getCategoryById(event.container.id);
    const module = event.item.data as AdminNavModule;
    this.updateModuleCategory(module.id!, currentCategory?.category || null, event.container.data);
  }

  getCategoryById(id: string): CategoryGroup | null {
    if (id === this.uncategorizedId) {
      return { category: null, modules: this.uncategorizedModules(), id: this.uncategorizedId };
    }
    return this.categories().find((c) => c.id === id) || null;
  }

  private syncListsAfterDrop(): void {
    this.categories.set(this.categories().map((c) => ({ ...c, modules: [...c.modules] })));
    this.uncategorizedModules.set([...this.uncategorizedModules()]);
  }

  updateOrderForCategory(categoryId: string, modules: AdminNavModule[]): void {
    const category = this.getCategoryById(categoryId);
    if (!category) return;

    const updates = modules.map((module, index) => ({
      id: module.id!,
      order: index + 1,
      category: category.category,
    }));

    this.moduleService.updateModuleOrder({ modules: updates }).subscribe({
      next: (res) => {
        if (this.isSuccess(res)) {
          modules.forEach((module, index) => {
            module.order = index + 1;
            module.categories = category.category;
          });
          this.snackbar.open('Module order updated successfully', 'Dismiss', { duration: 3000 });
          this.navigation.load();
        } else {
          this.snackbar.open(res?.message || 'Failed to update order', 'Dismiss', { duration: 3000 });
          this.loadModules();
        }
      },
      error: () => {
        this.snackbar.open('Failed to update module order', 'Dismiss', { duration: 3000 });
        this.loadModules();
      },
    });
  }

  updateModuleCategory(moduleId: number, newCategory: string | null, modules: AdminNavModule[]): void {
    this.moduleService.updateModuleCategory(moduleId, newCategory || '').subscribe({
      next: (res) => {
        if (this.isSuccess(res)) {
          const module = modules.find((m) => m.id === moduleId);
          if (module) {
            module.categories = newCategory || '';
          }
          const targetCategoryId = newCategory
            ? this.categories().find((c) => c.category === newCategory)?.id || this.uncategorizedId
            : this.uncategorizedId;
          this.updateOrderForCategory(targetCategoryId, modules);
          this.snackbar.open('Module category updated successfully', 'Dismiss', { duration: 3000 });
        } else {
          this.snackbar.open(res?.message || 'Failed to update category', 'Dismiss', { duration: 3000 });
          this.loadModules();
        }
      },
      error: () => {
        this.snackbar.open('Failed to update module category', 'Dismiss', { duration: 3000 });
        this.loadModules();
      },
    });
  }

  onCategoryDrop(event: CdkDragDrop<CategoryGroup[]>): void {
    const next = [...this.categories()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.categories.set(next);
    this.updateCategoryOrder();
  }

  updateCategoryOrder(): void {
    const categoryOrders = this.categories().map((category, index) => ({
      category: category.category,
      order: index + 1,
    }));

    this.moduleService.updateCategoryOrder({ categories: categoryOrders }).subscribe({
      next: (res) => {
        if (this.isSuccess(res)) {
          this.categories.update((cats) =>
            cats.map((category, index) => ({
              ...category,
              order: index + 1,
              categoryOrderNo: index + 1,
              modules: category.modules.map((module) => ({
                ...module,
                categoryOrderNo: index + 1,
              })),
            }))
          );
          this.snackbar.open('Category order updated successfully', 'Dismiss', { duration: 3000 });
          this.navigation.load();
        } else {
          this.snackbar.open(res?.message || 'Failed to update category order', 'Dismiss', { duration: 3000 });
          this.loadModules();
        }
      },
      error: () => {
        this.snackbar.open('Failed to update category order', 'Dismiss', { duration: 3000 });
        this.loadModules();
      },
    });
  }

  openAddModuleDialog(category?: string | null): void {
    const existingCategories = this.categories().map((c) => c.category);
    const selectedCategory = category ? this.categories().find((c) => c.category === category) : null;
    this.dialog
      .open(AddModuleDialogComponent, {
        data: {
          categories: existingCategories,
          category: category || '',
          order: category
            ? (selectedCategory?.modules.length || 0) + 1
            : this.uncategorizedModules().length + 1,
          categoryOrderNo: selectedCategory?.categoryOrderNo || null,
        },
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        panelClass: 'vr-dialog',
        autoFocus: 'first-tabbable',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.module) {
          this.addOrUpdateModule(result.module, result.isEdit, result.moduleId);
        }
      });
  }

  editModule(module: AdminNavModule): void {
    this.dialog
      .open(AddModuleDialogComponent, {
        data: {
          module,
          categories: this.categories().map((c) => c.category),
          category: module.categories || '',
          order: module.order || 1,
          categoryOrderNo: module.categoryOrderNo || null,
        },
        width: '600px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        panelClass: 'vr-dialog',
        autoFocus: 'first-tabbable',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result?.module) {
          this.addOrUpdateModule(result.module, true, module.id);
        }
      });
  }

  addOrUpdateModule(moduleData: AdminNavModule, isEdit = false, moduleId?: number): void {
    if (isEdit && moduleId) {
      this.moduleService
        .updateModule(moduleId, {
          name: moduleData.name,
          icon: moduleData.icon,
          router_link: moduleData.router_link,
          categories: moduleData.categories,
          order: moduleData.order,
          categoryOrderNo: moduleData.categoryOrderNo,
        })
        .subscribe({
          next: (res) => {
            if (this.isSuccess(res)) {
              this.loadModules(true);
              this.snackbar.open('Module updated successfully', 'Dismiss', { duration: 3000 });
            } else {
              this.snackbar.open(res?.message || 'Failed to update module', 'Dismiss', { duration: 3000 });
            }
          },
          error: () => this.snackbar.open('Failed to update module', 'Dismiss', { duration: 3000 }),
        });
      return;
    }

    this.moduleService.addModule(moduleData).subscribe({
      next: (res) => {
        if (this.isSuccess(res)) {
          this.loadModules(true);
          this.snackbar.open('Module added successfully', 'Dismiss', { duration: 3000 });
        } else {
          this.snackbar.open(res?.message || 'Failed to add module', 'Dismiss', { duration: 3000 });
        }
      },
      error: () => this.snackbar.open('Failed to add module', 'Dismiss', { duration: 3000 }),
    });
  }

  deleteModule(module: AdminNavModule): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete module',
          message: `Delete "${module.name || 'this module'}"? This removes it from the sidebar.`,
        },
        width: '480px',
        maxWidth: '90vw',
        panelClass: 'vr-dialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || !module.id) return;
        this.moduleService.deleteModule(module.id).subscribe({
          next: (res) => {
            if (this.isSuccess(res)) {
              this.loadModules(true);
              this.snackbar.open('Module deleted successfully', 'Dismiss', { duration: 3000 });
            } else {
              this.snackbar.open(res?.message || 'Failed to delete module', 'Dismiss', { duration: 3000 });
            }
          },
          error: () => this.snackbar.open('Failed to delete module', 'Dismiss', { duration: 3000 }),
        });
      });
  }

  editCategory(category: CategoryGroup): void {
    this.dialog
      .open(EditCategoryDialogComponent, {
        data: {
          categoryName: category.category,
          categoryIcon: category.categoryIcon ?? '',
          existingCategories: this.categories()
            .map((c) => c.category)
            .filter((c): c is string => !!c && c !== category.category),
        },
        width: '500px',
        maxWidth: '90vw',
        maxHeight: '90vh',
        panelClass: 'vr-dialog',
        autoFocus: 'first-tabbable',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (!result?.categoryName?.trim()) return;
        const newName = result.categoryName.trim();
        const newIcon =
          result.categoryIcon != null ? String(result.categoryIcon).trim() : (category.categoryIcon ?? '');
        const nameChanged = newName !== category.category;
        const iconChanged = newIcon !== (category.categoryIcon ?? '');
        if (!nameChanged && !iconChanged) return;

        this.moduleService
          .updateCategoryName({
            oldCategory: category.category,
            newCategory: newName,
            categoryIcon: newIcon || 'mat:folder',
          })
          .subscribe({
            next: (res) => {
              if (this.isSuccess(res)) {
                this.loadModules(true);
                this.snackbar.open('Category updated successfully', 'Dismiss', { duration: 3000 });
              } else {
                this.snackbar.open(res?.message || 'Failed to update category', 'Dismiss', { duration: 3000 });
              }
            },
            error: (err) =>
              this.snackbar.open(err?.error?.message || 'Failed to update category', 'Dismiss', { duration: 3000 }),
          });
      });
  }

  deleteCategory(category: CategoryGroup): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete category',
          message: `Delete category "${category.category}"? Modules in this category will become uncategorized.`,
        },
        width: '480px',
        maxWidth: '90vw',
        panelClass: 'vr-dialog',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed || !category.category) return;
        this.moduleService.deleteCategory(category.category).subscribe({
          next: (res) => {
            if (this.isSuccess(res)) {
              this.loadModules(true);
              this.snackbar.open('Category deleted successfully', 'Dismiss', { duration: 3000 });
            } else {
              this.snackbar.open(res?.message || 'Failed to delete category', 'Dismiss', { duration: 3000 });
            }
          },
          error: () => this.snackbar.open('Failed to delete category', 'Dismiss', { duration: 3000 }),
        });
      });
  }

  isCategoryExpanded(categoryId: string): boolean {
    return this.expandedIds().has(categoryId);
  }

  onPanelOpened(categoryId: string): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      next.add(categoryId);
      return next;
    });
  }

  onPanelClosed(categoryId: string): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      next.delete(categoryId);
      return next;
    });
  }

  expandAllCategories(): void {
    this.expandedIds.set(new Set(this.categories().map((cat) => cat.id)));
  }

  collapseAllCategories(): void {
    this.expandedIds.set(new Set());
  }

  getTotalModulesCount(): number {
    return (
      this.categories().reduce((sum, cat) => sum + cat.modules.length, 0) +
      this.uncategorizedModules().length
    );
  }

  getTotalCategoriesCount(): number {
    return this.categories().length;
  }

  iconName(icon?: string | null): string {
    const raw = (icon || '').trim();
    if (!raw) return 'folder';
    return raw.replace(/^mat:/i, '') || 'folder';
  }

  private isSuccess(res: { success?: boolean; status?: boolean } | null | undefined): boolean {
    return (res?.status ?? res?.success) === true;
  }
}
