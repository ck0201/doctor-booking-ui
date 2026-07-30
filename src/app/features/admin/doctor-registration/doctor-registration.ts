import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Hospital } from '@core/models/hospital.model';
import { Specialty } from '@core/models/specialty.model';
import { DoctorService } from '@core/services/doctor.service';
import { HospitalService } from '@core/services/hospital.service';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/** Rejects a blank-but-not-empty value, which Validators.required accepts. */
function notBlank(control: AbstractControl): ValidationErrors | null {
  return (control.value ?? '').trim() ? null : { required: true };
}

/**
 * Admin doctor registration (ADR-037).
 *
 * Reactive Forms, like hospital registration (ADR-035): a fixed field set with
 * cross-field rules is where a FormGroup earns its keep.
 *
 * Specialty is scoped to the selected hospital's departments, so a doctor can
 * only be assigned to something that hospital actually runs.
 */
@Component({
  selector: 'app-doctor-registration',
  imports: [ReactiveFormsModule, EmptyState, ProfileSection],
  templateUrl: './doctor-registration.html',
  styleUrl: './doctor-registration.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorRegistration {
  private readonly doctorService = inject(DoctorService);
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly hospitals = computed(() => this.hospitalService.getHospitals());

  readonly form = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, notBlank]],
    hospitalId: [null as number | null, Validators.required],
    specialtyId: [null as number | null, Validators.required],
    experienceYears: [null as number | null, [Validators.min(0)]],
    qualifications: [''],
    consultationFee: [null as number | null, [Validators.min(1)]],
    contactNumber: [''],
    email: ['', Validators.email],
    biography: [''],
    isAvailableToday: [true],
  });

  /** Mirrors the hospital control, so the specialty list can react to it. */
  readonly selectedHospitalId = signal<number | null>(null);

  readonly selectedHospital = computed<Hospital | undefined>(() => {
    const id = this.selectedHospitalId();
    return id === null ? undefined : this.hospitalService.getById(id);
  });

  /** Only what the chosen hospital runs — the whole point of ADR-037. */
  readonly departments = computed<readonly Specialty[]>(
    () => this.selectedHospital()?.departments ?? [],
  );

  /** A hospital with nothing configured cannot take a doctor yet. */
  readonly hasNoDepartments = computed(
    () => this.selectedHospital() !== undefined && this.departments().length === 0,
  );

  private readonly formStatus = signal(this.form.status);

  /**
   * A disabled control is excluded from the group's validity, so the specialty
   * has to be checked on its own — otherwise Save would enable with none chosen.
   */
  private readonly specialtyId = signal<number | null>(null);

  readonly canSave = computed(
    () => this.formStatus() === 'VALID' && !this.hasNoDepartments() && this.specialtyId() !== null,
  );

  constructor() {
    this.form.statusChanges.subscribe((status) => this.formStatus.set(status));
    this.form.controls.specialtyId.valueChanges.subscribe((id) => this.specialtyId.set(id));
    // Nothing to choose from until a hospital is picked. Disabling the control
    // rather than the element, which Reactive Forms ignores.
    this.form.controls.specialtyId.disable();
  }

  onHospitalChange(value: string): void {
    const id = value ? Number(value) : null;
    this.selectedHospitalId.set(id);
    this.form.controls.hospitalId.setValue(id);
    // The previous choice may not exist at the new hospital.
    this.form.controls.specialtyId.setValue(null);

    if (this.departments().length) {
      this.form.controls.specialtyId.enable();
    } else {
      this.form.controls.specialtyId.disable();
    }
  }

  showError(control: keyof typeof this.form.controls, error: string): boolean {
    const field = this.form.controls[control];
    return field.hasError(error) && (field.touched || field.dirty);
  }

  save(): Promise<boolean> | void {
    if (!this.canSave()) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const hospital = this.selectedHospital();
    const specialty = this.departments().find((item) => item.id === value.specialtyId);
    if (!hospital || !specialty) {
      return;
    }

    this.doctorService.addDoctor({
      name: value.name,
      specialty,
      hospital,
      experienceYears: value.experienceYears ?? undefined,
      qualifications: value.qualifications,
      consultationFee: value.consultationFee ?? undefined,
      contactNumber: value.contactNumber,
      email: value.email,
      biography: value.biography,
      isAvailableToday: value.isAvailableToday,
    });

    return this.router.navigateByUrl('/admin');
  }

  cancel(): Promise<boolean> {
    return this.router.navigateByUrl('/admin');
  }
}
