import { Injectable, inject } from '@angular/core';
import { DoctorCardData } from '../models/doctor.model';
import {
  DashboardAppointment,
  DashboardSummary,
  DoctorDashboardAvailability,
} from '../models/doctor-dashboard.model';
import { DoctorService } from './doctor.service';
import {
  DASHBOARD_AVAILABILITY,
  DASHBOARD_DOCTOR_ID,
  DASHBOARD_SUMMARY,
  DASHBOARD_TODAY,
  DASHBOARD_TODAY_APPOINTMENTS,
} from '@mock-data/doctor-dashboard.mock';

/**
 * The doctor's own view of their practice.
 *
 * A separate service rather than more methods on DoctorService: that one answers
 * questions patients ask — search, profile, who works at this hospital — and this
 * one answers questions the doctor asks about their own day. Keeping them apart
 * keeps each single-purpose, and it means the dashboard can later point at a
 * different, authenticated endpoint without disturbing patient-facing reads.
 *
 * Synchronous like every other service (ADR-008), read-only, and not connected
 * to the booking flow.
 */
@Injectable({ providedIn: 'root' })
export class DoctorDashboardService {
  private readonly doctorService = inject(DoctorService);

  /** The signed-in doctor. Mock-designated, since there is no authentication. */
  getDoctor(): DoctorCardData | undefined {
    return this.doctorService.getById(DASHBOARD_DOCTOR_ID);
  }

  /** ISO date the dashboard is reporting on. Fixed in the mock. */
  getToday(): string {
    return DASHBOARD_TODAY;
  }

  getDashboardSummary(): DashboardSummary {
    return DASHBOARD_SUMMARY;
  }

  /** In clock order, so neither the page nor the template has to sort. */
  getTodayAppointments(): readonly DashboardAppointment[] {
    return DASHBOARD_TODAY_APPOINTMENTS;
  }

  /**
   * The published availability. The dashboard toggles a local copy of
   * isAvailableToday; nothing here is written back (ADR-029).
   */
  getAvailability(): DoctorDashboardAvailability {
    return DASHBOARD_AVAILABILITY;
  }
}
