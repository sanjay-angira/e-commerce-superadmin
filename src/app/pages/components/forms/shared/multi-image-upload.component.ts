import { Component, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { UploadService } from '../../../../core/services/upload.service';

@Component({
  selector: 'app-multi-image-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiImageUploadComponent),
      multi: true,
    },
  ],
  templateUrl: './multi-image-upload.component.html',
  styleUrl: './multi-image-upload.component.scss'
})
export class MultiImageUploadComponent implements ControlValueAccessor {
  private readonly upload = inject(UploadService);
  private readonly snack = inject(MatSnackBar);

  readonly label = input('Images');
  readonly path = input.required<string>();
  readonly required = input(false);
  readonly uploading = signal(false);

  urls: string[] = [];
  private onChange: (v: string[]) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string[] | null): void {
    this.urls = Array.isArray(value) ? [...value] : [];
  }
  registerOnChange(fn: (v: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  remove(index: number): void {
    this.urls = this.urls.filter((_, i) => i !== index);
    this.onChange(this.urls);
    this.onTouched();
  }

  onFiles(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;
    this.uploading.set(true);
    let remaining = files.length;
    files.forEach((file) => {
      this.upload.upload(file, this.path()).subscribe({
        next: (res: any) => {
          const url = res?.data?.Location || res?.Location || res?.data?.url || '';
          if (url) {
            this.urls = [...this.urls, url];
            this.onChange(this.urls);
          }
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
        },
        error: () => {
          remaining -= 1;
          if (remaining <= 0) this.uploading.set(false);
          this.snack.open('Some uploads failed', 'Dismiss', { duration: 3000 });
        },
      });
    });
    this.onTouched();
  }
}
