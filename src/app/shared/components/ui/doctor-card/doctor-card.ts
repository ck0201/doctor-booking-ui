import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DoctorCardData, DoctorCardField } from '@core/models/doctor.model';

let nextCardId = 0;

/** Regions the standard mode renders, before omit() and data availability narrow them. */
const STANDARD_FIELDS: readonly DoctorCardField[] = [
  'photo',
  'qualifications',
  'experience',
  'rating',
  'fee',
  'practice',
  'availability',
  'actions',
];

type FieldVisibility = Record<DoctorCardField, boolean>;

/**
 * Reusable doctor card (ADR-016, ADR-017, ADR-018).
 *
 * Takes one object rather than a dozen scalar inputs, so adding a field is a
 * model change instead of a signature change at every call site. It depends on
 * DoctorCardData — the narrowest shape it can render — not on the full Doctor
 * aggregate.
 *
 * Only the standard density is implemented. Compact and featured are additive:
 * a `mode` input picks a different field preset and a different host class;
 * the template does not branch on mode (ADR-017).
 *
 * The card knows nothing about booking. Actions arrive by projection
 * (ADR-018), so search results, favourites and hospital details each supply
 * their own without the card changing.
 */
@Component({
  selector: 'app-doctor-card',
  imports: [RouterLink, CurrencyPipe],
  templateUrl: './doctor-card.html',
  styleUrl: './doctor-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'doctor-card doctor-card--standard',
    '[class.doctor-card--interactive]': 'interactive()',
    '[class.doctor-card--linked]': '!!detailsRoute()',
  },
})
export class DoctorCard {
  protected readonly nameId = `doctor-card-name-${nextCardId++}`;

  readonly doctor = input.required<DoctorCardData>();

  /** Suppress regions this context does not need, e.g. ['practice'] on a hospital page. */
  readonly omit = input<readonly DoctorCardField[]>([]);

  /** Heading rank, so the card fits the host page's document outline. */
  readonly headingLevel = input<2 | 3 | 4>(3);

  /**
   * Router commands for the doctor's profile.
   * Defaults to null because /doctors/:id does not exist yet — the card renders
   * a plain name rather than a link that would bounce off the wildcard route.
   */
  readonly detailsRoute = input<unknown[] | null>(null);

  /** Hover elevation. The pointer cursor only appears when there is a link. */
  readonly interactive = input(true);

  /** Card activated. Named `selected` so a projected input's native `select` event cannot spoof it. */
  readonly selected = output<DoctorCardData>();

  /**
   * A region renders when the mode includes it, the caller did not omit it,
   * and the data is actually there.
   */
  protected readonly shows = computed<FieldVisibility>(() => {
    const doctor = this.doctor();
    const omitted = new Set(this.omit());

    const hasData: FieldVisibility = {
      photo: true, // initials stand in when there is no photo
      qualifications: !!doctor.qualifications,
      experience: doctor.experienceYears != null,
      rating: !!doctor.rating,
      fee: doctor.consultationFee != null,
      practice: !!doctor.practice,
      availability: !!doctor.availability,
      actions: true, // projected; an empty slot collapses via CSS
    };

    const visibility = {} as FieldVisibility;
    for (const field of STANDARD_FIELDS) {
      visibility[field] = hasData[field] && !omitted.has(field);
    }
    return visibility;
  });

  /** Avatar fallback: 'Dr. Asha Verma' -> 'AV'. */
  protected readonly initials = computed(() => {
    const words = this.doctor()
      .name.replace(/^dr\.?\s+/i, '')
      .split(/\s+/)
      .filter(Boolean);

    const first = words[0]?.charAt(0) ?? '';
    const last = words.length > 1 ? words[words.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  });

  protected readonly ratingLabel = computed(() => {
    const rating = this.doctor().rating;
    return rating ? `${rating.value} out of 5 from ${rating.reviewCount} reviews` : '';
  });
}
