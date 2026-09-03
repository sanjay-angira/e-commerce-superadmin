import { Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ApiService } from '../../../core/services/api.service';
import { LoginService } from '../../../core/services/login.service';
import { ProfileEditDialogComponent } from './profile-edit-dialog.component';
import { ProfileImageDialogComponent } from './profile-image-dialog.component';
import { ProfilePasswordDialogComponent } from './profile-password-dialog.component';

@Component({
  selector: 'app-profile',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatTabsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  private readonly api = inject(ApiService);
  private readonly login = inject(LoginService);
  private readonly dialog = inject(MatDialog);
  private readonly snack = inject(MatSnackBar);

  readonly user = signal<any>(null);

  readonly displayName = computed(() => {
    const u = this.user();
    const name = `${u?.firstName || ''} ${u?.lastName || ''}`.trim();
    return name || this.login.displayName || 'Admin';
  });

  readonly avatarUrl = computed(() => {
    const photo = this.user()?.profileImage || this.user()?.photo;
    if (photo) return photo;
    const name = encodeURIComponent(this.displayName() || 'A');
    return `https://ui-avatars.com/api/?name=${name}&background=6366f1&color=fff&size=192`;
  });

  constructor() {
    this.login.currentUser$.subscribe((user) => {
      if (user) {
        this.user.set(user);
        this.refreshUser(user.id);
      }
    });
  }

  editProfile(): void {
    const current = this.user();
    if (!current?.id) return;
    this.dialog
      .open(ProfileEditDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        data: current,
        autoFocus: 'first-tabbable',
        panelClass: 'vr-profile-dialog',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (!resp) return;
        if (resp.user) {
          this.applyUser(resp.user);
        } else {
          this.refreshUser(current.id);
        }
        if (resp.message) {
          this.snack.open(
            resp.message === 'User Updated Successfully'
              ? 'Profile Updated Successfully'
              : resp.message,
            'Dismiss',
            { duration: 4000 }
          );
        }
      });
  }

  changePassword(): void {
    this.dialog
      .open(ProfilePasswordDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        data: this.user(),
        autoFocus: 'first-tabbable',
        panelClass: 'vr-profile-dialog',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (!resp?.message) return;
        this.snack.open(resp.message, 'Dismiss', { duration: 4000 });
      });
  }

  updateProfileImage(): void {
    const current = this.user();
    if (!current?.id) return;
    this.dialog
      .open(ProfileImageDialogComponent, {
        width: '560px',
        maxWidth: '95vw',
        data: current,
        autoFocus: 'first-tabbable',
        panelClass: 'vr-profile-dialog',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (!resp) return;
        if (resp.user) {
          this.applyUser(resp.user);
        } else {
          this.refreshUser(current.id);
        }
        if (resp.message) {
          this.snack.open(resp.message, 'Dismiss', { duration: 4000 });
        }
      });
  }

  private refreshUser(id: number | string): void {
    if (!id) return;
    this.api.get(`/users/${id}`).subscribe({
      next: (res) => {
        const data = res?.data ?? res;
        if (data) this.applyUser(data);
      },
    });
  }

  private applyUser(user: any): void {
    this.user.set(user);
    this.login.updateCurrentUser(user);
  }
}
