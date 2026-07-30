import { ChangeDetectionStrategy, Component, computed, inject, linkedSignal } from '@angular/core';
import { DoctorDashboardService } from '@core/services/doctor-dashboard.service';
import { formatFullDayLabel } from '@core/utils/booking-slots';
import { EmptyState } from '@shared/components/ui/empty-state/empty-state';
import { ProfileSection } from '@shared/components/ui/profile-section/profile-section';
import { AvailabilityPanel } from './components/availability-panel/availability-panel';
import { DashboardAppointmentRow } from './components/dashboard-appointment-row/dashboard-appointment-row';
import { StatCard } from '@shared/components/ui/stat-card/stat-card';

interface Stat {
  readonly label: string;
  readonly value: number;
  readonly caption?: string;
}

/**
 * The doctor's dashboard.
 *
 * Read-only apart from one switch. Everything shown comes from
 * DoctorDashboardService; the only state this page owns is today's availability,
 * which is local and unsaved (ADR-029).
 *
 * Not a scheduling tool: no calendar, no editing, no actions on a row.
 */
@Component({
  selector: 'app-doctor-dashboard',
  imports: [EmptyState, ProfileSection, AvailabilityPanel, DashboardAppointmentRow, StatCard],
  templateUrl: './doctor-dashboard.html',
  styleUrl: './doctor-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DoctorDashboard {
  private readonly dashboardService = inject(DoctorDashboardService);

  readonly doctor = this.dashboardService.getDoctor();
  readonly summary = this.dashboardService.getDashboardSummary();
  readonly availability = this.dashboardService.getAvailability();

  /** Already in clock order from the service; never re-sorted here. */
  readonly appointments = this.dashboardService.getTodayAppointments();

  readonly todayLabel = formatFullDayLabel(this.dashboardService.getToday());

  /**
   * Local copy of the published state, so the switch changes this page and
   * nothing else. Seeded from the service and re-seeded if that ever changes.
   */
  readonly isAvailableToday = linkedSignal(() => this.availability.isAvailableToday);

  readonly hasAppointments = computed(() => this.appointments.length > 0);

  readonly stats = computed<readonly Stat[]>(() => [
    { label: "Today's appointments", value: this.summary.todayCount, caption: this.todayLabel },
    { label: 'Upcoming appointments', value: this.summary.upcomingCount, caption: 'After today' },
    { label: 'Completed today', value: this.summary.completedTodayCount },
    {
      label: 'Available slots remaining',
      value: this.summary.availableSlotsRemaining,
      caption: 'Today',
    },
  ]);
}
