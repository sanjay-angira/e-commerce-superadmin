import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-image-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ImageUploadComponent),
      multi: true,
    },
  ],
  templateUrl: './image-upload.component.html',
  styleUrl: './image-upload.component.scss'
})
export class ImageUploadComponent implements ControlValueAccessor {
  private readonly upload = inject(UploadService);
  private readonly snack = inject(MatSnackBar);

  readonly label = input('Image');
  readonly path = input.required<string>();
  readonly required = input(false);
  readonly accept = input('image/*');
  /** When set, backend converts upload to WebP (banner/blog/category). */
  readonly imageType = input<string | undefined>(undefined);

  readonly uploading = signal(false);
  value = '';
  disabled = false;

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string | null): void {
    this.value = value || '';
  }
  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  isVideo(): boolean {
    return /\.(mp4|webm|mov)(\?|$)/i.test(this.value) || this.accept().includes('video');
  }

  clear(): void {
    this.value = '';
    this.onChange('');
    this.onTouched();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.disabled) return;
    this.uploading.set(true);
    this.upload.upload(file, this.path(), this.imageType()).subscribe({
      next: (res: any) => {
        const url = res?.data?.Location || res?.Location || res?.data?.url || '';
        this.value = url;
        this.onChange(url);
        this.onTouched();
        this.uploading.set(false);
        if (!url) this.snack.open('Upload succeeded but no URL returned', 'Dismiss', { duration: 3500 });
      },
      error: (err: any) => {
        this.uploading.set(false);
        this.snack.open(err?.error?.message || 'Upload failed', 'Dismiss', { duration: 3500 });
      },
    });
  }
}
