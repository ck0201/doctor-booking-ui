import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HospitalService } from '@core/services/hospital.service';
import { DoctorService } from '@core/services/doctor.service';
import { openingHoursLabel } from '@core/utils/opening-hours';
import { toRouteId } from '@core/utils/route-params';
import { Breadcrumb, Breadcrumbs } from '@shared/components/layout/breadcrumbs/breadcrumbs';
import { Avatar } from '@shared/components/ui/avatar/avatar';
import { DoctorCard } from '@shared/components/ui/doctor-card/doctor-card';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { RatingStars } from '@shared/components/ui/rating-stars/rating-stars';
import { TagList } from '@shared/components/ui/tag-list/tag-list';

/**
 * Hospital profile.
 *
 * Unknown or malformed ids render not-found in place rather than redirecting
 * (ADR-023), through the same toRouteId used everywhere else.
 *
 * Doctors come from DoctorService.getByHospital — the seam added in ADR-025 — and
 * render through DoctorCard. No booking action here: Doctor Details stays the
 * single booking entry point.
 */
@Component({
  selector: 'app-hospital-details',
  imports: [
    RouterLink,
    Breadcrumbs,
    Avatar,
    DoctorCard,
    EmptyState,
    ProfileSection,
    RatingStars,
    TagList,
  ],
  templateUrl: './hospital-details.html',
  styleUrl: './hospital-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HospitalDetails {
  private readonly hospitalService = inject(HospitalService);
  private readonly doctorService = inject(DoctorService);

  /** Raw route parameter, bound by withComponentInputBinding() (ADR-021). */
  readonly hospitalId = input.required<string>();

  /** Undefined for both an unusable id and an id nobody has — one not-found path. */
  readonly hospital = computed(() => {
    const id = toRouteId(this.hospitalId());
    return id === null ? undefined : this.hospitalService.getById(id);
  });

  readonly isNotFound = computed(() => this.hospital() === undefined);

  readonly doctors = computed(() => {
    const hospital = this.hospital();
    return hospital ? this.doctorService.getByHospital(hospital.id) : [];
  });

  readonly departmentNames = computed(
    () => this.hospital()?.departments.map((department) => department.name) ?? [],
  );

  /** 'Mon – Sat · 09:00 AM – 08:00 PM' per window, via the shared util. */
  readonly openingHoursLabels = computed(
    () => this.hospital()?.openingHours.map(openingHoursLabel) ?? [],
  );

  readonly breadcrumbs = computed<readonly Breadcrumb[]>(() => [
    { label: 'Home', route: ['/'] },
    { label: 'Find Hospitals', route: ['/hospitals'] },
    { label: this.hospital()?.name ?? 'Hospital not found' },
  ]);
}
