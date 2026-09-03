import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { FormOptionsService, type SelectOption } from '../../shared/form-options.service';
import { QuillEditorComponent } from '../../shared/quill-editor.component';

@Component({
  selector: 'app-review-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatCheckboxModule,
    MatButtonModule,
    AdminFormShellComponent,
    QuillEditorComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class ReviewFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);
  private readonly options = inject(FormOptionsService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);
  readonly products = signal<SelectOption[]>([]);
  readonly users = signal<SelectOption[]>([]);
  readonly ratings = [1, 2, 3, 4, 5];

  readonly form = this.fb.nonNullable.group({
    rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
    comment: ['', Validators.required],
    productId: [null as number | null, Validators.required],
    isManual: [true],
    userName: [''],
    userId: [null as number | null],
    isApproved: [true],
  });

  ngOnInit(): void {
    this.options.products().subscribe((rows) => this.products.set(rows));
    this.options.users().subscribe((rows) => this.users.set(rows));

    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        rating: Number(data.rating ?? 5),
        comment: String(data.comment ?? ''),
        productId: Number(data.productId ?? data.product?.id ?? null) || null,
        isManual: Boolean(data.isManual ?? !data.userId),
        userName: String(data.userName ?? ''),
        userId: data.userId != null ? Number(data.userId) : null,
        isApproved: Boolean(data.isApproved ?? true),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud
      .save(this.module(), this.recordId(), {
        rating: v.rating,
        comment: v.comment,
        productId: Number(v.productId),
        isApproved: v.isApproved,
        isManual: v.isManual,
        userName: v.isManual ? v.userName : null,
        userId: v.isManual ? null : Number(v.userId),
      })
      .subscribe((res) => {
        this.saving.set(false);
        if (!res.success) {
          this.submitError.set(res.message);
          return;
        }
        this.crud.redirectToList(this.module());
      });
  }
}
