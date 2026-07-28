import { TestBed } from '@angular/core/testing';

import { HospitalService } from './hospital.service';
import { DoctorService } from './doctor.service';
import { LocationService } from './location.service';
import { SpecialtyService } from './specialty.service';
import { HospitalSearchCriteria } from '../models/hospital-search-criteria.model';
import { Hospital, HospitalCardData, WEEKDAYS, Weekday } from '../models/hospital.model';
import { CITIES, DISTRICTS } from '@mock-data/locations.mock';
import { SPECIALTIES } from '@mock-data/specialties.mock';

describe('HospitalService', () => {
  let service: HospitalService;
  let doctors: DoctorService;
  let locations: LocationService;
  let specialties: SpecialtyService;

  const criteria = (overrides: Partial<HospitalSearchCriteria> = {}): HospitalSearchCriteria => ({
    hospitalName: '',
    state: locations.launchState,
    district: null,
    city: null,
    specialty: null,
    ...overrides,
  });

  const profiles = (): readonly Hospital[] =>
    service.getHospitals().map((listed) => service.getById(listed.id)!);

  beforeEach(() => {
    service = TestBed.inject(HospitalService);
    doctors = TestBed.inject(DoctorService);
    locations = TestBed.inject(LocationService);
    specialties = TestBed.inject(SpecialtyService);
  });

  describe('getById', () => {
    it('returns the hospital with that id', () => {
      const hospital = service.getById(1);

      expect(hospital?.id).toBe(1);
      expect(hospital?.name).toBe('Sanjeevani Heart Centre');
    });

    it('returns the full profile, not just card data', () => {
      const hospital = service.getById(12)!;

      expect(hospital.description.length).toBeGreaterThan(0);
      expect(hospital.facilities.length).toBeGreaterThan(0);
      expect(hospital.contactNumber.length).toBeGreaterThan(0);
      expect(hospital.departments.length).toBeGreaterThan(0);
    });

    it('finds every hospital the list exposes', () => {
      for (const listed of service.getHospitals()) {
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

  describe('list operations return narrow card data', () => {
    it('is assignable to HospitalCardData', () => {
      const results: readonly HospitalCardData[] = service.search(criteria());

      expect(results.length).toBeGreaterThan(0);
    });

    it('does not widen search to the full Hospital aggregate', () => {
      // @ts-expect-error search must expose card data only; widening it breaks this build.
      const asProfiles: readonly Hospital[] = service.search(criteria());

      expect(asProfiles.length).toBeGreaterThan(0);
    });

    it('does not widen getHospitals either', () => {
      // @ts-expect-error list operations never hand out profile detail.
      const asProfiles: readonly Hospital[] = service.getHospitals();

      expect(asProfiles.length).toBeGreaterThan(0);
    });
  });

  describe('search', () => {
    it('returns every hospital for an empty search', () => {
      expect(service.search(criteria()).length).toBe(service.getHospitals().length);
    });

    it('matches names case-insensitively and partially', () => {
      const results = service.search(criteria({ hospitalName: 'drishti' }));

      expect(results.map((hospital) => hospital.name)).toEqual(['Drishti Eye Hospital']);
    });

    it('trims the name before matching', () => {
      expect(service.search(criteria({ hospitalName: '   drishti   ' })).length).toBe(1);
    });

    it('filters by district', () => {
      const gorakhpur = locations.getDistricts()[1];
      const results = service.search(criteria({ district: gorakhpur }));

      expect(results.length).toBeGreaterThan(0);
      expect(results.every((hospital) => hospital.address.district.id === gorakhpur.id)).toBe(true);
    });

    it('filters by city', () => {
      const salempur = locations.getCities(1).find((city) => city.name === 'Salempur')!;
      const results = service.search(criteria({ city: salempur }));

      expect(results.map((hospital) => hospital.name)).toEqual(['Matru Chhaya Nursing Home']);
    });

    it('filters by department', () => {
      const cardiology = specialties.getSpecialties().find((item) => item.name === 'Cardiologist')!;
      const results = service.search(criteria({ specialty: cardiology }));

      expect(results.length).toBeGreaterThan(0);
      expect(
        results.every((hospital) =>
          hospital.departments.some((department) => department.id === cardiology.id),
        ),
      ).toBe(true);
    });

    it('combines criteria', () => {
      const deoria = locations.getDistricts()[0];

      expect(service.search(criteria({ hospitalName: 'zzz', district: deoria }))).toEqual([]);
    });

    it('returns nothing when the city and district disagree', () => {
      const gorakhpur = locations.getDistricts()[1];
      const deoriaCity = locations.getCities(1)[0];

      expect(service.search(criteria({ district: gorakhpur, city: deoriaCity }))).toEqual([]);
    });
  });

  describe('isOpenOn', () => {
    it('is always open for a round-the-clock hospital', () => {
      const generalHospital = service.getById(12)!;
      expect(generalHospital.isOpen24Hours).toBe(true);

      for (const weekday of WEEKDAYS) {
        expect(service.isOpenOn(generalHospital, weekday)).toBe(true);
      }
    });

    it('follows the opening windows for everyone else', () => {
      const clinic = service.getById(6)!; // Mon – Fri only
      expect(clinic.isOpen24Hours).toBe(false);

      expect(service.isOpenOn(clinic, 'Mon')).toBe(true);
      expect(service.isOpenOn(clinic, 'Fri')).toBe(true);
      expect(service.isOpenOn(clinic, 'Sat')).toBe(false);
      expect(service.isOpenOn(clinic, 'Sun')).toBe(false);
    });

    it('is open on a day covered by any one window', () => {
      const twoWindowClinic = service.getById(2)!;
      expect(twoWindowClinic.openingHours.length).toBe(2);

      expect(service.isOpenOn(twoWindowClinic, 'Mon')).toBe(true);
      expect(service.isOpenOn(twoWindowClinic, 'Sun')).toBe(false);
    });

    it('answers for every hospital and every weekday without throwing', () => {
      for (const hospital of service.getHospitals()) {
        for (const weekday of WEEKDAYS) {
          expect(typeof service.isOpenOn(hospital, weekday)).toBe('boolean');
        }
      }
    });
  });

  /**
   * The hospital mock, the location mock, the specialty mock and the doctor mock
   * all describe the same world, so they must not contradict each other
   * (ADR-020). These are the tests that stop the derivations being undone.
   */
  describe('mock data integrity', () => {
    it('gives every hospital a unique id', () => {
      const ids = service.getHospitals().map((hospital) => hospital.id);

      expect(new Set(ids).size).toBe(ids.length);
    });

    it('gives every hospital the fields a card needs', () => {
      for (const hospital of service.getHospitals()) {
        expect(hospital.id).toBeGreaterThan(0);
        expect(hospital.name.length).toBeGreaterThan(0);
        expect(hospital.departments.length).toBeGreaterThan(0);
        expect(hospital.address.line.length).toBeGreaterThan(0);
      }
    });

    it('references only cities and specialties that exist', () => {
      for (const hospital of profiles()) {
        expect(CITIES).toContain(hospital.address.city);

        for (const department of hospital.departments) {
          expect(SPECIALTIES).toContain(department);
        }
      }
    });

    it('derives the district from the city', () => {
      for (const hospital of profiles()) {
        const expected = DISTRICTS.find(
          (district) => district.id === hospital.address.city.districtId,
        );

        expect(hospital.address.district).toBe(expected);
      }
    });

    it('counts the doctors who actually list a practice there', () => {
      for (const hospital of service.getHospitals()) {
        expect(hospital.doctorCount).toBe(doctors.getByHospital(hospital.id).length);
      }
    });

    it('accounts for every doctor practice with a real hospital', () => {
      for (const listed of doctors.getDoctors()) {
        const doctor = doctors.getById(listed.id)!;

        for (const practice of doctor.practices) {
          expect(service.getById(practice.hospitalId)).toBeTruthy();
        }
      }
    });

    it('keeps a practice and its hospital in the same place under the same name', () => {
      for (const listed of doctors.getDoctors()) {
        const doctor = doctors.getById(listed.id)!;

        for (const practice of doctor.practices) {
          const hospital = service.getById(practice.hospitalId)!;

          expect(practice.hospitalName).toBe(hospital.name);
          expect(practice.city).toBe(hospital.address.city);
          expect(practice.addressLine).toBe(hospital.address.line);
        }
      }
    });

    it('runs a department for every specialty its doctors practise', () => {
      for (const hospital of service.getHospitals()) {
        const departmentIds = hospital.departments.map((department) => department.id);

        for (const doctor of doctors.getByHospital(hospital.id)) {
          expect(departmentIds).toContain(doctor.primarySpecialty.id);
        }
      }
    });

    it('gives round-the-clock hospitals no opening windows, and everyone else some', () => {
      for (const hospital of service.getHospitals()) {
        if (hospital.isOpen24Hours) {
          expect(hospital.openingHours).toEqual([]);
        } else {
          expect(hospital.openingHours.length).toBeGreaterThan(0);
        }
      }
    });

    it('keeps every opening window well formed', () => {
      for (const hospital of service.getHospitals()) {
        for (const window of hospital.openingHours) {
          expect(window.days.length).toBeGreaterThan(0);
          expect(new Set(window.days).size).toBe(window.days.length);
          expect(window.opensAt.length).toBeGreaterThan(0);
          expect(window.closesAt.length).toBeGreaterThan(0);

          for (const day of window.days) {
            expect(WEEKDAYS).toContain(day as Weekday);
          }
        }
      }
    });

    it('keeps ratings inside the possible range', () => {
      for (const hospital of service.getHospitals()) {
        if (!hospital.rating) {
          continue;
        }

        expect(hospital.rating.value).toBeGreaterThanOrEqual(1);
        expect(hospital.rating.value).toBeLessThanOrEqual(5);
        expect(hospital.rating.reviewCount).toBeGreaterThan(0);
      }
    });

    it('gives every hospital a contact number and a description', () => {
      for (const hospital of profiles()) {
        expect(hospital.contactNumber).toMatch(/^\+91 /);
        expect(hospital.description.length).toBeGreaterThan(20);
      }
    });

    it('covers both launch districts, so the demo is never empty', () => {
      for (const district of locations.getDistricts()) {
        expect(service.search(criteria({ district })).length).toBeGreaterThan(0);
      }
    });
  });
});
