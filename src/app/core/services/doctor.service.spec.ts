import { TestBed } from '@angular/core/testing';

import { DoctorService } from './doctor.service';
import { LocationService } from './location.service';
import { DoctorSearchCriteria } from '../models/doctor-search-criteria.model';

describe('DoctorService', () => {
  let service: DoctorService;
  let locations: LocationService;

  const criteria = (overrides: Partial<DoctorSearchCriteria> = {}): DoctorSearchCriteria => ({
    doctorName: '',
    specialty: null,
    state: locations.launchState,
    district: null,
    city: null,
    ...overrides,
  });

  beforeEach(() => {
    service = TestBed.inject(DoctorService);
    locations = TestBed.inject(LocationService);
  });

  it('returns every doctor for an empty search', () => {
    expect(service.search(criteria()).length).toBe(service.getDoctors().length);
  });

  it('matches names case-insensitively and partially', () => {
    const results = service.search(criteria({ doctorName: 'asha' }));

    expect(results.map((doctor) => doctor.name)).toEqual(['Dr. Asha Verma']);
  });

  it('filters by specialty', () => {
    const cardiologist = service.getDoctors()[0].primarySpecialty;
    const results = service.search(criteria({ specialty: cardiologist }));

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doctor) => doctor.primarySpecialty.id === cardiologist.id)).toBe(true);
  });

  it('filters by district', () => {
    const gorakhpur = locations.getDistricts()[1];
    const results = service.search(criteria({ district: gorakhpur }));

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doctor) => doctor.practice?.city.districtId === gorakhpur.id)).toBe(true);
  });

  it('filters by city', () => {
    const salempur = locations.getCities(1).find((city) => city.name === 'Salempur')!;
    const results = service.search(criteria({ city: salempur }));

    expect(results.length).toBeGreaterThan(0);
    expect(results.every((doctor) => doctor.practice?.city.id === salempur.id)).toBe(true);
  });

  it('combines criteria', () => {
    const deoria = locations.getDistricts()[0];
    const results = service.search(criteria({ doctorName: 'zzz', district: deoria }));

    expect(results).toEqual([]);
  });
});
