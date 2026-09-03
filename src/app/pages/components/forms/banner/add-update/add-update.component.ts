import { Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { AdminFormShellComponent } from '../../shared/admin-form-shell.component';
import { AdminCrudFormService } from '../../shared/admin-crud-form.service';
import { ImageUploadComponent } from '../../shared/image-upload.component';
import { UPLOAD_PATHS } from '../../../../../core/services/upload.service';

@Component({
  selector: 'app-banner-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatButtonModule,
    AdminFormShellComponent,
    ImageUploadComponent,
  ],
  templateUrl: './add-update.component.html',
  styleUrl: './add-update.component.scss'
})
export class BannerFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly crud = inject(AdminCrudFormService);

  readonly module = input.required<string>();
  readonly recordId = input<string | undefined>();

  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly submitError = signal('');
  readonly saving = signal(false);
  readonly isEdit = signal(false);

  readonly uploadPath = UPLOAD_PATHS.banners;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    subtitle: [''],
    image: ['', Validators.required],
    mobileImage: ['', Validators.required],
    bannerLink: ['', Validators.required],
    position: [1],
    status: [true],
    sectionId: [1],
  });

  ngOnInit(): void {
    const id = this.recordId();
    this.isEdit.set(!!id);
    if (!id) return;
    this.loading.set(true);
    this.crud.loadRecord(this.module(), id).subscribe(({ data, error }) => {
      this.loading.set(false);
      this.loadError.set(error);
      if (!data) return;
      this.form.patchValue({
        title: String(data.title ?? ''),
        subtitle: String(data.subtitle ?? ''),
        image: String(data.image ?? ''),
        mobileImage: String(data.mobileImage ?? ''),
        bannerLink: String(data.bannerLink ?? data.buttonLink ?? ''),
        position: Number(data.position ?? 1),
        status: Boolean(data.status ?? true),
        sectionId: Number(data.sectionId ?? 1),
      });
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    this.saving.set(true);
    this.submitError.set('');
    this.crud.save(this.module(), this.recordId(), v).subscribe((res) => {
      this.saving.set(false);
      if (!res.success) {
        this.submitError.set(res.message);
        return;
      }
      this.crud.redirectToList(this.module());
    });
  }
}
