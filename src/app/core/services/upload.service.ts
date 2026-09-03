import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

/** S3 upload via backend — paths aligned with vr-frontend uploadPaths */
export const UPLOAD_PATHS = {
  products: '/products/images',
  variantImages: '/products/variant-images',
  categories: {
    image: '/product-category/images',
    video: '/product-category/videos',
    icon: '/product-category/icons',
  },
  offers: '/offers/images',
  coupons: '/coupons/images',
  banners: '/banners/images',
  blogs: '/blog/images',
  users: '/user/images',
  attributeColors: '/products/attribute-colors',
} as const;

@Injectable({ providedIn: 'root' })
export class UploadService {
  private readonly http = inject(HttpClient);

  upload(file: File, path: string, imageType?: string): Observable<any> {
    const form = new FormData();
    form.append('file', file);
    form.append('path', path);
    if (imageType) {
      form.append('imageType', imageType);
    }
    return this.http.post(`${environment.api_url}/upload`, form);
  }

  delete(fileUrl: string): Observable<any> {
    return this.http.delete(`${environment.api_url}/upload`, {
      body: { url: fileUrl },
    });
  }
}
