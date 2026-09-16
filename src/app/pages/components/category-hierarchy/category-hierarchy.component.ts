import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../../core/services/api.service';

export type CategoryTreeNode = {
  id: number;
  categoryName: string;
  categorySlug?: string | null;
  isActive?: boolean;
  children: CategoryTreeNode[];
};

@Component({
  selector: 'app-category-hierarchy',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './category-hierarchy.component.html',
  styleUrl: './category-hierarchy.component.scss',
})
export class CategoryHierarchyComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly loading = signal(true);
  readonly error = signal('');
  readonly tree = signal<CategoryTreeNode[]>([]);
  readonly selectedPath = signal<CategoryTreeNode[]>([]);

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(200), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe(() => this.onSearch());

    this.load();
  }

  visibleTree(): CategoryTreeNode[] {
    return this.filterTree(this.tree(), this.searchControl.value);
  }

  columns(): CategoryTreeNode[][] {
    const cols: CategoryTreeNode[][] = [this.visibleTree()];
    for (const node of this.selectedPath()) {
      cols.push(node.children || []);
    }
    return cols;
  }

  selectedIdAt(level: number): number | null {
    return this.selectedPath()[level]?.id ?? null;
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get('/categories/tree').subscribe({
      next: (res) => {
        const rows = Array.isArray(res?.data) ? res.data : [];
        this.tree.set(rows as CategoryTreeNode[]);
        this.selectedPath.set([]);
        this.loading.set(false);
      },
      error: () => {
        this.tree.set([]);
        this.error.set('Failed to load category hierarchy.');
        this.loading.set(false);
      },
    });
  }

  select(node: CategoryTreeNode, level: number): void {
    this.selectedPath.set([...this.selectedPath().slice(0, level), node]);
  }

  openEdit(node: CategoryTreeNode, event?: Event): void {
    event?.stopPropagation();
    this.router.navigateByUrl(`/admin/categories/edit/${node.id}`);
  }

  private onSearch(): void {
    const visible = this.visibleTree();
    const query = this.searchControl.value.trim();
    if (!query) {
      this.selectedPath.set([]);
      return;
    }
    const path = this.firstMatchPath(visible);
    this.selectedPath.set(path.slice(0, Math.max(path.length - 1, 0)));
  }

  private firstMatchPath(
    nodes: CategoryTreeNode[],
    trail: CategoryTreeNode[] = [],
  ): CategoryTreeNode[] {
    const needle = this.searchControl.value.trim().toLowerCase();
    for (const node of nodes) {
      const next = [...trail, node];
      if (String(node.categoryName || '').toLowerCase().includes(needle)) {
        return next;
      }
      const found = this.firstMatchPath(node.children || [], next);
      if (found.length) return found;
    }
    return [];
  }

  private filterTree(nodes: CategoryTreeNode[], query: string): CategoryTreeNode[] {
    const needle = query.trim().toLowerCase();
    if (!needle) return nodes;
    const matches: CategoryTreeNode[] = [];
    for (const node of nodes) {
      const nameHit = String(node.categoryName || '').toLowerCase().includes(needle);
      const children = this.filterTree(node.children || [], query);
      if (nameHit || children.length) {
        matches.push({
          ...node,
          children: nameHit ? node.children || [] : children,
        });
      }
    }
    return matches;
  }
}
