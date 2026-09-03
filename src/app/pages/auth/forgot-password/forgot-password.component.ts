import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LoginService } from '../../../core/services/login.service';
import { AuthBrandLogoComponent } from '../shared/auth-brand-logo.component';

@Component({
  selector: 'app-forgot-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    AuthBrandLogoComponent,
  ],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginService);
  private readonly router = inject(Router);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const email = this.form.value.email!.trim();
    this.loading.set(true);

    this.login.checkEmailExists(email).subscribe({
      next: (existsRes) => {
        if (!existsRes?.success || !existsRes?.data) {
          this.loading.set(false);
          this.snack.open('Email does not exist', 'Dismiss', { duration: 5000 });
          return;
        }

        const user = existsRes.data;
        const isAdmin = user?.userRoles?.find((role: any) => role.roleId == 1);
        if (!isAdmin) {
          this.loading.set(false);
          this.snack.open('User Role Is Not Allowed To Admin Panel', 'Dismiss', {
            duration: 5000,
          });
          this.router.navigateByUrl('/login');
          return;
        }

        this.login.forgotPassword(email).subscribe({
          next: (res) => {
            this.loading.set(false);
            if (res?.success === false) {
              this.snack.open(res?.message || 'Failed to send OTP', 'Dismiss', {
                duration: 5000,
              });
              return;
            }
            const msg =
              res?.message === 'Email Send Successfully'
                ? 'An OTP has been successfully sent to your E-mail.'
                : res?.message || 'An OTP has been successfully sent to your E-mail.';
            this.snack.open(msg, 'Dismiss', { duration: 5000 });
            this.router.navigate(['/reset-password'], {
              queryParams: {
                email,
                recordId: user?.id,
              },
            });
          },
          error: (err) => {
            this.loading.set(false);
            this.snack.open(err?.error?.message || 'Failed to send OTP', 'Dismiss', {
              duration: 5000,
            });
          },
        });
      },
      error: () => {
        this.loading.set(false);
        this.snack.open('Email does not exist', 'Dismiss', { duration: 5000 });
      },
    });
  }

  returnToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
