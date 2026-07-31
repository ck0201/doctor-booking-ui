import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HospitalService } from '@core/services/hospital.service';
import { PHONE_PATTERN, notBlank, urlValidator } from '@core/utils/hospital-validators';
import { toRouteId } from '@core/utils/route-params';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';

/** Wizard shape, so the step counter and the percentage cannot disagree. */
export const SETUP_STEPS = 4;
const THIS_STEP = 1;

/**
 * Hospital setup, step one: the hospital's own contact details (ADR-038).
 *
 * Only contact person, phone and website are editable. Name, type, registration
 * number, email, city and address are account and legal information the platform
 * admin controls, so they are rendered read-only and are not in the form at all —
 * there is no shape here that could write them.
 *
 * A FormGroup rather than signals, because this is a fixed field set with per-field
 * rules, which is the line ADR-035 drew. The validators are the ones registration
 * already uses.
 */
@Component({
  selector: 'app-hospital-setup',
  imports: [ReactiveFormsModule, RouterLink, EmptyState, ProfileSection],
  templateUrl: './hospital-setup.html',
  styleUrl: './hospital-setup.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalSetup implements OnInit {
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  /** Carried through the wizard as a query parameter, as the welcome page does. */
  readonly hospitalId = input<string | undefined>(undefined);

  protected readonly totalSteps = SETUP_STEPS;
  protected readonly step = THIS_STEP;
  protected readonly percentComplete = Math.round((THIS_STEP / SETUP_STEPS) * 100);

  /** One not-found path for a missing, malformed, unknown or unregistered id. */
  readonly hospital = computed(() => {
    const id = toRouteId(this.hospitalId());
    const hospital = id === null ? undefined : this.hospitalService.getById(id);
    return hospital?.hospitalCode ? hospital : undefined;
  });

  readonly form = this.formBuilder.nonNullable.group({
    contactPerson: ['', [Validators.required, notBlank]],
    contactNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
    website: ['', urlValidator],
  });

  readonly submitAttempted = signal(false);

  readonly canSave = computed(() => this.formStatus() === 'VALID');

  /** Signal mirror of the form's status, so the template stays OnPush-friendly. */
  private readonly formStatus = signal(this.form.status);

  constructor() {
    this.form.statusChanges.subscribe((status) => this.formStatus.set(status));
  }

  /**
   * Seeded in ngOnInit rather than in an effect: the input is set by then, and
   * patching once avoids the empty first paint a post-render effect would cause.
   * The wizard never changes the parameter without leaving the page.
   */
  ngOnInit(): void {
    const hospital = this.hospital();
    if (!hospital) {
      return;
    }

    this.form.patchValue({
      contactPerson: hospital.contactPerson ?? '',
      contactNumber: hospital.contactNumber,
      website: hospital.website ?? '',
    });
  }

  /** True once the field has been touched, or once Save has been attempted. */
  showError(control: keyof typeof this.form.controls, error: string): boolean {
    const field = this.form.controls[control];
    return field.hasError(error) && (field.touched || this.submitAttempted());
  }

  save(): void {
    this.submitAttempted.set(true);

    const hospital = this.hospital();
    if (!hospital) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.hospitalService.updateHospitalContact(hospital.id, {
      contactPerson: value.contactPerson,
      contactNumber: value.contactNumber,
      website: value.website,
    });

    this.router.navigate(['/hospital/setup/departments'], {
      queryParams: { hospitalId: hospital.id },
    });
  }
}
