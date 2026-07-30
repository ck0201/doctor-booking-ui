import { City } from './location.model';
import { Specialty } from './specialty.model';

export interface DoctorRating {
  /** 0 – 5, to one decimal place. */
  readonly value: number;
  /** Everyone who rated, not only those who wrote a review. */
  readonly reviewCount: number;
}

export interface DoctorPractice {
  readonly hospitalName: string;
  /** Carries districtId, so location filtering needs no extra field. */
  readonly city: City;
}

export interface DoctorAvailability {
  readonly isAvailableToday: boolean;
  /** Human label such as 'Tomorrow, 10:00 AM'. */
  readonly nextSlotLabel?: string;
}

/**
 * The narrowest shape DoctorCard needs to render (ADR-016).
 *
 * Deliberately smaller than the Doctor aggregate below: a list endpoint can
 * return this trimmed payload, and Doctor satisfies it structurally, so both
 * feed the same card without a mapping layer.
 *
 * Only id, name and primarySpecialty are required — a recommendation rail may
 * know nothing else, and the card degrades to that on its own.
 */
export interface DoctorCardData {
  readonly id: number;
  readonly name: string;
  readonly primarySpecialty: Specialty;
  readonly photoUrl?: string;
  /** Summary line, e.g. 'MBBS, MD (Cardiology)'. */
  readonly qualifications?: string;
  readonly experienceYears?: number;
  readonly rating?: DoctorRating;
  /** Consultation fee in INR at the primary practice. */
  readonly consultationFee?: number;
  readonly practice?: DoctorPractice;
  readonly availability?: DoctorAvailability;
  readonly isVerified?: boolean;
}

/** Suppressible regions of the card — see DoctorCard.omit. */
export type DoctorCardField =
  | 'photo'
  | 'qualifications'
  | 'experience'
  | 'rating'
  | 'fee'
  | 'practice'
  | 'availability'
  | 'actions';

// --- Profile detail (ADR-020) ---

export interface Qualification {
  readonly degree: string;
  readonly institute: string;
  readonly year: number;
}

export interface ExperienceEntry {
  readonly role: string;
  readonly organisation: string;
  readonly fromYear: number;
  /** Absent means the doctor is still there. */
  readonly toYear?: number;
}

export interface Registration {
  readonly council: string;
  readonly registrationNumber: string;
  readonly year: number;
}

/**
 * Opening hours as display strings, deliberately not machine-readable slots.
 * Structuring these is the first task of appointment booking, and keeping them
 * as text is what stops booking leaking into the profile phase.
 */
export interface PracticeTiming {
  readonly days: string;
  readonly opensAt: string;
  readonly closesAt: string;
}

export interface DoctorPracticeDetail extends DoctorPractice {
  /**
   * The hospital this practice is at. Makes "doctors at this hospital" an exact
   * query instead of a name-string match, and keeps the relationship in one
   * place: a hospital's doctor list is derived from these.
   */
  readonly hospitalId: number;
  readonly addressLine: string;
  /** Consultation fee in INR at this practice. */
  readonly consultationFee?: number;
  readonly timings: readonly PracticeTiming[];
}

export interface DoctorReview {
  readonly id: number;
  readonly patientName: string;
  /** 1 – 5. */
  readonly rating: number;
  readonly comment: string;
  /** ISO date. Fixed values only — never derived from the current date. */
  readonly visitedOn: string;
  readonly isVerifiedVisit: boolean;
}

/** How many ratings fell on each star. Sums to DoctorRating.reviewCount. */
export interface RatingBreakdown {
  readonly 5: number;
  readonly 4: number;
  readonly 3: number;
  readonly 2: number;
  readonly 1: number;
}

/**
 * The full doctor profile (ADR-020).
 *
 * Extends DoctorCardData, honouring the ADR-016 promise that the aggregate
 * satisfies the card contract: a profile page can hand this straight to
 * DoctorCard with no mapping.
 *
 * Every card-level field that duplicates profile detail is derived from that
 * detail when the data is built, never authored twice — see doctors.mock.ts.
 */
export interface Doctor extends DoctorCardData {
  readonly about: string;
  /** Primary first; primarySpecialty is specialties[0]. */
  readonly specialties: readonly Specialty[];
  readonly education: readonly Qualification[];
  readonly experience: readonly ExperienceEntry[];
  readonly registrations: readonly Registration[];
  readonly languages: readonly string[];
  readonly services: readonly string[];
  /** Primary first; the card's `practice` is practices[0]. */
  readonly practices: readonly DoctorPracticeDetail[];
  /** The written subset of the ratings counted in rating.reviewCount. */
  readonly reviews: readonly DoctorReview[];
  /** Collected at registration; the seeded mocks do not carry these. */
  readonly contactNumber?: string;
  readonly email?: string;
  readonly ratingBreakdown?: RatingBreakdown;
}
