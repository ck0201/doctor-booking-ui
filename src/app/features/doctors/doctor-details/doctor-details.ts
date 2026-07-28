import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { Breadcrumb, Breadcrumbs } from '@shared/components/layout/breadcrumbs/breadcrumbs';
import { Avatar } from '@shared/components/ui/avatar/avatar';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { RatingStars } from '@shared/components/ui/rating-stars/rating-stars';
import { TagList } from '@shared/components/ui/tag-list/tag-list';
import { DoctorService } from '@core/services/doctor.service';
import { toRouteId } from '@core/utils/route-params';

/** One row of the star distribution chart. */
interface RatingRow {
  readonly star: number;
  readonly count: number;
  readonly percent: number;
}

const STARS = [5, 4, 3, 2, 1] as const;

/**
 * Doctor profile page.
 *
 * The :id segment is validated rather than trusted: anything that is not a
 * positive integer, and any id with no matching doctor, renders the not-found
 * state in place rather than redirecting (ADR-023). The URL survives, so the
 * user can see what they asked for and back out themselves.
 *
 * Booking is out of scope. The sidebar reserves the action region and puts
 * nothing in it.
 *
 * Sections are content inside the shared ProfileSection rather than a component
 * each (ADR-022).
 */
@Component({
  selector: 'app-doctor-details',
  imports: [
    RouterLink,
    DatePipe,
    CurrencyPipe,
    Breadcrumbs,
    Avatar,
    EmptyState,
    ProfileSection,
    RatingStars,
    TagList,
  ],
  templateUrl: './doctor-details.html',
  styleUrl: './doctor-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDetails {
  private readonly doctorService = inject(DoctorService);

  /** Raw route parameter, bound by withComponentInputBinding() (ADR-021). */
  readonly id = input.required<string>();

  /** Null when the segment is not a usable id at all. */
  private readonly doctorId = computed(() => toRouteId(this.id()));

  /** Undefined for both an unusable id and an id nobody has — one not-found path. */
  readonly doctor = computed(() => {
    const id = this.doctorId();
    return id === null ? undefined : this.doctorService.getById(id);
  });

  readonly isNotFound = computed(() => this.doctor() === undefined);

  readonly breadcrumbs = computed<readonly Breadcrumb[]>(() => [
    { label: 'Home', route: ['/'] },
    { label: 'Find Doctors', route: ['/doctors'] },
    { label: this.doctor()?.name ?? 'Doctor not found' },
  ]);

  readonly specialtyNames = computed(
    () => this.doctor()?.specialties.map((specialty) => specialty.name) ?? [],
  );

  /** Star distribution as percentages. Empty when the doctor has no ratings. */
  readonly ratingRows = computed<readonly RatingRow[]>(() => {
    const doctor = this.doctor();
    const breakdown = doctor?.ratingBreakdown;
    const total = doctor?.rating?.reviewCount ?? 0;

    if (!breakdown || total === 0) {
      return [];
    }

    return STARS.map((star) => ({
      star,
      count: breakdown[star],
      percent: Math.round((breakdown[star] / total) * 100),
    }));
  });

  /** 'Present' rather than a blank when the doctor still holds the role. */
  periodLabel(fromYear: number, toYear?: number): string {
    return `${fromYear} – ${toYear ?? 'Present'}`;
  }
}
