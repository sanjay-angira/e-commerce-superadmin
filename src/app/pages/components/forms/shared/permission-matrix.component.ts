import { Component, input, model } from '@angular/core';
import { MatCheckboxChange, MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

export type PermissionMatrixRow = {
  moduleId: number;
  moduleName: string;
  routerLink?: string;
  category?: string | null;
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
};

type PermissionFlag = 'canView' | 'canAdd' | 'canEdit' | 'canDelete';

@Component({
  selector: 'app-permission-matrix',
  imports: [MatCheckboxModule, MatButtonModule],
  templateUrl: './permission-matrix.component.html',
  styleUrl: './permission-matrix.component.scss',
})
export class PermissionMatrixComponent {
  readonly title = input('Permissions');
  readonly readonly = input(false);
  readonly rows = model<PermissionMatrixRow[]>([]);

  toggleAll(flag: PermissionFlag, value: boolean): void {
    if (this.readonly()) return;
    this.rows.update((list) =>
      list.map((row) => ({
        ...row,
        [flag]: value,
      })),
    );
  }

  clearAll(): void {
    if (this.readonly()) return;
    this.rows.update((list) =>
      list.map((row) => ({
        ...row,
        canView: false,
        canAdd: false,
        canEdit: false,
        canDelete: false,
      })),
    );
  }

  setRowAll(row: PermissionMatrixRow, value: boolean): void {
    if (this.readonly()) return;
    this.patchRow(row.moduleId, {
      canView: value,
      canAdd: value,
      canEdit: value,
      canDelete: value,
    });
  }

  onFlagChange(
    row: PermissionMatrixRow,
    flag: PermissionFlag,
    event: MatCheckboxChange,
  ): void {
    if (this.readonly()) return;
    this.patchRow(row.moduleId, { [flag]: event.checked });
  }

  groupedRows(): Array<{ category: string; rows: PermissionMatrixRow[] }> {
    const groups = new Map<string, PermissionMatrixRow[]>();
    for (const row of this.rows()) {
      const category = String(row.category || 'General').trim() || 'General';
      const list = groups.get(category) || [];
      list.push(row);
      groups.set(category, list);
    }
    return [...groups.entries()].map(([category, rows]) => ({ category, rows }));
  }

  private patchRow(
    moduleId: number,
    patch: Partial<Pick<PermissionMatrixRow, PermissionFlag>>,
  ): void {
    this.rows.update((list) =>
      list.map((item) =>
        item.moduleId === moduleId ? { ...item, ...patch } : item,
      ),
    );
  }
}
