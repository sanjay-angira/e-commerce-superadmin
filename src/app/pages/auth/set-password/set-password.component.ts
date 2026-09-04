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
import { jwtDecode } from 'jwt-decode';
import { LoginService } from '../../../core/services/login.service';
import { AuthBrandLogoComponent } from '../shared/auth-brand-logo.component';

type InviteToken = {
  exp?: number;
  email?: string;
  userRes?: {
    id?: number;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

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

function noWhitespaceValidator(control: AbstractControl): ValidationErrors | null {
  const value = String(control.value || '');
  if (!value) return null;
  return /\s/.test(value) ? { hasWhiteSpace: true } : null;
}

@Component({
  selector: 'app-set-password',
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
  ],
  templateUrl: './set-password.component.html',
  styleUrl: './set-password.component.scss',
})
export class SetPasswordComponent implements OnInit {
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

  private emailToken = '';

  readonly form: FormGroup = this.fb.nonNullable.group(
    {
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(64),
          passwordFormatValidator,
          noWhitespaceValidator,
        ],
      ],
      confirmPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(64)]],
    },
    { validators: passwordsMatchValidator }
  );

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const token = (params.get('token') || '').trim();
      this.emailToken = token;
      if (!token) {
        this.returnToLogin('Set-password link is missing a token');
        return;
      }
      try {
        const payload = jwtDecode<InviteToken>(token);
        if (payload.exp && payload.exp * 1000 < Date.now()) {
          this.returnToLogin('Your set-password link has expired');
          return;
        }
        const email = payload.userRes?.email || payload.email || '';
        if (!email) {
          this.returnToLogin('Invalid set-password token');
          return;
        }
        this.form.patchValue({ email });
      } catch {
        this.returnToLogin('Invalid set-password token');
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
    if (!this.emailToken) {
      this.returnToLogin('Set-password link is missing a token');
      return;
    }
    this.loading.set(true);
    const { password, confirmPassword } = this.form.getRawValue();
    this.login
      .setPassword({
        token: this.emailToken,
        password,
        confirmPassword,
      })
      .subscribe({
        next: (res) => {
          this.loading.set(false);
          if (res?.success === false) {
            this.snack.open(res?.message || 'Failed to set password', 'Dismiss', {
              duration: 5000,
            });
            return;
          }
          this.snack.open(res?.message || 'Password set successfully', 'Dismiss', {
            duration: 5000,
          });
          this.login.logout();
        },
        error: (err) => {
          this.loading.set(false);
          this.snack.open(err?.error?.message || 'Failed to set password', 'Dismiss', {
            duration: 5000,
          });
        },
      });
  }

  returnToLogin(message?: string): void {
    if (message) {
      this.snack.open(message, 'Dismiss', { duration: 5000 });
    }
    this.router.navigateByUrl('/login');
  }
}
