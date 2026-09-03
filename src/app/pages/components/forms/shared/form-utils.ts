import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Mirrors vr-frontend generateSlug */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function generateSlug(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function stripHtml(html: string): string {
  return String(html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function htmlRequired(minLength = 2): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = stripHtml(control.value || '');
    if (!text) return { required: true };
    if (text.length < minLength) {
      return { minlength: { requiredLength: minLength, actualLength: text.length } };
    }
    return null;
  };
}

export function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === 'number') return item;
      if (typeof item === 'string' && item.trim()) return Number(item);
      if (item && typeof item === 'object' && 'id' in item) {
        return Number((item as { id: number }).id);
      }
      return NaN;
    })
    .filter((n) => !Number.isNaN(n));
}

export function toDateInput(value: unknown): string {
  if (!value) return '';
  return String(value).slice(0, 10);
}

export function toDateTimeLocal(value: unknown): string {
  if (!value) return '';
  return String(value).slice(0, 16);
}

export function normalizeColorCode(code?: string): string {
  const raw = (code || '').trim();
  if (!raw) return '#000000';
  if (/^#[0-9a-fA-F]{6}$/.test(raw)) return raw;
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  return raw.startsWith('#') ? raw : `#${raw}`;
}
