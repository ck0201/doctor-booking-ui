import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HOSPITAL_TYPES, HospitalType } from '@core/models/hospital.model';
import { City } from '@core/models/location.model';
import { HospitalService } from '@core/services/hospital.service';
import { LocationService } from '@core/services/location.service';
import { PHONE_PATTERN, notBlank, urlValidator } from '@core/utils/hospital-validators';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { SearchableDropdown } from '@shared/components/forms/searchable-dropdown/searchable-dropdown';

/**
 * Admin-only hospital registration (ADR-035).
 *
 * Creates the hospital account and nothing more: who they are, how to reach
 * them, and where they are. Operational setup lives on the management page.
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

  protected readonly hospitalTypes = HOSPITAL_TYPES;

  /**
   * Account details only.
   *
   * Departments, facilities and opening hours are deliberately absent: they are
   * operational setup, completed later on the management page (ADR-036), and
   * asking for them here would stall an admin who only wants the account created.
   */
  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, notBlank]],
    hospitalType: ['' as HospitalType | '', Validators.required],
    contactPerson: ['', [Validators.required, notBlank]],
    email: ['', [Validators.required, Validators.email]],
    contactNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    cityId: [null as number | null, Validators.required],
    addressLine: ['', [Validators.required, notBlank]],
    registrationNumber: [''],
    website: ['', urlValidator],
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

    const created = this.hospitalService.addHospital({
      name: value.name,
      city,
      hospitalType: value.hospitalType || undefined,
      contactPerson: value.contactPerson,
      registrationNumber: value.registrationNumber,
      addressLine: value.addressLine,
      contactNumber: value.contactNumber,
      email: value.email,
      website: value.website,
    });

    // The credentials screen, not the dashboard: handing them over is the last
    // step of onboarding and the admin has not finished until they have (ADR-038).
    this.router.navigateByUrl(`/admin/hospitals/${created.id}/registered`);
  }

  cancel(): Promise<boolean> {
    return this.router.navigateByUrl('/admin');
  }
}
