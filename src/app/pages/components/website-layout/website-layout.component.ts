import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { ApiService } from '../../../core/services/api.service';
import { ConfirmationDialogComponent } from '../confirmation-dialog/confirmation-dialog.component';
import {
  WebsiteLayoutColumns,
  type AdminTableColumnDefinition,
} from '../../../../static-data/static-common-table-columns';

@Component({
  selector: 'app-website-layout',
  imports: [
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatMenuModule,
    MatTooltipModule,
    MatCheckboxModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './website-layout.component.html',
  styleUrl: './website-layout.component.scss',
})
export class WebsiteLayoutComponent {
  private readonly api = inject(ApiService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly loading = signal(true);
  readonly reordering = signal(false);
  readonly rows = signal<any[]>([]);
  readonly columnOptions: AdminTableColumnDefinition[] = WebsiteLayoutColumns.map((c) => ({
    ...c,
  }));
  displayedColumns: string[] = [];

  constructor() {
    this.syncDisplayedColumns();
    this.load();
  }

  syncDisplayedColumns(): void {
    this.displayedColumns = [
      'drag',
      ...this.columnOptions
        .filter((c) => c.visible)
        .map((c) => (c.datatype === 'button' ? 'actions' : c.property)),
    ];
  }

  load(): void {
    this.loading.set(true);
    this.api
      .get('/cms-sections', { pageNumber: 1, pageSize: 100, column: 'position', order: 'ASC' })
      .subscribe({
        next: (res) => {
          this.rows.set(res?.data?.rows ?? res?.data ?? []);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }

  isActive(row: any): boolean {
    return row?.status === true || row?.status === 'active' || row?.isActive === true;
  }

  toggle(row: any): void {
    this.api.put(`/cms-sections/${row.id}`, { status: !this.isActive(row) }).subscribe({
      next: () => {
        this.snack.open('Updated', 'OK', { duration: 2000 });
        this.load();
      },
    });
  }

  drop(event: CdkDragDrop<any[]>): void {
    if (event.previousIndex === event.currentIndex || this.reordering()) return;

    const list = [...this.rows()];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    const sections = list.map((item, idx) => ({
      ...item,
      position: idx + 1,
    }));
    this.rows.set(sections);
    this.persistOrder(sections);
  }

  private persistOrder(list: any[]): void {
    this.reordering.set(true);
    this.api
      .put('/cms-sections/reorder', {
        sections: list.map((item) => ({ id: item.id, position: item.position })),
      })
      .subscribe({
        next: () => {
          this.reordering.set(false);
          this.snack.open('Section order saved', 'OK', { duration: 1800 });
        },
        error: () => {
          this.reordering.set(false);
          this.snack.open('Reorder failed', 'Dismiss', { duration: 3000 });
          this.load();
        },
      });
  }

  delete(row: any): void {
    const ref = this.dialog.open(ConfirmationDialogComponent, {
      data: {
        title: 'Delete section',
        message: `Delete "${row.title}"?`,
      },
      width: '480px',
      maxWidth: '90vw',
      panelClass: 'vr-dialog',
    });
    ref.afterClosed().subscribe((ok) => {
      if (!ok) return;
      this.api.delete(`/cms-sections/${row.id}`).subscribe({
        next: () => {
          this.snack.open('Deleted', 'OK', { duration: 2000 });
          this.load();
        },
      });
    });
  }
}
