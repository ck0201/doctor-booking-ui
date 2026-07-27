import { City } from './location.model';
import { Specialty } from './specialty.model';

export interface DoctorRating {
  /** 0 – 5. */
  readonly value: number;
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
 * Deliberately smaller than the future Doctor aggregate: a list endpoint can
 * return this trimmed payload, and the details-page Doctor will satisfy it
 * structurally, so both feed the same card without a mapping layer.
 *
 * Only id, name and primarySpecialty are required — a recommendation rail may
 * know nothing else, and the card degrades to that on its own.
 */
export interface DoctorCardData {
  readonly id: number;
  readonly name: string;
  readonly primarySpecialty: Specialty;
  readonly photoUrl?: string;
  /** e.g. 'MBBS, MD (Cardiology)'. */
  readonly qualifications?: string;
  readonly experienceYears?: number;
  readonly rating?: DoctorRating;
  /** Consultation fee in INR. */
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
