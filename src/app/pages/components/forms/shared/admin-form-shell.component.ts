import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-admin-form-shell',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-form-shell.component.html',
  styleUrl: './admin-form-shell.component.scss'
})
export class AdminFormShellComponent {
  readonly title = input.required<string>();
  readonly module = input.required<string>();
  readonly description = input('');
  readonly loading = input(false);
  readonly loadError = input('');
  readonly submitError = input('');
}
