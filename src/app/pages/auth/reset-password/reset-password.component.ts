import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LoginService } from '../../../core/services/login.service';
import { AuthBrandLogoComponent } from '../shared/auth-brand-logo.component';
import { ThemeToggleComponent } from '../../components/theme-toggle/theme-toggle.component';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!confirm) return null;
  if (password !== confirm) {
    group.get('confirmPassword')?.setErrors({ passwordMismatch: true });
    return { passwordMismatch: true };
  }
  const errors = group.get('confirmPassword')?.errors;
  if (errors) {
    delete errors['passwordMismatch'];
    if (!Object.keys(errors).length) {
      group.get('confirmPassword')?.setErrors(null);
    }
  }
  return null;
}

function passwordFormatValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value || '');
  if (!value) return null;
  const ok =
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /\d/.test(value) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(value);
  return ok ? null : { passwordFormat: true };
}

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    AuthBrandLogoComponent,
    ThemeToggleComponent,
  ],
  templateUrl: './reset-password.component.html',
  styleUrl: './reset-password.component.scss',
})
export class ResetPasswordComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly login = inject(LoginService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly snack = inject(MatSnackBar);

  readonly loading = signal(false);
  readonly passwordVisible = signal(false);
  readonly confirmVisible = signal(false);
  readonly passwordStrength = signal('');
  readonly passwordStrengthClass = signal('');

  readonly form: FormGroup = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      otp: ['', Validators.required],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(64),
          passwordFormatValidator,
        ],
      ],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['email']) {
        this.form.patchValue({ email: params['email'] });
      }
    });
  }

  onPasswordInput(): void {
    const password = String(this.form.get('password')?.value || '');
    let strength = 0;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 1;

    if (strength <= 1) {
      this.passwordStrength.set('Very Weak');
      this.passwordStrengthClass.set('very-weak');
    } else if (strength === 2) {
      this.passwordStrength.set('Weak');
      this.passwordStrengthClass.set('weak');
    } else if (strength === 3) {
      this.passwordStrength.set('Medium');
      this.passwordStrengthClass.set('medium');
    } else {
      this.passwordStrength.set('Strong');
      this.passwordStrengthClass.set('strong');
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    const { email, otp, password } = this.form.getRawValue();
    this.login.resetPassword({ email: email.trim(), otp: String(otp), password }).subscribe({
      next: (res) => {
        this.loading.set(false);
        if (res?.success === false) {
          this.snack.open(res?.message || 'Reset failed', 'Dismiss', { duration: 5000 });
          return;
        }
        this.snack.open(res?.message || 'Password updated', 'Dismiss', { duration: 5000 });
        this.router.navigateByUrl('/login');
      },
      error: (err) => {
        this.loading.set(false);
        this.snack.open(err?.error?.message || 'Reset failed', 'Dismiss', { duration: 5000 });
      },
    });
  }

  returnToLogin(): void {
    this.router.navigateByUrl('/login');
  }
}
