import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { City } from '@core/models/location.model';
import { HospitalService } from '@core/services/hospital.service';
import { LocationService } from '@core/services/location.service';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { SearchableDropdown } from '@shared/components/forms/searchable-dropdown/searchable-dropdown';

/** Optional, but must parse as an absolute http(s) URL when present. */
function urlValidator(control: AbstractControl): ValidationErrors | null {
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
function notBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim() ? null : { required: true };
}

/**
 * Admin-only hospital registration (ADR-035).
 *
 * The only Reactive Forms page in the app: eight fields with cross-cutting
 * validation is where a FormGroup earns its keep, whereas the search panels are
 * signal-bound (ADR-011 left that door open).
 *
 * City is a SearchableDropdown rather than free text, because a hospital's
 * address holds a real City and its district is derived from it.
 */
@Component({
  selector: 'app-hospital-registration',
  imports: [ReactiveFormsModule, ProfileSection, SearchableDropdown],
  templateUrl: './hospital-registration.html',
  styleUrl: './hospital-registration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalRegistration {
  private readonly hospitalService = inject(HospitalService);
  private readonly locationService = inject(LocationService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  /** Every city in the launch districts (ADR-004). */
  readonly cities = this.locationService.getDistricts().flatMap((district) => district.cities);

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, notBlank]],
    cityId: [null as number | null, Validators.required],
    addressLine: [''],
    description: [''],
    contactNumber: [''],
    email: ['', Validators.email],
    website: ['', urlValidator],
    rating: [null as number | null, [Validators.min(0), Validators.max(5)]],
  });

  /** Mirrors the dropdown's selection into the control it stands in for. */
  readonly selectedCity = signal<City | null>(null);

  readonly submitAttempted = signal(false);

  readonly canSave = computed(() => this.formStatus() === 'VALID');

  /** Signal mirror of the form's status, so the template stays OnPush-friendly. */
  private readonly formStatus = signal(this.form.status);

  constructor() {
    this.form.statusChanges.subscribe((status) => this.formStatus.set(status));
  }

  onCitySelected(city: City | null): void {
    this.selectedCity.set(city);
    this.form.controls.cityId.setValue(city?.id ?? null);
    this.form.controls.cityId.markAsDirty();
  }

  /** True once the field has been touched, or once Save has been attempted. */
  showError(control: keyof typeof this.form.controls, error: string): boolean {
    const field = this.form.controls[control];
    return field.hasError(error) && (field.touched || this.submitAttempted());
  }

  save(): void {
    this.submitAttempted.set(true);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const city = this.cities.find((candidate) => candidate.id === value.cityId);
    if (!city) {
      return;
    }

    this.hospitalService.addHospital({
      name: value.name,
      city,
      addressLine: value.addressLine,
      description: value.description,
      contactNumber: value.contactNumber,
      email: value.email,
      website: value.website,
      rating: value.rating ?? undefined,
    });

    this.router.navigateByUrl('/admin');
  }

  cancel(): Promise<boolean> {
    return this.router.navigateByUrl('/admin');
  }
}
