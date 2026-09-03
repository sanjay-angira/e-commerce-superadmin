import { Component, inject, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { iconsIC } from '../../../../static-data/icons-ic';

export type EditCategoryDialogData = {
  categoryName: string;
  categoryIcon?: string;
  existingCategories: string[];
};

@Component({
  selector: 'app-edit-category-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './edit-category-dialog.component.html',
  styleUrl: './edit-category-dialog.component.scss',
})
export class EditCategoryDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<EditCategoryDialogComponent>);
  readonly data = inject<EditCategoryDialogData>(MAT_DIALOG_DATA);

  readonly availableIcons = iconsIC;
  filteredIcons = [...iconsIC];
  iconSearchTerm = '';

  readonly form = this.fb.nonNullable.group({
    categoryName: ['', [Validators.required, this.uniqueCategoryValidator.bind(this)]],
    categoryIcon: [''],
  });

  ngOnInit(): void {
    let iconValue = this.data?.categoryIcon ?? '';
    if (iconValue.includes(':')) {
      iconValue = iconValue.split(':')[1] || '';
    }
    this.form.patchValue({
      categoryName: this.data?.categoryName || '',
      categoryIcon: iconValue,
    });
  }

  uniqueCategoryValidator(control: AbstractControl): ValidationErrors | null {
    const value = (control.value || '').trim();
    if (!value || value === this.data?.categoryName) {
      return null;
    }
    if (this.data?.existingCategories?.includes(value)) {
      return { categoryExists: true };
    }
    return null;
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const categoryName = this.form.controls.categoryName.value.trim();
    const iconRaw = this.form.controls.categoryIcon.value.trim();
    const categoryIcon = iconRaw ? `mat:${iconRaw}` : '';
    const currentIcon = this.data?.categoryIcon ?? '';
    const currentIconRaw = currentIcon.includes(':') ? currentIcon.split(':')[1] : currentIcon;
    const nameUnchanged = categoryName === this.data.categoryName;
    const iconUnchanged = (iconRaw || '') === (currentIconRaw || '');

    if (!categoryName || (nameUnchanged && iconUnchanged)) {
      this.dialogRef.close();
      return;
    }

    this.dialogRef.close({ categoryName, categoryIcon: categoryIcon || 'mat:folder' });
  }
}
