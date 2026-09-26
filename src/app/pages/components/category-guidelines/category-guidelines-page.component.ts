import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { CategoryGuidelinesEditorComponent } from './category-guidelines-editor.component';

@Component({
  selector: 'app-category-guidelines-page',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CategoryGuidelinesEditorComponent,
  ],
  templateUrl: './category-guidelines-page.component.html',
  styleUrl: './category-guidelines-page.component.scss',
})
export class CategoryGuidelinesPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);

  readonly categoryId = signal<number | null>(null);
  readonly categoryName = signal('');
  readonly breadcrumb = signal('');
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('categoryId');
    const id = raw ? Number(raw) : NaN;
    if (!Number.isFinite(id) || id <= 0) {
      this.loading.set(false);
      this.error.set('Invalid category.');
      return;
    }
    this.categoryId.set(id);
    this.loadCategory(id);
  }

  private loadCategory(id: number): void {
    this.loading.set(true);
    this.error.set('');
    this.api.get(`/categories/${id}`).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        const name = String(data?.categoryName || `Category #${id}`);
        this.categoryName.set(name);
        const parentName = data?.parent?.categoryName;
        this.breadcrumb.set(parentName ? `${parentName} › ${name}` : name);
        this.loading.set(false);
      },
      error: () => {
        this.categoryName.set(`Category #${id}`);
        this.breadcrumb.set(`Category #${id}`);
        this.loading.set(false);
        this.error.set('Could not load category details. You can still manage guidelines.');
      },
    });
  }
}
