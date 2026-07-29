import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DashboardAppointment, DoctorAppointmentStatus } from '@core/models/doctor-dashboard.model';
import { formatTimeRange } from '@core/utils/booking-slots';

const STATUS_LABELS: Readonly<Record<DoctorAppointmentStatus, string>> = {
  upcoming: 'Upcoming',
  'in-progress': 'In Progress',
  completed: 'Completed',
};

/**
 * One line of the doctor's day.
 *
 * Read-only: no actions, nothing clickable. The patient is the subject here,
 * which is why the patient history's AppointmentCard could not be reused — that
 * one renders a doctor and a different set of statuses.
 */
@Component({
  selector: 'app-dashboard-appointment-row',
  templateUrl: './dashboard-appointment-row.html',
  styleUrl: './dashboard-appointment-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardAppointmentRow {
  readonly appointment = input.required<DashboardAppointment>();

  protected readonly timeLabel = computed(() => formatTimeRange(this.appointment().time));

  protected readonly statusLabel = computed(() => STATUS_LABELS[this.appointment().status]);
}
