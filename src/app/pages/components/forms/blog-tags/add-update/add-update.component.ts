import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { generateSlug } from '../../shared/form-utils';

@Component({
  selector: 'app-blog-tag-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    AdminFormShellComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class BlogTagFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private slugManuallyDirty = false;

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    isActive: [true],
  });

  ngOnInit(): void {
    this.form.controls.title.valueChanges.subscribe((title) => {
      if (!this.isEdit() && !this.slugManuallyDirty) {
        this.form.controls.slug.setValue(generateSlug(title), { emitEvent: false });
      }
    });

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.slugManuallyDirty = true;
      this.form.patchValue({
        title: String(data.title ?? ''),
        slug: String(data.slug ?? ''),
        isActive: Boolean(data.isActive ?? true),
      });
    });
  }

  markSlugDirty(): void {
    this.slugManuallyDirty = true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud.save(this.module(), this.recordId(), v).subscribe((res) => {
      this.saving.set(false);
      if (!res.success) {
        this.submitError.set(res.message);
        return;
      }
      this.crud.redirectToList(this.module());
    });
  }
}
