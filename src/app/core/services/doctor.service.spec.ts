import { TestBed } from '@angular/core/testing';

import { DoctorService } from './doctor.service';
import { HospitalService } from './hospital.service';
import { LocationService } from './location.service';
import { DoctorSearchCriteria } from '../models/doctor-search-criteria.model';
import { Doctor, DoctorCardData } from '../models/doctor.model';
import { DATA_AS_OF_YEAR } from '@mock-data/doctors.mock';
import { CITIES } from '@mock-data/locations.mock';
import { SPECIALTIES } from '@mock-data/specialties.mock';

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

  describe('getById', () => {
    it('returns the doctor with that id', () => {
      const doctor = service.getById(1);

      expect(doctor?.id).toBe(1);
      expect(doctor?.name).toBe('Dr. Asha Verma');
    });

    it('returns the full profile, not just card data', () => {
      const doctor = service.getById(1)!;

      expect(doctor.about.length).toBeGreaterThan(0);
      expect(doctor.education.length).toBeGreaterThan(0);
      expect(doctor.experience.length).toBeGreaterThan(0);
      expect(doctor.registrations.length).toBeGreaterThan(0);
      expect(doctor.languages.length).toBeGreaterThan(0);
      expect(doctor.services.length).toBeGreaterThan(0);
      expect(doctor.practices.length).toBeGreaterThan(0);
      expect(doctor.reviews.length).toBeGreaterThan(0);
      expect(doctor.ratingBreakdown).toBeTruthy();
    });

    it('finds every doctor the list exposes, so no card can link to a dead profile', () => {
      for (const listed of service.getDoctors()) {
        expect(service.getById(listed.id)?.id).toBe(listed.id);
      }
    });

    it('returns undefined for an unknown id', () => {
      expect(service.getById(9999)).toBeUndefined();
    });

    it('returns undefined for ids that are not real, without throwing', () => {
      expect(service.getById(0)).toBeUndefined();
      expect(service.getById(-1)).toBeUndefined();
      expect(service.getById(1.5)).toBeUndefined();
      expect(service.getById(Number.NaN)).toBeUndefined();
    });
  });

  describe('getByHospital', () => {
    it('returns the doctors who list a practice there', () => {
      const atClinic = service.getByHospital(2);

      expect(atClinic.map((doctor) => doctor.name)).toEqual([
        'Dr. Asha Verma',
        'Dr. Rakesh Mishra',
      ]);
    });

    it('includes a doctor whose second practice is at the hospital', () => {
      // Dr. Anil Gupta's primary practice is elsewhere; his Saturday clinic is here.
      expect(service.getByHospital(12).map((doctor) => doctor.name)).toContain('Dr. Anil Gupta');
    });

    it('returns an empty list for a hospital nobody practises at', () => {
      expect(service.getByHospital(9999)).toEqual([]);
    });

    it('returns narrow card data', () => {
      // @ts-expect-error a hospital's doctor list never carries profile detail.
      const asProfiles: readonly Doctor[] = service.getByHospital(2);

      expect(asProfiles.length).toBeGreaterThan(0);
    });
  });

  describe('search still returns narrow card data', () => {
    it('is assignable to DoctorCardData', () => {
      const results: readonly DoctorCardData[] = service.search(criteria());

      expect(results.length).toBeGreaterThan(0);
    });

    it('does not widen to the full Doctor aggregate', () => {
      // @ts-expect-error search must expose card data only; widening it breaks this build.
      const asProfiles: readonly Doctor[] = service.search(criteria());

      expect(asProfiles.length).toBeGreaterThan(0);
    });

    it('getDoctors is narrow too', () => {
      // @ts-expect-error list operations never hand out profile detail.
      const asProfiles: readonly Doctor[] = service.getDoctors();

      expect(asProfiles.length).toBeGreaterThan(0);
    });

    it('getById is the only source of the aggregate', () => {
      const profile: Doctor | undefined = service.getById(1);

      expect(profile).toBeTruthy();
    });
  });

  describe('existing search behaviour', () => {
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
      expect(results.every((doctor) => doctor.practice?.city.districtId === gorakhpur.id)).toBe(
        true,
      );
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

  /**
   * The card summary and the profile detail describe the same doctor, so they
   * must never contradict each other (ADR-020). Every card field below is
   * derived from profile detail when the mock is built; these tests are what
   * stop that derivation being quietly undone.
   */
  describe('mock data consistency between card data and profile data', () => {
    const profiles = (): readonly Doctor[] =>
      TestBed.inject(DoctorService)
        .getDoctors()
        .map((listed) => TestBed.inject(DoctorService).getById(listed.id)!);

    it('exposes at least one doctor per district so the demo is never empty', () => {
      expect(profiles().length).toBeGreaterThanOrEqual(12);
    });

    it('gives every doctor a unique id', () => {
      const ids = profiles().map((doctor) => doctor.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('always satisfies the required card fields', () => {
      for (const doctor of profiles()) {
        expect(doctor.id).toBeGreaterThan(0);
        expect(doctor.name.length).toBeGreaterThan(0);
        expect(doctor.primarySpecialty).toBeTruthy();
      }
    });

    it('uses the first specialty as the card specialty', () => {
      for (const doctor of profiles()) {
        expect(doctor.primarySpecialty).toBe(doctor.specialties[0]);
      }
    });

    it('uses the first practice as the card practice', () => {
      for (const doctor of profiles()) {
        expect(doctor.practice).toBe(doctor.practices[0]);
      }
    });

    it('summarises the education list into the card qualifications line', () => {
      for (const doctor of profiles()) {
        const expected = doctor.education.length
          ? doctor.education.map((entry) => entry.degree).join(', ')
          : undefined;

        expect(doctor.qualifications).toBe(expected);
      }
    });

    it('takes the card fee from the primary practice', () => {
      for (const doctor of profiles()) {
        expect(doctor.consultationFee).toBe(doctor.practices[0].consultationFee);
      }
    });

    it('derives experience years from the earliest role', () => {
      for (const doctor of profiles()) {
        if (!doctor.experience.length) {
          expect(doctor.experienceYears).toBeUndefined();
          continue;
        }

        const earliest = Math.min(...doctor.experience.map((entry) => entry.fromYear));
        expect(doctor.experienceYears).toBe(DATA_AS_OF_YEAR - earliest);
      }
    });

    it('derives the card rating from the star breakdown', () => {
      for (const doctor of profiles()) {
        if (!doctor.ratingBreakdown) {
          expect(doctor.rating).toBeUndefined();
          continue;
        }

        const stars = [5, 4, 3, 2, 1] as const;
        const count = stars.reduce((sum, star) => sum + doctor.ratingBreakdown![star], 0);
        const points = stars.reduce((sum, star) => sum + star * doctor.ratingBreakdown![star], 0);

        expect(doctor.rating?.reviewCount).toBe(count);
        expect(doctor.rating?.value).toBe(Math.round((points / count) * 10) / 10);
        expect(doctor.rating?.value).toBeGreaterThanOrEqual(1);
        expect(doctor.rating?.value).toBeLessThanOrEqual(5);
      }
    });

    it('never writes more reviews than there are ratings', () => {
      for (const doctor of profiles()) {
        expect(doctor.reviews.length).toBeLessThanOrEqual(doctor.rating?.reviewCount ?? 0);
      }
    });

    it('keeps every review well formed', () => {
      const ids = profiles().flatMap((doctor) => doctor.reviews.map((review) => review.id));

      for (const doctor of profiles()) {
        for (const review of doctor.reviews) {
          expect(review.rating).toBeGreaterThanOrEqual(1);
          expect(review.rating).toBeLessThanOrEqual(5);
          expect(review.comment.length).toBeGreaterThan(0);
          expect(review.visitedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        }
      }

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('references only specialties and cities that exist', () => {
      for (const doctor of profiles()) {
        for (const item of doctor.specialties) {
          expect(SPECIALTIES).toContain(item);
        }
        for (const practice of doctor.practices) {
          expect(CITIES).toContain(practice.city);
        }
      }
    });

    it('gives every practice usable display timings', () => {
      for (const doctor of profiles()) {
        for (const practice of doctor.practices) {
          expect(practice.addressLine.length).toBeGreaterThan(0);
          expect(practice.timings.length).toBeGreaterThan(0);

          for (const timing of practice.timings) {
            expect(timing.days.length).toBeGreaterThan(0);
            expect(timing.opensAt.length).toBeGreaterThan(0);
            expect(timing.closesAt.length).toBeGreaterThan(0);
          }
        }
      }
    });

    it('keeps education and experience in a sane order', () => {
      for (const doctor of profiles()) {
        for (const entry of doctor.experience) {
          expect(entry.fromYear).toBeLessThanOrEqual(entry.toYear ?? DATA_AS_OF_YEAR);
          expect(entry.toYear ?? DATA_AS_OF_YEAR).toBeLessThanOrEqual(DATA_AS_OF_YEAR);
        }
        for (const entry of doctor.education) {
          expect(entry.year).toBeLessThanOrEqual(DATA_AS_OF_YEAR);
        }
      }
    });
  });
});

describe('DoctorService.addDoctor', () => {
  let service: DoctorService;
  let hospitals: HospitalService;

  const draft = (overrides: Partial<Parameters<DoctorService['addDoctor']>[0]> = {}) => {
    const hospital = hospitals.getById(1)!;
    return {
      name: 'Dr. New Doctor',
      specialty: hospital.departments[0],
      hospital,
      isAvailableToday: true,
      ...overrides,
    };
  };

  beforeEach(() => {
    service = TestBed.inject(DoctorService);
    hospitals = TestBed.inject(HospitalService);
  });

  it('adds the doctor with an id that continues the sequence', () => {
    const highest = Math.max(...service.getDoctors().map((doctor) => doctor.id));

    const created = service.addDoctor(draft());

    expect(created.id).toBe(highest + 1);
    expect(service.getById(created.id)).toBe(created);
  });

  it('assigns the doctor to the selected hospital and specialty', () => {
    const hospital = hospitals.getById(1)!;

    const created = service.addDoctor(draft());

    expect(created.primarySpecialty).toBe(hospital.departments[0]);
    expect(created.practices[0].hospitalId).toBe(hospital.id);
    expect(created.practice?.city).toBe(hospital.address.city);
    expect(service.getByHospital(hospital.id)).toContain(created);
  });

  it('trims the name and keeps optional fields only when given', () => {
    const created = service.addDoctor(
      draft({ name: '  Dr. New Doctor  ', qualifications: '  MBBS  ', email: '' }),
    );

    expect(created.name).toBe('Dr. New Doctor');
    expect(created.qualifications).toBe('MBBS');
    expect(created.email).toBeUndefined();
  });

  it('records availability and leaves unverifiable detail empty', () => {
    const created = service.addDoctor(draft({ isAvailableToday: false }));

    expect(created.availability).toEqual({ isAvailableToday: false });
    expect(created.education).toEqual([]);
    expect(created.registrations).toEqual([]);
    expect(created.reviews).toEqual([]);
    expect(created.rating).toBeUndefined();
  });

  it('is immediately visible to search and the reactive view', () => {
    const created = service.addDoctor(draft({ name: 'Dr. Unique Person' }));

    expect(service.doctors()).toContain(created);
    expect(
      service.search({
        doctorName: 'unique person',
        specialty: null,
        state: TestBed.inject(LocationService).launchState,
        district: null,
        city: null,
      }),
    ).toEqual([created]);
  });

  it('moves the hospital doctor count it was assigned to', () => {
    const before = hospitals.getById(1)!.doctorCount;

    service.addDoctor(draft());

    expect(hospitals.getById(1)!.doctorCount).toBe(before + 1);
  });
});
