import { TestBed } from '@angular/core/testing';

import { AdminService } from './admin.service';
import { BookingService } from './booking.service';
import { DoctorService } from './doctor.service';
import { HospitalService } from './hospital.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(() => {
    service = TestBed.inject(AdminService);
  });

  it('owns no data — every list comes from the existing services', () => {
    expect(service.getDoctors()).toEqual(TestBed.inject(DoctorService).getDoctors());
    expect(service.getHospitals()).toEqual(TestBed.inject(HospitalService).getHospitals());
    expect(service.getAppointments()).toEqual(
      TestBed.inject(BookingService).getAppointmentHistory(),
    );
  });

  it('counts what those lists contain', () => {
    const summary = service.getSummary();

    expect(summary.totalDoctors).toBe(service.getDoctors().length);
    expect(summary.totalHospitals).toBe(service.getHospitals().length);
    expect(summary.totalAppointments).toBe(service.getAppointments().length);
  });

  it('counts active doctors as those available today', () => {
    const expected = service.getDoctors().filter((doctor) => service.isDoctorAvailable(doctor));

    expect(service.getSummary().activeDoctors).toBe(expected.length);
    expect(expected.length).toBeGreaterThan(0);
    expect(expected.length).toBeLessThan(service.getDoctors().length);
  });

  it('treats a doctor with no availability as not available', () => {
    const withoutAvailability = service
      .getDoctors()
      .find((doctor) => doctor.availability === undefined);

    expect(withoutAvailability).toBeTruthy();
    expect(service.isDoctorAvailable(withoutAvailability!)).toBe(false);
  });

  it('is read only — repeated reads do not change anything', () => {
    const first = service.getSummary();

    expect(service.getSummary()).toEqual(first);
  });
});
