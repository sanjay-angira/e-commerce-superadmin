import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LoginService } from '../../../core/services/login.service';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  return password === confirm ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile-password-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-head" mat-dialog-title>
        <div class="dlg-title">
          <span class="dlg-icon"><mat-icon>lock</mat-icon></span>
          <h2>Change Password</h2>
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
            <mat-label>Old Password *</mat-label>
            <input
              matInput
              formControlName="oldPassword"
              [type]="hideOld() ? 'password' : 'text'"
              autocomplete="current-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              matTooltip="Toggle Visibility"
              (click)="hideOld.set(!hideOld())"
            >
              <mat-icon>{{ hideOld() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.controls.oldPassword.hasError('required') && form.controls.oldPassword.touched) {
              <mat-error>Old password is required</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
            <mat-label>New Password *</mat-label>
            <input
              matInput
              formControlName="password"
              [type]="hideNew() ? 'password' : 'text'"
              autocomplete="new-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              matTooltip="Toggle Visibility"
              (click)="hideNew.set(!hideNew())"
            >
              <mat-icon>{{ hideNew() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (form.controls.password.hasError('required') && form.controls.password.touched) {
              <mat-error>New password is required</mat-error>
            }
            @if (form.controls.password.hasError('minlength') && form.controls.password.touched) {
              <mat-error>Minimum 6 characters</mat-error>
            }
          </mat-form-field>

          <mat-form-field appearance="outline" class="full" subscriptSizing="dynamic">
            <mat-label>Confirm Password *</mat-label>
            <input
              matInput
              formControlName="confirmPassword"
              [type]="hideConfirm() ? 'password' : 'text'"
              autocomplete="new-password"
            />
            <button
              mat-icon-button
              matSuffix
              type="button"
              matTooltip="Toggle Visibility"
              (click)="hideConfirm.set(!hideConfirm())"
            >
              <mat-icon>{{ hideConfirm() ? 'visibility_off' : 'visibility' }}</mat-icon>
            </button>
            @if (
              form.hasError('passwordMismatch') &&
              (form.controls.confirmPassword.touched || form.controls.confirmPassword.dirty)
            ) {
              <mat-error>Passwords do not match</mat-error>
            }
          </mat-form-field>

          <p class="hint">Use at least 6 characters. Avoid reusing your current password.</p>
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
        --dlg-primary: #6366f1;
        background: #fff;
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
        background: #fef2f2;
        border: 1px solid #fecaca;
        color: #b91c1c;
        font-size: 13px;
      }
      .hint {
        margin: 0;
        font-size: 12px;
        color: #a1a1aa;
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
export class ProfilePasswordDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginService);
  private readonly dialogRef = inject(MatDialogRef<ProfilePasswordDialogComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA, { optional: true });

  readonly saving = signal(false);
  readonly error = signal('');
  readonly hideOld = signal(true);
  readonly hideNew = signal(true);
  readonly hideConfirm = signal(true);

  readonly form = this.fb.nonNullable.group(
    {
      oldPassword: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required],
    },
    { validators: matchPasswords }
  );

  close(): void {
    this.dialogRef.close();
  }

  save(): void {
    this.form.markAllAsTouched();
    this.error.set('');
    if (this.form.invalid) return;
    const { oldPassword, password } = this.form.getRawValue();
    this.saving.set(true);
    this.login.changePassword({ oldPassword, newPassword: password }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.dialogRef.close({ message: res?.message || 'Password changed successfully' });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Change password failed. Please try again.');
      },
    });
  }
}
