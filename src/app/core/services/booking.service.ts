import { Injectable } from '@angular/core';
import {
  Appointment,
  BookingAvailability,
  BookingRequest,
  BookingResponse,
  BookingSlot,
} from '../models/booking.model';
import { sortAppointments } from '@core/utils/appointment-order';
import { isPatientInfoValid } from '@core/utils/booking-validation';
import { APPOINTMENT_HISTORY } from '@mock-data/appointments.mock';
import { BOOKING_AVAILABILITY } from '@mock-data/booking-availability.mock';
import { DATA_AS_OF_YEAR } from '@mock-data/doctors.mock';

/**
 * Single access point for booking data.
 *
 * Stands in for POST /api/appointments and
 * GET /api/doctors/{id}/availability. Synchronous like every other service in
 * the app (ADR-008) — the switch to async happens once, everywhere, when the
 * real API lands, rather than one service growing a different shape early.
 *
 * Stateless: createBooking validates and answers, but does not mark the slot
 * taken. There is no persistence layer to hold that yet.
 */
@Injectable({ providedIn: 'root' })
export class BookingService {
  private nextReference = 1;

  /** Always answers; `days` is empty for a doctor who publishes no slots. */
  getDoctorAvailability(doctorId: number): BookingAvailability {
    return (
      BOOKING_AVAILABILITY.find((availability) => availability.doctorId === doctorId) ?? {
        doctorId,
        days: [],
      }
    );
  }

  findSlot(doctorId: number, slotId: string): BookingSlot | undefined {
    return this.getDoctorAvailability(doctorId)
      .days.flatMap((day) => day.slots)
      .find((slot) => slot.id === slotId);
  }

  /**
   * Rejects rather than throws, so the caller renders a message instead of
   * handling an exception. The three refusals are the ones a real endpoint
   * would also make.
   */
  createBooking(request: BookingRequest): BookingResponse {
    const slot = this.findSlot(request.doctorId, request.slotId);

    if (!slot) {
      return { status: 'rejected', message: 'That slot is no longer offered.' };
    }
    if (!slot.isAvailable) {
      return { status: 'rejected', message: 'That slot has just been taken.' };
    }
    if (!isPatientInfoValid(request.patient)) {
      return { status: 'rejected', message: 'Patient details are incomplete.' };
    }

    return {
      status: 'confirmed',
      reference: this.buildReference(),
      slot,
    };
  }

  /**
   * The patient's appointment history, ready to render.
   *
   * Read-only and stateless: this is what a backend would return, not a record
   * of bookings made in this session. createBooking still writes nothing, so
   * ADR-026 holds.
   *
   * Sorted here rather than in the page, so every consumer gets the same order.
   */
  getAppointmentHistory(): readonly Appointment[] {
    return sortAppointments(APPOINTMENT_HISTORY);
  }

  /** Sequential, so tests and demos read predictably. */
  private buildReference(): string {
    const sequence = `${this.nextReference++}`.padStart(4, '0');
    return `APT-${DATA_AS_OF_YEAR}-${sequence}`;
  }
}
