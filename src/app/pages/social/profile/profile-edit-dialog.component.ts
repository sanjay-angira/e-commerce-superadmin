import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-profile-edit-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-head" mat-dialog-title>
        <div class="dlg-title">
          <span class="dlg-icon"><mat-icon>autorenew</mat-icon></span>
          <h2>Update Profile</h2>
        </div>
        <button mat-icon-button type="button" class="close-btn" (click)="close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()">
        <mat-dialog-content>
          @if (error()) {
            <div class="banner error">{{ error() }}</div>
          }

          <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
            <mat-label>First Name *</mat-label>
            <input matInput formControlName="firstName" autocomplete="given-name" />
            @if (form.controls.firstName.hasError('required') && form.controls.firstName.touched) {
              <mat-error>First name is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
            <mat-label>Last Name</mat-label>
            <input matInput formControlName="lastName" autocomplete="family-name" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
            <mat-label>Phone</mat-label>
            <input matInput formControlName="phoneNumber" autocomplete="tel" />
          </mat-form-field>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
          <button mat-button type="button" class="cancel-btn" mat-dialog-close>Cancel</button>
          <button mat-flat-button type="submit" class="submit-btn" [disabled]="saving()">
            @if (saving()) {
              <mat-spinner diameter="18"></mat-spinner>
            } @else {
              Submit
            }
          </button>
        </mat-dialog-actions>
      </form>
    </div>
  `,
  styles: [
    `
      .dlg {
        --dlg-primary: var(--vr-primary);
        background: var(--vr-card);
      }
      .dlg-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin: 0;
        padding: 0 12px 0 20px;
        height: 64px;
        background: var(--dlg-primary);
        color: #fff;
      }
      .dlg-title {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .dlg-icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
      }
      .dlg-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
      .dlg-head h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
      }
      .close-btn {
        color: #fff !important;
      }
      mat-dialog-content {
        display: grid;
        gap: 14px;
        padding: 24px !important;
        margin: 0 !important;
        min-width: min(520px, 86vw);
      }
      .full {
        width: 100%;
      }
      .banner.error {
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--vr-danger-soft);
        border: 1px solid var(--vr-danger-border);
        color: var(--vr-danger-text);
        font-size: 13px;
      }
      mat-dialog-actions {
        margin: 0 !important;
        padding: 8px 24px 24px !important;
        gap: 8px;
      }
      .cancel-btn {
        color: var(--dlg-primary) !important;
        font-weight: 500;
      }
      .submit-btn {
        min-width: 110px;
        height: 40px;
        border-radius: 999px !important;
        background: var(--dlg-primary) !important;
        color: #fff !important;
        font-weight: 600;
      }
      .submit-btn:disabled {
        opacity: 0.7;
      }
    `,
  ],
})
export class ProfileEditDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);
  private readonly dialogRef = inject(MatDialogRef<ProfileEditDialogComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    firstName: [this.data?.firstName || '', Validators.required],
    lastName: [this.data?.lastName || ''],
    phoneNumber: [this.data?.phoneNumber || ''],
  });

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.data?.id) return;
    this.saving.set(true);
    this.error.set('');
    const payload = this.form.getRawValue();
    this.api.put(`/users/${this.data.id}`, payload).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const user = res?.data ?? { ...this.data, ...payload };
        this.dialogRef.close({ message: 'User Updated Successfully', user });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Update failed. Please try again.');
      },
    });
  }
}
