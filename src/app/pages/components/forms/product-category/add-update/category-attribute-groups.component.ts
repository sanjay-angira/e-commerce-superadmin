import { Component, OnChanges, OnInit, SimpleChanges, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../../../core/services/api.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { ConfirmationDialogComponent } from '../../../confirmation-dialog/confirmation-dialog.component';

type GroupRow = {
  id: number;
  label: string;
  sortOrder: number;
  specTabId: number;
  categoryAttributes: Array<{
    id: number;
    sortOrder: number;
    required: boolean;
    fullWidth: boolean;
    attribute?: { id: number; name: string } | null;
  }>;
};

type TabRow = {
  id: number;
  code: string;
  label: string;
  type: string;
  groups: GroupRow[];
  newLabel: string;
  renaming: boolean;
  editingLabel: string;
};

@Component({
  selector: 'app-category-attribute-groups',
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatSnackBarModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './category-attribute-groups.component.html',
  styleUrl: './category-attribute-groups.component.scss',
})
export class CategoryAttributeGroupsComponent implements OnInit, OnChanges {
  private readonly api = inject(ApiService);
  private readonly options = inject(FormOptionsService);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly categoryId = input<number | null>(null);

  readonly loading = signal(false);
  readonly tabs = signal<TabRow[]>([]);
  readonly attributes = signal<SelectOption[]>([]);
  readonly attachChoice = signal<Record<number, number | ''>>({});
  newTabLabel = '';

  ngOnInit(): void {
    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['categoryId'] && !changes['categoryId'].firstChange) {
      this.reload();
    }
  }

  reload(): void {
    const id = this.categoryId();
    if (!id) {
      this.tabs.set([]);
      return;
    }
    this.loading.set(true);
    forkJoin({
      specTabs: this.options.specTabs(),
      groups: this.options.attributeGroups(id),
      attributes: this.options.attributes(),
    }).subscribe({
      next: ({ specTabs, groups, attributes }) => {
        this.attributes.set(attributes);
        const groupRows = (groups as GroupRow[]).map((group) => ({
          ...group,
          specTabId: Number(group.specTabId ?? (group as any).specTab?.id),
          categoryAttributes: [...(group.categoryAttributes || [])].sort(
            (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id,
          ),
        }));
        const editable = specTabs.map((tab: any) => ({
          id: Number(tab.id),
          code: String(tab.code),
          label: String(tab.label),
          type: 'attribute_group',
          newLabel: '',
          renaming: false,
          editingLabel: String(tab.label),
          groups: groupRows
            .filter((group) => group.specTabId === Number(tab.id))
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id),
        }));
        this.tabs.set(editable);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Failed to load attribute groups', 'Dismiss', { duration: 3000 });
      },
    });
  }

  addTab(): void {
    const label = this.newTabLabel.trim();
    if (!label) return;
    this.api.post('/spec-tabs', { label }).subscribe({
      next: () => {
        this.newTabLabel = '';
        this.snack.open('Tab added. It is available on every category.', 'OK', { duration: 2500 });
        this.reload();
      },
      error: (err) => this.fail(err, 'Could not add tab'),
    });
  }

  startRename(tab: TabRow): void {
    tab.renaming = true;
    tab.editingLabel = tab.label;
  }

  cancelRename(tab: TabRow): void {
    tab.renaming = false;
    tab.editingLabel = tab.label;
  }

  renameTab(tab: TabRow): void {
    const label = tab.editingLabel.trim();
    if (!label || label === tab.label) {
      this.cancelRename(tab);
      return;
    }
    this.api.put(`/spec-tabs/${tab.id}`, { label }).subscribe({
      next: () => {
        this.snack.open('Tab renamed', 'OK', { duration: 1800 });
        this.reload();
      },
      error: (err) => this.fail(err, 'Could not rename tab'),
    });
  }

  deleteTab(tab: TabRow): void {
    if (tab.groups.length) {
      this.snack.open('Remove this tab’s groups first', 'Dismiss', { duration: 3000 });
      return;
    }
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete tab',
          message: `Delete the global tab "${tab.label}"? This removes it from every category.`,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.delete(`/spec-tabs/${tab.id}`).subscribe({
          next: () => {
            this.snack.open('Tab deleted', 'OK', { duration: 1800 });
            this.reload();
          },
          error: (err) => this.fail(err, 'Could not delete tab'),
        });
      });
  }

  addGroup(tab: TabRow): void {
    const categoryId = this.categoryId();
    const label = tab.newLabel.trim();
    if (!categoryId || !label) return;
    this.api
      .post(`/categories/${categoryId}/attribute-groups`, {
        specTabId: tab.id,
        label,
        sortOrder: tab.groups.length,
      })
      .subscribe({
        next: () => {
          tab.newLabel = '';
          this.snack.open('Group added', 'OK', { duration: 1800 });
          this.reload();
        },
        error: (err) => this.fail(err, 'Could not add group'),
      });
  }

  dropGroup(tab: TabRow, event: CdkDragDrop<GroupRow[]>): void {
    const categoryId = this.categoryId();
    if (!categoryId || event.previousIndex === event.currentIndex) return;
    const list = [...tab.groups];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    tab.groups = list;
    this.api
      .patch(`/categories/${categoryId}/attribute-groups/reorder`, {
        items: list.map((group, index) => ({ id: group.id, sortOrder: index })),
      })
      .subscribe({
        error: () => {
          this.snack.open('Reorder failed', 'Dismiss', { duration: 3000 });
          this.reload();
        },
      });
  }

  dropAttribute(group: GroupRow, event: CdkDragDrop<GroupRow['categoryAttributes']>): void {
    if (event.previousIndex === event.currentIndex) return;
    const list = [...group.categoryAttributes];
    moveItemInArray(list, event.previousIndex, event.currentIndex);
    group.categoryAttributes = list;
    this.api
      .patch('/category-attributes/reorder', {
        items: list.map((row, index) => ({ id: row.id, sortOrder: index })),
      })
      .subscribe({
        error: () => {
          this.snack.open('Reorder failed', 'Dismiss', { duration: 3000 });
          this.reload();
        },
      });
  }

  availableAttributes(group: GroupRow): SelectOption[] {
    const used = new Set(
      group.categoryAttributes.map((row) => Number(row.attribute?.id)).filter(Boolean),
    );
    return this.attributes().filter((opt) => !used.has(Number(opt.value)));
  }

  setAttachChoice(groupId: number, value: number | ''): void {
    this.attachChoice.update((map) => ({ ...map, [groupId]: value }));
  }

  attachAttribute(group: GroupRow): void {
    const categoryId = this.categoryId();
    const attributeId = Number(this.attachChoice()[group.id]);
    if (!categoryId || !attributeId) return;
    this.api
      .post('/category-attributes', {
        categoryId,
        groupId: group.id,
        attributeId,
        sortOrder: group.categoryAttributes.length,
        required: false,
        fullWidth: false,
      })
      .subscribe({
        next: () => {
          this.attachChoice.update((map) => ({ ...map, [group.id]: '' }));
          this.reload();
        },
        error: (err) => this.fail(err, 'Could not attach attribute'),
      });
  }

  toggleRequired(row: GroupRow['categoryAttributes'][number], required: boolean): void {
    this.api.patch(`/category-attributes/${row.id}`, { required }).subscribe({
      next: () => (row.required = required),
      error: () => this.snack.open('Update failed', 'Dismiss', { duration: 3000 }),
    });
  }

  toggleFullWidth(row: GroupRow['categoryAttributes'][number], fullWidth: boolean): void {
    this.api.patch(`/category-attributes/${row.id}`, { fullWidth }).subscribe({
      next: () => (row.fullWidth = fullWidth),
      error: () => this.snack.open('Update failed', 'Dismiss', { duration: 3000 }),
    });
  }

  detachAttribute(row: GroupRow['categoryAttributes'][number]): void {
    this.api.delete(`/category-attributes/${row.id}`).subscribe({
      next: () => this.reload(),
      error: () => this.snack.open('Detach failed', 'Dismiss', { duration: 3000 }),
    });
  }

  deleteGroup(group: GroupRow): void {
    const categoryId = this.categoryId();
    if (!categoryId) return;
    this.dialog
      .open(ConfirmationDialogComponent, {
        data: {
          title: 'Delete group',
          message: `Delete "${group.label}" and its attached attributes?`,
        },
      })
      .afterClosed()
      .subscribe((ok) => {
        if (!ok) return;
        this.api.delete(`/categories/${categoryId}/attribute-groups/${group.id}`).subscribe({
          next: () => this.reload(),
          error: () => this.snack.open('Delete failed', 'Dismiss', { duration: 3000 }),
        });
      });
  }

  private fail(err: any, fallback: string): void {
    const raw = err?.error?.message ?? err?.message ?? fallback;
    this.snack.open(Array.isArray(raw) ? raw.join(' ') : String(raw), 'Dismiss', {
      duration: 3500,
    });
  }
}
