import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

function unwrapList(res: any): any[] {
  const data = res?.data ?? res;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.rows)) return data.rows;
  return [];
}

@Component({
  selector: 'app-footer-settings',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatSnackBarModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
  ],
  templateUrl: './footer-settings.component.html',
  styleUrl: './footer-settings.component.scss',
})
export class FooterSettingsComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly sections = signal<any[]>([]);
  readonly items = signal<any[]>([]);
  readonly dialogKind = signal<'section' | 'item' | null>(null);
  readonly dialogSaving = signal(false);

  sectionForm: any = this.emptySection();
  linkForm: any = this.emptyLink();

  constructor() {
    this.reload();
  }

  menuSection() {
    return this.sections().find((s) => s.type === 'menu' || !s.type);
  }

  emptySection() {
    return { id: null as number | null, title: '', type: 'menu', position: 1, status: true };
  }

  emptyLink() {
    return {
      id: null as number | null,
      label: '',
      url: '',
      position: 1,
      sectionId: null as number | null,
      status: true,
    };
  }

  reload(): void {
    this.loading.set(true);
    forkJoin({
      sections: this.api.get('/admin/footer-sections'),
      items: this.api.get('/footer-items'),
    }).subscribe({
      next: ({ sections, items }) => {
        this.sections.set(
          unwrapList(sections).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
        );
        this.items.set(unwrapList(items));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  dialogTitle(): string {
    const kind = this.dialogKind();
    const isEdit = kind === 'section' ? Boolean(this.sectionForm.id) : Boolean(this.linkForm.id);
    const prefix = isEdit ? 'Edit' : 'Add';
    if (kind === 'section') return `${prefix} footer section`;
    if (kind === 'item') return `${prefix} footer item`;
    return '';
  }

  dialogSubtitle(): string {
    const kind = this.dialogKind();
    if (kind === 'section') return 'Create or update a footer column';
    if (kind === 'item') return 'Create or update a footer menu item';
    return '';
  }

  closeDialog(): void {
    this.dialogKind.set(null);
  }

  openSection(section?: any): void {
    this.sectionForm = section
      ? { ...section }
      : { ...this.emptySection(), position: this.sections().length + 1 };
    this.dialogKind.set('section');
  }

  saveSection(): void {
    if (!this.sectionForm.title?.trim()) return;
    this.dialogSaving.set(true);
    const payload = {
      title: this.sectionForm.title,
      type: 'menu',
      position: this.sectionForm.position ?? this.sections().length + 1,
      status: this.sectionForm.status,
    };
    const req = this.sectionForm.id
      ? this.api.put(`/admin/footer-sections/${this.sectionForm.id}`, payload)
      : this.api.post('/admin/footer-sections', payload);
    req.subscribe({
      next: () => {
        this.dialogSaving.set(false);
        this.dialogKind.set(null);
        this.reload();
      },
      error: (err) => {
        this.dialogSaving.set(false);
        this.snack.open(err?.error?.message || 'Save failed', 'Dismiss', { duration: 3500 });
      },
    });
  }

  moveSection(index: number, direction: -1 | 1): void {
    const target = index + direction;
    const list = [...this.sections()];
    if (target < 0 || target >= list.length) return;
    const [moved] = list.splice(index, 1);
    list.splice(target, 0, moved);
    const reordered = list.map((section, idx) => ({ ...section, position: idx + 1 }));
    this.sections.set(reordered);
    forkJoin(
      reordered.map((section) =>
        this.api.put(`/admin/footer-sections/${section.id}`, { position: section.position }),
      ),
    ).subscribe({
      error: () => {
        this.snack.open('Failed to update section order', 'Dismiss', { duration: 3000 });
        this.reload();
      },
    });
  }

  toggleSection(section: any, status: boolean): void {
    this.api.put(`/admin/footer-sections/${section.id}`, { status }).subscribe({
      next: () => this.reload(),
    });
  }

  deleteSection(section: any): void {
    this.confirm(`Delete section "${section.title}"?`, () => {
      this.api.delete(`/admin/footer-sections/${section.id}`).subscribe({
        next: () => this.reload(),
      });
    });
  }

  openItem(row?: any): void {
    this.linkForm = row
      ? {
          id: row.id,
          label: row.label,
          url: row.url || '',
          position: row.position ?? 1,
          sectionId: row.sectionId ?? row.section?.id ?? this.menuSection()?.id ?? null,
          status: Boolean(row.status),
        }
      : { ...this.emptyLink(), sectionId: this.menuSection()?.id ?? null };
    this.dialogKind.set('item');
  }

  saveItem(): void {
    if (!this.linkForm.label?.trim() || !this.linkForm.sectionId) return;
    this.dialogSaving.set(true);
    const payload = {
      label: this.linkForm.label,
      url: this.linkForm.url,
      position: this.linkForm.position || 1,
      sectionId: Number(this.linkForm.sectionId),
      status: this.linkForm.status,
    };
    const req = this.linkForm.id
      ? this.api.put(`/footer-items/${this.linkForm.id}`, payload)
      : this.api.post('/footer-items', payload);
    req.subscribe({
      next: () => {
        this.dialogSaving.set(false);
        this.dialogKind.set(null);
        this.reload();
      },
      error: (err) => {
        this.dialogSaving.set(false);
        this.snack.open(err?.error?.message || 'Save failed', 'Dismiss', { duration: 3500 });
      },
    });
  }

  toggleItem(row: any, status: boolean): void {
    this.api.put(`/footer-items/${row.id}`, { status }).subscribe({ next: () => this.reload() });
  }

  deleteItem(row: any): void {
    this.confirm(`Delete "${row.label}"?`, () => {
      this.api.delete(`/footer-items/${row.id}`).subscribe({ next: () => this.reload() });
    });
  }

  private confirm(message: string, onOk: () => void): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: { title: 'Confirm', message },
        width: '480px',
        maxWidth: '90vw',
        panelClass: 'vr-dialog',
      })
      .afterClosed()
      .subscribe((ok) => {
        if (ok) onOk();
      });
  }
}
