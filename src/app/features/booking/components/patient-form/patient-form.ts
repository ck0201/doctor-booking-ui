import { ChangeDetectionStrategy, Component, computed, input, model, signal } from '@angular/core';
import { PatientGender, PatientInfo } from '@core/models/booking.model';
import { patientInfoErrors } from '@core/utils/booking-validation';

interface GenderOption {
  readonly value: PatientGender;
  readonly label: string;
}

/**
 * Who the appointment is for.
 *
 * Signals and native inputs rather than Reactive Forms, matching the search
 * panel — the project has no forms library in use and five fields do not justify
 * introducing one (ADR-011 keeps that door open for later).
 *
 * Validation comes from the shared patientInfoErrors, so this form and the
 * page's Confirm button apply exactly the same rules. Errors appear only after a
 * field has been left, so nothing is red before it has been filled in.
 */
@Component({
  selector: 'app-patient-form',
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientForm {
  readonly patient = model.required<PatientInfo>();

  /** Set by the page after a failed submit, to reveal everything still missing. */
  readonly showAllErrors = input(false);

  protected readonly genders: readonly GenderOption[] = [
    { value: 'female', label: 'Female' },
    { value: 'male', label: 'Male' },
    { value: 'other', label: 'Other' },
  ];

  protected readonly errors = computed(() => patientInfoErrors(this.patient()));

  private readonly touched = signal<readonly string[]>([]);

  protected update<K extends keyof PatientInfo>(field: K, value: PatientInfo[K]): void {
    this.patient.update((current) => ({ ...current, [field]: value }));
  }

  protected markTouched(field: keyof PatientInfo): void {
    if (!this.touched().includes(field)) {
      this.touched.update((fields) => [...fields, field]);
    }
  }

  protected errorFor(field: keyof ReturnType<typeof patientInfoErrors>): string | null {
    if (!this.showAllErrors() && !this.touched().includes(field)) {
      return null;
    }
    return this.errors()[field];
  }
}
