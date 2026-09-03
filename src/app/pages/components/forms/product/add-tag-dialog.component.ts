import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormOptionsService, type SelectOption } from '../shared/form-options.service';
import { generateSlug } from '../shared/form-utils';

export type AddTagDialogData = {
  existingNames: string[];
};

@Component({
  selector: 'app-add-tag-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
  ],
  templateUrl: './add-tag-dialog.component.html',
  styleUrl: './add-tag-dialog.component.scss',
})
export class AddTagDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly options = inject(FormOptionsService);
  private readonly dialogRef = inject(MatDialogRef<AddTagDialogComponent, SelectOption | undefined>);
  readonly data = inject<AddTagDialogData>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    tagName: ['', [Validators.required, Validators.minLength(2)]],
  });

  cancel(): void {
    this.dialogRef.close();
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tagName = this.form.controls.tagName.value.trim();
    const exists = this.data.existingNames.some(
      (name) => name.toLowerCase() === tagName.toLowerCase()
    );
    if (exists) {
      this.error.set('This tag already exists');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.options.createProductTag(tagName).subscribe({
      next: (res) => {
        const created = (res as { data?: Record<string, unknown> })?.data ?? res;
        const id = Number((created as { id?: number })?.id);
        if (!id) {
          this.saving.set(false);
          this.error.set('Tag was created but no id was returned');
          return;
        }
        this.dialogRef.close({
          label: String((created as { tagName?: string })?.tagName ?? tagName),
          value: id,
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to add tag');
      },
    });
  }

  slugPreview(): string {
    return generateSlug(this.form.controls.tagName.value);
  }
}
