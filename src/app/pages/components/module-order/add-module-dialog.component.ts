import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { iconsIC } from '../../../../static-data/icons-ic';
import type { AdminNavModule } from '../../../core/services/module.service';

export type AddModuleDialogData = {
  module?: AdminNavModule;
  categories: (string | null)[];
  category?: string;
  order?: number;
  categoryOrderNo?: number | null;
};

@Component({
  selector: 'app-add-module-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
  ],
  templateUrl: './add-module-dialog.component.html',
  styleUrl: './add-module-dialog.component.scss',
})
export class AddModuleDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<AddModuleDialogComponent>);
  readonly data = inject<AddModuleDialogData>(MAT_DIALOG_DATA);

  readonly availableIcons = iconsIC;
  filteredIcons = [...iconsIC];
  iconSearchTerm = '';
  showNewCategoryInput = false;
  readonly editMode = !!this.data?.module;
  readonly existingCategories = (this.data?.categories || []).filter((c): c is string => !!c);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    icon: ['', Validators.required],
    router_link: ['/admin/dashboard', Validators.required],
    category: ['', Validators.required],
    newCategory: [''],
  });

  ngOnInit(): void {
    const module = this.data?.module;
    let iconValue = module?.icon || '';
    if (iconValue.includes(':')) {
      iconValue = iconValue.split(':')[1] || '';
    }

    this.form.patchValue({
      name: module?.name || '',
      icon: iconValue,
      router_link: module?.router_link || '/admin/dashboard',
      category: module?.categories || this.data?.category || '',
    });

    this.form.controls.category.valueChanges.subscribe((value) => {
      if (value === '__NEW__') {
        this.showNewCategoryInput = true;
        this.form.controls.category.clearValidators();
        this.form.controls.newCategory.setValidators([Validators.required]);
      } else if (this.showNewCategoryInput) {
        this.showNewCategoryInput = false;
        this.form.controls.newCategory.clearValidators();
        this.form.controls.category.setValidators([Validators.required]);
      }
      this.form.controls.category.updateValueAndValidity({ emitEvent: false });
      this.form.controls.newCategory.updateValueAndValidity({ emitEvent: false });
    });
  }

  toggleNewCategory(): void {
    this.showNewCategoryInput = !this.showNewCategoryInput;
    if (this.showNewCategoryInput) {
      this.form.patchValue({ category: '' });
      this.form.controls.newCategory.setValidators([Validators.required]);
    } else {
      this.form.controls.newCategory.clearValidators();
      this.form.patchValue({ newCategory: '' });
    }
    this.form.controls.newCategory.updateValueAndValidity();
  }

  filterIcons(searchTerm: string): void {
    this.iconSearchTerm = searchTerm;
    if (!searchTerm.trim()) {
      this.filteredIcons = this.availableIcons;
      return;
    }
    const term = searchTerm.toLowerCase().trim();
    this.filteredIcons = this.availableIcons.filter((icon: string) => icon.toLowerCase().includes(term));
  }

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    const category = this.showNewCategoryInput
      ? this.form.controls.newCategory.value.trim()
      : this.form.controls.category.value;

    if (this.showNewCategoryInput) {
      this.form.controls.newCategory.markAsTouched();
      if (!category) return;
    } else if (!category || category === '__NEW__') {
      this.form.controls.category.markAsTouched();
      return;
    }

    if (this.form.controls.name.invalid || this.form.controls.icon.invalid || this.form.controls.router_link.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const iconValue = this.form.controls.icon.value;
    this.dialogRef.close({
      module: {
        name: this.form.controls.name.value,
        icon: iconValue ? `mat:${iconValue}` : 'mat:assignment',
        router_link: this.form.controls.router_link.value,
        categories: category,
        order: this.data?.order || 1,
        categoryOrderNo: this.data?.categoryOrderNo || null,
      },
      isEdit: this.editMode,
      moduleId: this.data?.module?.id,
    });
  }
}
