import {
  ChangeDetectionStrategy,
  Component,
  WritableSignal,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { OpeningHours, WEEKDAYS, Weekday } from '@core/models/hospital.model';
import { HospitalService, MAX_DEPARTMENTS, MAX_FACILITIES } from '@core/services/hospital.service';
import { fromTimeInputValue, minutesOfDay, toTimeInputValue } from '@core/utils/booking-slots';
import { toRouteId } from '@core/utils/route-params';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { RatingStars } from '@shared/components/ui/rating-stars/rating-stars';

/** One row of the opening-hours editor. Times are 24-hour input values. */
interface DayRow {
  readonly day: Weekday;
  readonly label: string;
  readonly closed: boolean;
  readonly opensAt: string;
  readonly closesAt: string;
}

const DAY_LABELS: Readonly<Record<Weekday, string>> = {
  Mon: 'Monday',
  Tue: 'Tuesday',
  Wed: 'Wednesday',
  Thu: 'Thursday',
  Fri: 'Friday',
  Sat: 'Saturday',
  Sun: 'Sunday',
};

const DEFAULT_OPENS_AT = '09:00';
const DEFAULT_CLOSES_AT = '17:00';

/**
 * Completing a hospital's operational profile (ADR-036).
 *
 * Everything is edited in local signals and written to HospitalService only on
 * Save, which is what makes Cancel a genuine discard rather than an undo.
 *
 * Signals rather than Reactive Forms: the three sections are lists and toggles,
 * not a fixed field set, so a FormGroup would fight the shape. Registration keeps
 * its FormGroup (ADR-035) because that genuinely is a fixed field set.
 */
@Component({
  selector: 'app-hospital-management',
  imports: [RouterLink, EmptyState, ProfileSection, RatingStars],
  templateUrl: './hospital-management.html',
  styleUrl: './hospital-management.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalManagement {
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);

  /** Route parameter, bound by withComponentInputBinding() (ADR-021). */
  readonly id = input.required<string>();

  protected readonly maxDepartments = MAX_DEPARTMENTS;
  protected readonly maxFacilities = MAX_FACILITIES;

  readonly hospital = computed(() => {
    const id = toRouteId(this.id());
    return id === null ? undefined : this.hospitalService.getById(id);
  });

  readonly isNotFound = computed(() => this.hospital() === undefined);

  /**
   * Working copies, seeded from the hospital and re-seeded if the id changes.
   * Nothing here reaches the service until Save, so Cancel is a real discard.
   */
  readonly days = linkedSignal<readonly DayRow[]>(() => {
    const hospital = this.hospital();

    return WEEKDAYS.map((day) => {
      const window = hospital?.openingHours.find((entry) => entry.days.includes(day));

      return {
        day,
        label: DAY_LABELS[day],
        closed: !window,
        opensAt: window ? toTimeInputValue(window.opensAt) : DEFAULT_OPENS_AT,
        closesAt: window ? toTimeInputValue(window.closesAt) : DEFAULT_CLOSES_AT,
      };
    });
  });

  readonly departments = linkedSignal<readonly string[]>(
    () => this.hospital()?.departments.map((department) => department.name) ?? [],
  );

  readonly facilities = linkedSignal<readonly string[]>(() => [
    ...(this.hospital()?.facilities ?? []),
  ]);

  readonly departmentDraft = signal('');
  readonly facilityDraft = signal('');
  readonly departmentError = signal<string | null>(null);
  readonly facilityError = signal<string | null>(null);

  /** Days that are open but whose times do not make sense. */
  readonly invalidDays = computed(() =>
    this.days().filter((row) => !row.closed && !this.isValidRow(row)),
  );

  readonly canSave = computed(() => !this.isNotFound() && this.invalidDays().length === 0);

  private isValidRow(row: DayRow): boolean {
    const opens = minutesOfDay(row.opensAt);
    const closes = minutesOfDay(row.closesAt);
    return opens !== null && closes !== null && opens < closes;
  }

  isInvalid(row: DayRow): boolean {
    return !row.closed && !this.isValidRow(row);
  }

  toggleClosed(day: Weekday): void {
    this.days.update((rows) =>
      rows.map((row) => (row.day === day ? { ...row, closed: !row.closed } : row)),
    );
  }

  setTime(day: Weekday, field: 'opensAt' | 'closesAt', value: string): void {
    this.days.update((rows) =>
      rows.map((row) => (row.day === day ? { ...row, [field]: value } : row)),
    );
  }

  // --- Departments and facilities share the same rules. ---

  addDepartment(): void {
    const error = this.add(this.departments, this.departmentDraft(), MAX_DEPARTMENTS, 'department');
    this.departmentError.set(error);
    if (!error) {
      this.departmentDraft.set('');
    }
  }

  removeDepartment(name: string): void {
    this.departments.update((items) => items.filter((item) => item !== name));
    this.departmentError.set(null);
  }

  addFacility(): void {
    const error = this.add(this.facilities, this.facilityDraft(), MAX_FACILITIES, 'facility');
    this.facilityError.set(error);
    if (!error) {
      this.facilityDraft.set('');
    }
  }

  removeFacility(name: string): void {
    this.facilities.update((items) => items.filter((item) => item !== name));
    this.facilityError.set(null);
  }

  /** Returns the reason it was refused, or null when it was added. */
  private add(
    list: WritableSignal<readonly string[]>,
    raw: string,
    max: number,
    noun: string,
  ): string | null {
    const value = raw.trim();
    if (!value) {
      return `Enter a ${noun} name`;
    }
    if (list().some((item) => item.toLowerCase() === value.toLowerCase())) {
      return `That ${noun} is already listed`;
    }
    if (list().length >= max) {
      return `No more than ${max} ${noun}s`;
    }

    list.update((items) => [...items, value]);
    return null;
  }

  save(): Promise<boolean> | void {
    const hospital = this.hospital();
    if (!hospital || !this.canSave()) {
      return;
    }

    const openingHours: OpeningHours[] = this.days()
      .filter((row) => !row.closed)
      .map((row) => ({
        days: [row.day],
        opensAt: fromTimeInputValue(row.opensAt),
        closesAt: fromTimeInputValue(row.closesAt),
      }));

    this.hospitalService.updateHospitalProfile(hospital.id, {
      openingHours,
      departmentNames: this.departments(),
      facilityNames: this.facilities(),
    });

    return this.router.navigateByUrl('/admin');
  }

  cancel(): Promise<boolean> {
    return this.router.navigateByUrl('/admin');
  }
}
