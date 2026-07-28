import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
} from '@angular/core';
import { BookingResponse, BookingSlot, PatientInfo } from '@core/models/booking.model';
import { BookingService } from '@core/services/booking.service';
import { DoctorService } from '@core/services/doctor.service';
import { EMPTY_PATIENT_INFO, isPatientInfoValid } from '@core/utils/booking-validation';
import { toRouteId } from '@core/utils/route-params';
import { DoctorCard } from '@shared/components/ui/doctor-card/doctor-card';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { RouterLink } from '@angular/router';
import { BookingConfirmation } from '../components/booking-confirmation/booking-confirmation';
import { BookingStepper } from '../components/booking-stepper/booking-stepper';
import { BookingSummary } from '../components/booking-summary/booking-summary';
import { DateSelector } from '../components/date-selector/date-selector';
import { PatientForm } from '../components/patient-form/patient-form';
import { SlotGrid } from '../components/slot-grid/slot-grid';

const STEPS = ['Date & time', 'Patient details', 'Confirm'] as const;

/**
 * Appointment booking page for /book/:doctorId.
 *
 * All state is local to this component: signals for what the patient has chosen,
 * computed for everything derivable from it. Nothing global, and no store —
 * a single page's worth of state does not need one.
 *
 * The child components are dumb; this page owns the decisions. Booking
 * confirmation as a destination is out of scope, so a successful request is
 * reported in place.
 */
@Component({
  selector: 'app-appointment-booking',
  imports: [
    RouterLink,
    DoctorCard,
    EmptyState,
    ProfileSection,
    BookingConfirmation,
    BookingStepper,
    DateSelector,
    SlotGrid,
    PatientForm,
    BookingSummary,
  ],
  templateUrl: './appointment-booking.html',
  styleUrl: './appointment-booking.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppointmentBooking {
  private readonly doctorService = inject(DoctorService);
  private readonly bookingService = inject(BookingService);

  /** Raw route parameter, bound by withComponentInputBinding() (ADR-021). */
  readonly doctorId = input.required<string>();

  protected readonly steps = STEPS;

  /** Undefined for an unusable id and for an id nobody has — one not-found path (ADR-023). */
  readonly doctor = computed(() => {
    const id = toRouteId(this.doctorId());
    return id === null ? undefined : this.doctorService.getById(id);
  });

  readonly availability = computed(() => {
    const doctor = this.doctor();
    return doctor
      ? this.bookingService.getDoctorAvailability(doctor.id)
      : { doctorId: 0, days: [] };
  });

  readonly hasAvailability = computed(() =>
    this.availability().days.some((day) => day.availableSlotCount > 0),
  );

  /** Opens on the first day with a free slot, and re-seeds if the doctor changes. */
  readonly selectedDate = linkedSignal<string | null>(
    () => this.availability().days.find((day) => day.availableSlotCount > 0)?.date ?? null,
  );

  readonly slotsForSelectedDate = computed(
    () => this.availability().days.find((day) => day.date === this.selectedDate())?.slots ?? [],
  );

  /**
   * Cleared whenever the set of choosable slots changes — a new day, or a
   * different doctor. Keying off the slots rather than the date matters: two
   * doctors can share a first available date, and the old pick would survive.
   */
  readonly selectedSlotId = linkedSignal<readonly BookingSlot[], string | null>({
    source: this.slotsForSelectedDate,
    computation: () => null,
  });

  readonly selectedSlot = computed<BookingSlot | null>(
    () => this.slotsForSelectedDate().find((slot) => slot.id === this.selectedSlotId()) ?? null,
  );

  readonly patient = signal<PatientInfo>(EMPTY_PATIENT_INFO);

  /** Set once Confirm has been pressed, so the form can reveal what is missing. */
  readonly submitAttempted = signal(false);

  readonly response = signal<BookingResponse | null>(null);

  /**
   * True while a request is in flight.
   *
   * The service is synchronous today, so this window is currently instantaneous.
   * It exists so the button is already bound to it and confirm() already guards
   * on it: making the service async later needs an `await` and nothing else.
   */
  readonly isSubmitting = signal(false);

  readonly isPatientValid = computed(() => isPatientInfoValid(this.patient()));

  readonly currentStep = computed(() => {
    if (!this.selectedSlot()) {
      return 0;
    }
    return this.isPatientValid() ? 2 : 1;
  });

  readonly canConfirm = computed(
    () =>
      this.selectedSlot() !== null &&
      this.isPatientValid() &&
      !this.confirmedResponse() &&
      !this.isSubmitting(),
  );

  readonly confirmedResponse = computed(() => {
    const response = this.response();
    return response?.status === 'confirmed' ? response : null;
  });

  readonly rejectionMessage = computed(() => {
    const response = this.response();
    return response?.status === 'rejected' ? (response.message ?? 'Booking failed.') : null;
  });

  /**
   * The single way a booking is submitted.
   *
   * Guards before doing anything: an incomplete form only reveals its errors,
   * and a second press — a double-click, or a click after success — is dropped
   * rather than sent twice. The business rules themselves stay in
   * BookingService; this decides only whether to ask it.
   */
  confirm(): void {
    this.submitAttempted.set(true);

    const doctor = this.doctor();
    const slotId = this.selectedSlotId();

    if (!doctor || !slotId || !this.canConfirm()) {
      return;
    }

    this.isSubmitting.set(true);
    try {
      this.response.set(
        this.bookingService.createBooking({
          doctorId: doctor.id,
          slotId,
          patient: this.patient(),
        }),
      );
    } finally {
      // In a finally so a thrown request cannot leave the button stuck.
      this.isSubmitting.set(false);
    }
  }
}
