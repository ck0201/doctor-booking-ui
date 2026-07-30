import { City, District } from './location.model';
import { Rating } from './rating.model';
import { Specialty } from './specialty.model';

export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Weekday = (typeof WEEKDAYS)[number];

/**
 * One opening window.
 *
 * The days are structured because the search results need an "open today"
 * indicator, which a display string cannot answer. The times stay display
 * strings — turning those into bookable slots is appointment booking's job, and
 * keeping them as text is what holds that boundary (ADR-020).
 */
export interface OpeningHours {
  readonly days: readonly Weekday[];
  readonly opensAt: string;
  readonly closesAt: string;
}

export interface HospitalAddress {
  readonly line: string;
  readonly city: City;
  /** The city's district, so a card can show both without a second lookup. */
  readonly district: District;
}

/**
 * The narrowest shape a hospital card needs (mirrors ADR-016).
 *
 * Hospital below satisfies it structurally, so list and detail feed the same
 * card with no mapping layer.
 */
export interface HospitalCardData {
  readonly id: number;
  readonly name: string;
  readonly logoUrl?: string;
  readonly rating?: Rating;
  readonly address: HospitalAddress;
  /** Departments the hospital runs. A superset of its doctors' specialties. */
  readonly departments: readonly Specialty[];
  /** Doctors listing a practice here. Derived when the mock is built. */
  readonly doctorCount: number;
  readonly openingHours: readonly OpeningHours[];
  /** True for hospitals with round-the-clock cover; openingHours is then empty. */
  readonly isOpen24Hours: boolean;
}

/** The full hospital profile (mirrors ADR-020). */
export interface Hospital extends HospitalCardData {
  readonly description: string;
  readonly facilities: readonly string[];
  readonly contactNumber: string;
  /** Collected at registration; the seeded mocks do not carry these. */
  readonly email?: string;
  readonly website?: string;
}
