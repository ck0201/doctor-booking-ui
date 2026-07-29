import { AppointmentTime } from './booking.model';

/**
 * The doctor's own view of their day.
 *
 * Deliberately separate from the patient-facing models: the subject of a row
 * here is the patient, not the doctor, and a doctor sees a consultation in
 * progress where a patient's history never does. Sharing one model would have
 * meant widening AppointmentStatus and changing what the patient's filters show.
 *
 * AppointmentTime is reused, which is why it was extracted in ADR-028.
 */

/** What a doctor sees a slot doing. Distinct from the patient-facing AppointmentStatus. */
export type DoctorAppointmentStatus = 'upcoming' | 'in-progress' | 'completed';

export interface DashboardAppointment {
  /** As issued by BookingService, e.g. 'APT-2026-0031'. */
  readonly reference: string;
  readonly patientName: string;
  readonly time: AppointmentTime;
  readonly status: DoctorAppointmentStatus;
}

/** Display strings, like every other time in the app outside booking slots (ADR-020). */
export interface WorkingHours {
  readonly opensAt: string;
  readonly closesAt: string;
}

export interface DoctorDashboardAvailability {
  readonly workingHours: WorkingHours;
  readonly slotDurationMinutes: number;
  /** The published state. The dashboard toggles a local copy, never this. */
  readonly isAvailableToday: boolean;
}

export interface DashboardSummary {
  readonly todayCount: number;
  readonly upcomingCount: number;
  readonly completedTodayCount: number;
  readonly availableSlotsRemaining: number;
}
