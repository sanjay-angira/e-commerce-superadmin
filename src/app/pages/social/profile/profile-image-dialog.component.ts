import { Component, inject, signal } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { UploadService, UPLOAD_PATHS } from '../../../core/services/upload.service';

@Component({
  selector: 'app-profile-image-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <div class="dlg">
      <div class="dlg-head" mat-dialog-title>
        <h2>Upload Image</h2>
        <button mat-icon-button type="button" class="close-btn" (click)="close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        @if (error()) {
          <div class="banner error">{{ error() }}</div>
        }

        @if (previewUrl()) {
          <div class="preview">
            <img [src]="previewUrl()" alt="Selected profile image" />
          </div>
        }

        <div class="vr-upload">
          <div class="vr-upload-dropzone-wrap">
            <span class="vr-upload-label">Profile Image</span>
            <button
              type="button"
              class="vr-upload-dropzone"
              (click)="fileInput.click()"
              [disabled]="saving()"
            >
              @if (saving()) {
                <mat-spinner diameter="22"></mat-spinner>
              } @else {
                <mat-icon>cloud_upload</mat-icon>
                <span>{{ previewUrl() ? 'Replace file' : 'Click to upload' }}</span>
              }
            </button>
          </div>
        </div>

        <input #fileInput type="file" hidden accept="image/*" (change)="onFile($event)" />
      </mat-dialog-content>

      <mat-dialog-actions align="center">
        <button mat-stroked-button type="button" mat-dialog-close [disabled]="saving()">Cancel</button>
        <button
          mat-flat-button
          type="button"
          class="upload-btn"
          (click)="upload()"
          [disabled]="!selectedFile() || saving()"
        >
          @if (saving()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            Upload
          }
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [
    `
      .dlg {
        --dlg-primary: var(--vr-primary);
        background: var(--vr-card);
        min-width: min(520px, 90vw);
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
        gap: 16px;
        padding: 24px !important;
        margin: 0 !important;
      }
      .banner.error {
        padding: 10px 12px;
        border-radius: 8px;
        background: var(--vr-danger-soft);
        border: 1px solid var(--vr-danger-border);
        color: var(--vr-danger-text);
        font-size: 13px;
      }
      .preview {
        display: flex;
        justify-content: center;
        align-items: center;
        max-height: 60vh;
        overflow: auto;
      }
      .preview img {
        display: block;
        max-width: 100%;
        max-height: 60vh;
        width: auto;
        height: auto;
        object-fit: contain;
        border-radius: 8px;
      }
      mat-dialog-actions {
        margin: 0 !important;
        padding: 8px 24px 24px !important;
        gap: 12px;
        justify-content: center !important;
      }
      .upload-btn {
        min-width: 110px;
        background: var(--dlg-primary) !important;
        color: #fff !important;
      }
      .upload-btn:disabled {
        opacity: 0.7;
      }
    `,
  ],
})
export class ProfileImageDialogComponent {
  private readonly api = inject(ApiService);
  private readonly uploadSvc = inject(UploadService);
  private readonly dialogRef = inject(MatDialogRef<ProfileImageDialogComponent>);
  readonly data = inject<any>(MAT_DIALOG_DATA);

  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal('');
  readonly saving = signal(false);
  readonly error = signal('');

  close(): void {
    this.dialogRef.close();
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.error.set('Only image files are allowed.');
      return;
    }

    this.error.set('');
    this.selectedFile.set(file);

    const reader = new FileReader();
    reader.onload = () => this.previewUrl.set(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  upload(): void {
    const file = this.selectedFile();
    if (!file || !this.data?.id) return;

    this.saving.set(true);
    this.error.set('');

    this.uploadSvc.upload(file, UPLOAD_PATHS.users).subscribe({
      next: (res: any) => {
        const url = res?.data?.Location || res?.Location || res?.data?.url || '';
        if (!url) {
          this.saving.set(false);
          this.error.set('Upload succeeded but no URL returned.');
          return;
        }
        this.saveProfileImage(url);
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Image upload failed.');
      },
    });
  }

  private saveProfileImage(url: string): void {
    this.api.put(`/users/${this.data.id}`, { profileImage: url, photo: url }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        const user = res?.data ?? { ...this.data, profileImage: url, photo: url };
        this.dialogRef.close({ message: 'Profile image updated', user });
      },
      error: (err: any) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Failed to save profile image.');
      },
    });
  }
}
