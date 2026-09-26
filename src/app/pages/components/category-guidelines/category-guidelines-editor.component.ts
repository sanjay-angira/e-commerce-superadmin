import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ApiService } from '../../../core/services/api.service';
import { UploadService, UPLOAD_PATHS } from '../../../core/services/upload.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';

export type GuidelineItem = {
  id: number;
  text: string;
  imageUrl: string | null;
  imageAlt: string | null;
  sortOrder: number;
};

type GuidelineKind = 'allowed' | 'not-allowed';

@Component({
  selector: 'app-category-guidelines-editor',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSnackBarModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './category-guidelines-editor.component.html',
  styleUrl: './category-guidelines-editor.component.scss',
})
export class CategoryGuidelinesEditorComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly upload = inject(UploadService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly categoryId = input.required<number>();

  readonly loading = signal(false);
  readonly allowed = signal<GuidelineItem[]>([]);
  readonly notAllowed = signal<GuidelineItem[]>([]);

  newAllowedText = '';
  newNotAllowedText = '';
  readonly uploadPath = UPLOAD_PATHS.guidelines;

  ngOnInit(): void {
    this.reload();
  }

  reload(): void {
    const id = this.categoryId();
    if (!id) return;
    this.loading.set(true);
    this.api.get(`/categories/${id}/guidelines`).subscribe({
      next: (res) => {
        const data = res?.data ?? {};
        this.allowed.set(Array.isArray(data.allowed) ? data.allowed : []);
        this.notAllowed.set(Array.isArray(data.notAllowed) ? data.notAllowed : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.fail(err, 'Failed to load guidelines');
      },
    });
  }

  addItem(kind: GuidelineKind): void {
    const id = this.categoryId();
    const text =
      kind === 'allowed' ? this.newAllowedText.trim() : this.newNotAllowedText.trim();
    if (!id || !text) return;

    this.api.post(`/categories/${id}/guidelines/${kind}`, { text }).subscribe({
      next: () => {
        if (kind === 'allowed') this.newAllowedText = '';
        else this.newNotAllowedText = '';
        this.snack.open('Guideline added', 'OK', { duration: 1800 });
        this.reload();
      },
      error: (err) => this.fail(err, 'Could not add guideline'),
    });
  }

  saveItem(kind: GuidelineKind, item: GuidelineItem): void {
    const text = item.text.trim();
    if (!text) {
      this.snack.open('Text is required', 'Dismiss', { duration: 2500 });
      return;
    }
    this.api
      .patch(`/categories/${this.categoryId()}/guidelines/${kind}/${item.id}`, {
        text,
        imageUrl: item.imageUrl,
        imageAlt: item.imageAlt,
      })
      .subscribe({
        next: () => this.snack.open('Saved', 'OK', { duration: 1500 }),
        error: (err) => this.fail(err, 'Could not save'),
      });
  }

  deleteItem(kind: GuidelineKind, item: GuidelineItem): void {
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete guideline',
          message: `Delete "${item.text}"?`,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api
          .delete(`/categories/${this.categoryId()}/guidelines/${kind}/${item.id}`)
          .subscribe({
            next: () => this.reload(),
            error: (err) => this.fail(err, 'Could not delete'),
          });
      });
  }

  drop(kind: GuidelineKind, event: CdkDragDrop<GuidelineItem[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    const list =
      kind === 'allowed' ? [...this.allowed()] : [...this.notAllowed()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    if (kind === 'allowed') this.allowed.set(list);
    else this.notAllowed.set(list);

    this.api
      .patch(`/categories/${this.categoryId()}/guidelines/${kind}/reorder`, {
        items: list.map((row, index) => ({ id: row.id, sortOrder: index })),
      })
      .subscribe({
        error: () => {
          this.snack.open('Reorder failed', 'Dismiss', { duration: 3000 });
          this.reload();
        },
      });
  }

  onImageSelected(kind: GuidelineKind, item: GuidelineItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.uploadImage(kind, item, file);
  }

  pickImage(kind: GuidelineKind, item: GuidelineItem): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) this.uploadImage(kind, item, file);
    };
    input.click();
  }

  private uploadImage(kind: GuidelineKind, item: GuidelineItem, file: File): void {
    this.upload.upload(file, this.uploadPath, 'category').subscribe({
      next: (res: any) => {
        const url = res?.data?.Location || res?.Location || res?.data?.url || '';
        if (!url) {
          this.snack.open('Upload succeeded but no URL returned', 'Dismiss', {
            duration: 3500,
          });
          return;
        }
        item.imageUrl = url;
        this.api
          .patch(`/categories/${this.categoryId()}/guidelines/${kind}/${item.id}`, {
            imageUrl: url,
          })
          .subscribe({
            next: () => this.snack.open('Image uploaded', 'OK', { duration: 1500 }),
            error: (err) => this.fail(err, 'Could not save image'),
          });
      },
      error: (err) => this.fail(err, 'Upload failed'),
    });
  }

  clearImage(kind: GuidelineKind, item: GuidelineItem): void {
    item.imageUrl = null;
    this.api
      .patch(`/categories/${this.categoryId()}/guidelines/${kind}/${item.id}`, {
        imageUrl: null,
      })
      .subscribe({
        next: () => this.snack.open('Image removed', 'OK', { duration: 1500 }),
        error: (err) => this.fail(err, 'Could not remove image'),
      });
  }

  private fail(err: any, fallback: string): void {
    const raw = err?.error?.message ?? err?.message ?? fallback;
    this.snack.open(Array.isArray(raw) ? raw.join(' ') : String(raw), 'Dismiss', {
      duration: 3500,
    });
  }
}
