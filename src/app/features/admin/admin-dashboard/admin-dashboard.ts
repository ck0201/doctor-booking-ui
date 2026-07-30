import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Appointment } from '@core/models/booking.model';
import { DoctorCardData } from '@core/models/doctor.model';
import { AdminService } from '@core/services/admin.service';
import { AuthService } from '@core/services/auth.service';
import { APPOINTMENT_STATUS_LABELS } from '@core/utils/appointment-order';
import { formatFullDayLabel } from '@core/utils/booking-slots';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { StatCard } from '@shared/components/ui/stat-card/stat-card';
import { RouterLink } from '@angular/router';

interface Stat {
  readonly label: string;
  readonly value: number;
  readonly caption?: string;
}

/**
 * Operational dashboard.
 *
 * Read-only over the existing mock services, with two mock actions: View, which
 * links to the profile that already exists, and Enable/Disable, which flips a
 * local set and is not saved (ADR-034).
 *
 * No CRUD, no forms, no modals, no charts.
 */
@Component({
  selector: 'app-admin-dashboard',
  imports: [RouterLink, EmptyState, ProfileSection, StatCard],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  private readonly admin = inject(AdminService);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.currentUser;

  readonly doctors = computed(() => this.admin.getDoctors());
  /** Computed, so a hospital registered by an admin appears at once (ADR-035). */
  readonly hospitals = computed(() => this.admin.getHospitals());
  readonly appointments = computed(() => this.admin.getAppointments());

  /** Doctor ids an admin has disabled in this session. Never persisted. */
  private readonly disabledDoctorIds = signal<ReadonlySet<number>>(new Set());

  /** Reference of the appointment whose detail line is showing, if any. */
  readonly selectedAppointment = signal<string | null>(null);

  readonly summary = computed<readonly Stat[]>(() => {
    const summary = this.admin.getSummary();

    return [
      { label: 'Total Doctors', value: summary.totalDoctors },
      { label: 'Total Hospitals', value: summary.totalHospitals },
      { label: 'Total Appointments', value: summary.totalAppointments },
      {
        label: 'Active Doctors',
        value: this.activeDoctorCount(),
        caption: 'Available today',
      },
    ];
  });

  /** Reflects the local overrides, so disabling a doctor is visibly doing something. */
  readonly activeDoctorCount = computed(
    () => this.doctors().filter((doctor) => this.isActive(doctor)).length,
  );

  isEnabled(doctor: DoctorCardData): boolean {
    return !this.disabledDoctorIds().has(doctor.id);
  }

  /** Available today and not disabled by an admin. */
  isActive(doctor: DoctorCardData): boolean {
    return this.isEnabled(doctor) && this.admin.isDoctorAvailable(doctor);
  }

  statusLabel(doctor: DoctorCardData): string {
    return this.isActive(doctor) ? 'Available' : 'Unavailable';
  }

  hospitalName(doctor: DoctorCardData): string {
    return doctor.practice?.hospitalName ?? '—';
  }

  toggleDoctor(doctor: DoctorCardData): void {
    this.disabledDoctorIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(doctor.id)) {
        next.delete(doctor.id);
      } else {
        next.add(doctor.id);
      }
      return next;
    });
  }

  appointmentStatusLabel(appointment: Appointment): string {
    return APPOINTMENT_STATUS_LABELS[appointment.status];
  }

  appointmentDate(appointment: Appointment): string {
    return formatFullDayLabel(appointment.time.date);
  }

  /** Appointments name their doctor, so the hospital comes from that practice. */
  appointmentHospital(appointment: Appointment): string {
    return appointment.doctor.practice?.hospitalName ?? '—';
  }

  toggleAppointment(reference: string): void {
    this.selectedAppointment.update((current) => (current === reference ? null : reference));
  }
}
