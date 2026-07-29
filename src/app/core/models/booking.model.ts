import { DoctorCardData } from './doctor.model';

/**
 * Appointment booking domain.
 *
 * This is where the timing boundary held since ADR-020 finally moves: opening
 * hours and practice timings stayed display strings precisely so that slots —
 * the first machine-readable times in the app — would arrive here and nowhere
 * else. Dates are ISO strings, never Date objects, matching the rest of the
 * mock data.
 */

/**
 * When an appointment is. The narrowest shape both a bookable slot and a
 * historical record share, so a past appointment carries no availability flag it
 * has no use for.
 */
export interface AppointmentTime {
  /** ISO date, 'YYYY-MM-DD'. */
  readonly date: string;
  /** Display time, e.g. '10:00 AM'. */
  readonly startsAt: string;
  readonly endsAt: string;
}

export interface BookingSlot extends AppointmentTime {
  /** Stable id, e.g. '1-2026-08-10-1000'. Unique across doctors and days. */
  readonly id: string;
  /** False when somebody already holds this slot. */
  readonly isAvailable: boolean;
}

export interface BookingDay {
  /** ISO date, 'YYYY-MM-DD'. */
  readonly date: string;
  /** Derived display label, e.g. 'Mon 10 Aug'. */
  readonly label: string;
  readonly slots: readonly BookingSlot[];
  /** Derived, so a date picker can disable a fully booked day. */
  readonly availableSlotCount: number;
}

export interface BookingAvailability {
  readonly doctorId: number;
  /** Empty when the doctor publishes no slots at all. */
  readonly days: readonly BookingDay[];
}

export type PatientGender = 'female' | 'male' | 'other';

/** Collected from the patient. No account exists yet, so nothing is prefilled. */
export interface PatientInfo {
  readonly fullName: string;
  /** Ten digits, as typed. */
  readonly phoneNumber: string;
  readonly age: string;
  readonly gender: PatientGender | '';
  readonly reasonForVisit: string;
}

export interface BookingRequest {
  readonly doctorId: number;
  readonly slotId: string;
  readonly patient: PatientInfo;
}

export type BookingStatus = 'confirmed' | 'rejected';

export interface BookingResponse {
  readonly status: BookingStatus;
  /** Present when confirmed, e.g. 'APT-2026-0001'. */
  readonly reference?: string;
  readonly slot?: BookingSlot;
  /** Present when rejected: why. */
  readonly message?: string;
}

/** Field-level validation results for PatientInfo. Null means the field is fine. */
export interface PatientInfoErrors {
  readonly fullName: string | null;
  readonly phoneNumber: string | null;
  readonly age: string | null;
  readonly gender: string | null;
}

// --- Appointment history (read-only) ---

/**
 * Where an appointment stands. Distinct from BookingStatus, which is the outcome
 * of a single booking request, not the life of the appointment it created.
 */
export type AppointmentStatus = 'upcoming' | 'completed' | 'cancelled';

/**
 * A booked appointment as the patient's history shows it.
 *
 * Composed from what already exists — DoctorCardData for who, AppointmentTime
 * for when — so nothing about a doctor is restated here and there is only one
 * appointment model in the app.
 */
export interface Appointment {
  /** As issued by BookingService, e.g. 'APT-2026-0004'. */
  readonly reference: string;
  readonly doctor: DoctorCardData;
  readonly time: AppointmentTime;
  readonly status: AppointmentStatus;
}

/** The history page's filter, which is a status plus "no filter". */
export type AppointmentFilter = 'all' | AppointmentStatus;
