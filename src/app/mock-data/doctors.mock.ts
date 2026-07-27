import { LookupItem } from '@core/models/lookup-item.model';
import { City } from '@core/models/location.model';
import { Specialty } from '@core/models/specialty.model';
import { DoctorCardData } from '@core/models/doctor.model';
import { CITIES } from './locations.mock';
import { SPECIALTIES } from './specialties.mock';

/**
 * Phase 1 mock data — replaced by GET /api/doctors later.
 * Never import this directly from a component; go through DoctorService.
 */

/** Resolving by id keeps this file consistent with the location and specialty mocks. */
function byId<T extends LookupItem>(source: readonly T[], id: number, kind: string): T {
  const match = source.find((item) => item.id === id);
  if (!match) {
    throw new Error(`Mock data error: unknown ${kind} id ${id}`);
  }
  return match;
}

const specialty = (id: number): Specialty => byId(SPECIALTIES, id, 'specialty');
const city = (id: number): City => byId(CITIES, id, 'city');

export const DOCTORS: readonly DoctorCardData[] = [
  {
    id: 1,
    name: 'Dr. Asha Verma',
    primarySpecialty: specialty(1), // Cardiologist
    qualifications: 'MBBS, MD (Cardiology)',
    experienceYears: 14,
    rating: { value: 4.8, reviewCount: 212 },
    consultationFee: 700,
    practice: { hospitalName: 'Sanjeevani Heart Centre', city: city(101) }, // Deoria
    availability: { isAvailableToday: true },
    isVerified: true,
  },
  {
    id: 2,
    name: 'Dr. Rakesh Mishra',
    primarySpecialty: specialty(8), // General Physician
    qualifications: 'MBBS',
    experienceYears: 9,
    rating: { value: 4.4, reviewCount: 96 },
    consultationFee: 300,
    practice: { hospitalName: 'Deoria City Clinic', city: city(101) },
    availability: { isAvailableToday: true },
  },
  {
    id: 3,
    name: 'Dr. Sunita Yadav',
    primarySpecialty: specialty(9), // Gynecologist
    qualifications: 'MBBS, DGO',
    experienceYears: 17,
    rating: { value: 4.9, reviewCount: 341 },
    consultationFee: 600,
    practice: { hospitalName: 'Matru Chhaya Nursing Home', city: city(102) }, // Salempur
    availability: { isAvailableToday: false, nextSlotLabel: 'Tomorrow, 10:00 AM' },
    isVerified: true,
  },
  {
    id: 4,
    name: 'Dr. Imran Ansari',
    primarySpecialty: specialty(2), // Dentist
    qualifications: 'BDS, MDS',
    experienceYears: 7,
    rating: { value: 4.5, reviewCount: 74 },
    consultationFee: 350,
    practice: { hospitalName: 'Smile Care Dental', city: city(103) }, // Barhaj
    availability: { isAvailableToday: true },
  },
  {
    id: 5,
    name: 'Dr. Neha Tripathi',
    primarySpecialty: specialty(12), // Pediatrician
    qualifications: 'MBBS, MD (Pediatrics)',
    experienceYears: 11,
    rating: { value: 4.7, reviewCount: 158 },
    consultationFee: 450,
    practice: { hospitalName: 'Rudrapur Child Care', city: city(104) }, // Rudrapur
    availability: { isAvailableToday: false, nextSlotLabel: 'Monday, 09:30 AM' },
  },
  {
    id: 6,
    name: 'Dr. Vikram Singh',
    primarySpecialty: specialty(11), // Orthopedic
    qualifications: 'MBBS, MS (Ortho)',
    experienceYears: 20,
    rating: { value: 4.6, reviewCount: 287 },
    consultationFee: 800,
    practice: { hospitalName: 'Gorakhpur Bone & Joint Hospital', city: city(201) }, // Gorakhpur
    availability: { isAvailableToday: true },
    isVerified: true,
  },
  {
    id: 7,
    name: 'Dr. Priya Chaudhary',
    primarySpecialty: specialty(3), // Dermatologist
    qualifications: 'MBBS, MD (Dermatology)',
    experienceYears: 6,
    rating: { value: 4.3, reviewCount: 61 },
    consultationFee: 500,
    practice: { hospitalName: 'Skin & Aesthetics Clinic', city: city(201) },
    availability: { isAvailableToday: false, nextSlotLabel: 'Thursday, 05:00 PM' },
  },
  {
    id: 8,
    name: 'Dr. Anil Gupta',
    primarySpecialty: specialty(10), // Neurologist
    qualifications: 'MBBS, DM (Neurology)',
    experienceYears: 22,
    rating: { value: 4.9, reviewCount: 402 },
    consultationFee: 1000,
    practice: { hospitalName: 'Purvanchal Neuro Centre', city: city(202) }, // Bansgaon
    availability: { isAvailableToday: false, nextSlotLabel: 'Wednesday, 11:00 AM' },
    isVerified: true,
  },
  {
    id: 9,
    name: 'Dr. Farhan Khan',
    primarySpecialty: specialty(5), // ENT Specialist
    qualifications: 'MBBS, MS (ENT)',
    experienceYears: 8,
    rating: { value: 4.2, reviewCount: 53 },
    consultationFee: 400,
    practice: { hospitalName: 'Campierganj ENT Care', city: city(203) }, // Campierganj
    availability: { isAvailableToday: true },
  },
  {
    id: 10,
    name: 'Dr. Kavita Pandey',
    primarySpecialty: specialty(6), // Eye Specialist
    experienceYears: 12,
    rating: { value: 4.6, reviewCount: 133 },
    consultationFee: 450,
    practice: { hospitalName: 'Drishti Eye Hospital', city: city(204) }, // Sahjanwa
    availability: { isAvailableToday: true },
  },
  {
    id: 11,
    name: 'Dr. Mohan Lal Srivastava',
    primarySpecialty: specialty(8), // General Physician
    qualifications: 'MBBS, MD (Medicine)',
    experienceYears: 26,
    rating: { value: 4.7, reviewCount: 519 },
    consultationFee: 550,
    practice: { hospitalName: 'Gorakhpur General Hospital', city: city(201) },
    availability: { isAvailableToday: true },
    isVerified: true,
  },
  {
    id: 12,
    // Deliberately sparse: proves the card degrades when optional data is absent.
    name: 'Dr. Ritu Sahani',
    primarySpecialty: specialty(13), // Psychiatrist
    practice: { hospitalName: 'Mind Wellness Clinic', city: city(101) },
  },
];
