import { Injectable, computed, signal } from '@angular/core';
import { Doctor, DoctorCardData, DoctorPracticeDetail } from '../models/doctor.model';
import { Hospital } from '../models/hospital.model';
import { Specialty } from '../models/specialty.model';
import { DoctorSearchCriteria } from '../models/doctor-search-criteria.model';
import { DOCTORS } from '@mock-data/doctors.mock';

/**
 * Single access point for doctor data.
 * Backed by mock data during Phase 1 (ADR-008); `search` becomes
 * POST /api/doctors/search without the caller changing.
 *
 * List operations return the narrow DoctorCardData and detail returns the full
 * Doctor (ADR-020). The mock holds one object either way, so the narrowing is
 * a compile-time contract; the real API will genuinely send a smaller payload.
 */
/** What the admin registration form collects (ADR-037). */
export interface DoctorDraft {
  readonly name: string;
  /** Must be one of the hospital's configured departments. */
  readonly specialty: Specialty;
  readonly hospital: Hospital;
  readonly experienceYears?: number;
  readonly qualifications?: string;
  readonly consultationFee?: number;
  readonly contactNumber?: string;
  readonly email?: string;
  readonly biography?: string;
  readonly isAvailableToday: boolean;
}

@Injectable({ providedIn: 'root' })
export class DoctorService {
  /**
   * The live list, seeded from the mock — the same shape HospitalService uses
   * (ADR-035), so a doctor registered by an admin is visible to every reader.
   */
  private readonly store = signal<readonly Doctor[]>(DOCTORS);

  /** Reactive view for pages that must follow additions. */
  readonly doctors = computed<readonly DoctorCardData[]>(() => this.store());

  private all(): readonly Doctor[] {
    return this.store();
  }

  /**
   * Registers a doctor against one hospital and one of its departments.
   *
   * In memory only, like every other admin write. The practice is built from the
   * hospital, so the doctor is immediately returned by getByHospital and counted
   * into that hospital's doctorCount (ADR-037).
   *
   * Education, registrations, reviews and languages start empty: the form does
   * not collect them, and inventing them would put unverified credentials on a
   * public profile.
   */
  addDoctor(draft: DoctorDraft): Doctor {
    const practice: DoctorPracticeDetail = {
      hospitalId: draft.hospital.id,
      hospitalName: draft.hospital.name,
      city: draft.hospital.address.city,
      addressLine: draft.hospital.address.line,
      consultationFee: draft.consultationFee,
      timings: [],
    };

    const doctor: Doctor = {
      id: this.nextId(),
      name: draft.name.trim(),
      primarySpecialty: draft.specialty,
      qualifications: draft.qualifications?.trim() || undefined,
      experienceYears: draft.experienceYears,
      consultationFee: draft.consultationFee,
      practice,
      availability: { isAvailableToday: draft.isAvailableToday },
      about: draft.biography?.trim() ?? '',
      specialties: [draft.specialty],
      education: [],
      experience: [],
      registrations: [],
      languages: [],
      services: [],
      practices: [practice],
      reviews: [],
      contactNumber: draft.contactNumber?.trim() || undefined,
      email: draft.email?.trim() || undefined,
    };

    this.store.update((doctors) => [...doctors, doctor]);
    return doctor;
  }

  private nextId(): number {
    return this.all().reduce((highest, doctor) => Math.max(highest, doctor.id), 0) + 1;
  }

  getDoctors(): readonly DoctorCardData[] {
    return this.all();
  }

  /** The full profile. Undefined for an unknown id — callers render not-found. */
  getById(id: number): Doctor | undefined {
    return this.all().find((doctor) => doctor.id === id);
  }

  /**
   * Doctors listing a practice at this hospital.
   *
   * Card data, so a hospital profile can hand these straight to DoctorCard
   * rather than growing a doctor list of its own.
   */
  getByHospital(hospitalId: number): readonly DoctorCardData[] {
    return this.all().filter((doctor) =>
      doctor.practices.some((practice) => practice.hospitalId === hospitalId),
    );
  }

  /**
   * Every criterion is optional and narrows the result set.
   * State is not filtered on — the MVP is single-state (ADR-004).
   */
  search(criteria: DoctorSearchCriteria): readonly DoctorCardData[] {
    const name = criteria.doctorName.trim().toLowerCase();

    return this.all().filter((doctor) => {
      if (name && !doctor.name.toLowerCase().includes(name)) {
        return false;
      }
      if (criteria.specialty && doctor.primarySpecialty.id !== criteria.specialty.id) {
        return false;
      }
      if (criteria.district && doctor.practice?.city.districtId !== criteria.district.id) {
        return false;
      }
      if (criteria.city && doctor.practice?.city.id !== criteria.city.id) {
        return false;
      }
      return true;
    });
  }
}
