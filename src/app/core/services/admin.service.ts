import { Injectable, inject } from '@angular/core';
import { Appointment } from '../models/booking.model';
import { DoctorCardData } from '../models/doctor.model';
import { HospitalCardData } from '../models/hospital.model';
import { BookingService } from './booking.service';
import { DoctorService } from './doctor.service';
import { HospitalService } from './hospital.service';

export interface AdminSummary {
  readonly totalDoctors: number;
  readonly totalHospitals: number;
  readonly totalAppointments: number;
  /** Doctors marked available today, before any local admin override. */
  readonly activeDoctors: number;
}

/**
 * Read-only aggregate over the existing services.
 *
 * Owns no data: it asks DoctorService, HospitalService and BookingService, so the
 * admin panel cannot disagree with the rest of the app. The counting lives here
 * rather than in the page (ADR-034).
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly doctorService = inject(DoctorService);
  private readonly hospitalService = inject(HospitalService);
  private readonly bookingService = inject(BookingService);

  getDoctors(): readonly DoctorCardData[] {
    return this.doctorService.getDoctors();
  }

  getHospitals(): readonly HospitalCardData[] {
    return this.hospitalService.getHospitals();
  }

  getAppointments(): readonly Appointment[] {
    return this.bookingService.getAppointmentHistory();
  }

  /** Whether the doctor publishes availability today. */
  isDoctorAvailable(doctor: DoctorCardData): boolean {
    return doctor.availability?.isAvailableToday ?? false;
  }

  getSummary(): AdminSummary {
    const doctors = this.getDoctors();

    return {
      totalDoctors: doctors.length,
      totalHospitals: this.getHospitals().length,
      totalAppointments: this.getAppointments().length,
      activeDoctors: doctors.filter((doctor) => this.isDoctorAvailable(doctor)).length,
    };
  }
}
