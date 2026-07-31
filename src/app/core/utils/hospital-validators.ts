import { AbstractControl, ValidationErrors } from '@angular/forms';

/**
 * The rules hospital contact details are held to.
 *
 * Extracted from the registration form when hospital setup became a second
 * consumer, so an admin registering a hospital and a hospital editing its own
 * contact details are validated identically rather than nearly identically.
 */

/** Ten digits, no spaces or country code. */
export const PHONE_PATTERN = /^\d{10}$/;

/** Optional, but must parse as an absolute http(s) URL when present. */
export function urlValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value ?? '').trim();
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:' ? null : { url: true };
  } catch {
    return { url: true };
  }
}

/** Rejects a blank-but-not-empty value, which Validators.required accepts. */
export function notBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim() ? null : { required: true };
}
