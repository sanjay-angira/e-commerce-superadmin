import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ApiService } from '../../../../../core/services/api.service';

const STATUSES = [
  { label: 'New', value: 'new' },
  { label: 'Contacted', value: 'contacted' },
  { label: 'Resolved', value: 'resolved' },
];

@Component({
  selector: 'app-contact-lead-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    AdminFormShellComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class ContactLeadFormComponent implements OnInit {
  private readonly crud = inject(AdminCrudFormService);
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly statuses = STATUSES;
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly lead = signal<any>(null);

  readonly form = this.fb.nonNullable.group({
    status: ['new', Validators.required],
  });

  name(): string {
    const lead = this.lead();
    return [lead?.firstName, lead?.lastName].filter(Boolean).join(' ') || '—';
  }

  ngOnInit(): void {
    const id = this.recordId();
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe({
      next: ({ data, error }) => {
        this.loading.set(false);
        this.loadError.set(error);
        this.lead.set(data);
        if (data?.status) this.form.patchValue({ status: data.status });
      },
    });
  }

  submit(): void {
    const id = this.recordId();
    if (!id || this.form.invalid) return;
    this.saving.set(true);
    this.submitError.set('');
    this.api.patch(`/contact-us-leads/${id}/status`, this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.crud.redirectToList(this.module());
      },
      error: (err) => {
        this.saving.set(false);
        this.submitError.set(err?.error?.message || 'Failed to update lead status.');
      },
    });
  }
}
