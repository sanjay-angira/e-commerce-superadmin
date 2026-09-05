import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export type ConfirmationDialogData = {
  title: string;
  message: string;
  confirmLabel?: string;
};

@Component({
  selector: 'app-confirmation-dialog',
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dlg">
      <div class="dlg-head" mat-dialog-title>
        <div class="dlg-title">
          <span class="dlg-icon">
            <mat-icon>warning</mat-icon>
          </span>
          <div>
            <h2>{{ data.title }}</h2>
            <p>Please confirm this action</p>
          </div>
        </div>
        <button mat-icon-button type="button" class="close-btn" (click)="close()" aria-label="Close">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-dialog-content>
        <p>{{ data.message }}</p>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-stroked-button type="button" mat-dialog-close>Cancel</button>
        <button mat-flat-button color="primary" type="button" (click)="confirm()">
          {{ data.confirmLabel || 'Delete' }}
        </button>
      </mat-dialog-actions>
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
        gap: 12px;
        margin: 0;
        padding: 12px 20px;
        min-height: 72px;
        background: var(--dlg-primary);
        color: #fff;
      }
      .dlg-title {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }
      .dlg-icon {
        display: grid;
        place-items: center;
        width: 32px;
        height: 32px;
        flex-shrink: 0;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.18);
      }
      .dlg-icon mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #facc15;
      }
      .dlg-head h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        line-height: 1.25;
        text-align: left;
      }
      .dlg-head p {
        margin: 2px 0 0;
        font-size: 12px;
        font-weight: 400;
        opacity: 0.9;
        text-align: left;
      }
      .close-btn {
        color: #fff !important;
      }
      mat-dialog-content {
        padding: 24px 24px 8px !important;
        margin: 0 !important;
      }
      mat-dialog-content p {
        margin: 0;
        font-size: 14px;
        line-height: 1.5;
        color: var(--vr-text);
      }
      mat-dialog-actions {
        margin: 0 !important;
        padding: 8px 24px 24px !important;
        gap: 8px;
      }
    `,
  ],
})
export class ConfirmationDialogComponent {
  readonly data = inject<ConfirmationDialogData>(MAT_DIALOG_DATA);
  private readonly ref = inject(MatDialogRef<ConfirmationDialogComponent>);

  close(): void {
    this.ref.close(false);
  }

  confirm(): void {
    this.ref.close(true);
  }
}
