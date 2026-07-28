import { LookupItem } from '@core/models/lookup-item.model';
import { City, District } from '@core/models/location.model';
import { Rating } from '@core/models/rating.model';
import { Specialty } from '@core/models/specialty.model';
import { Hospital, OpeningHours, Weekday } from '@core/models/hospital.model';
import { CITIES, DISTRICTS } from './locations.mock';
import { SPECIALTIES } from './specialties.mock';
import { DOCTORS } from './doctors.mock';

/**
 * Phase 1 mock data — replaced by GET /api/hospitals later.
 * Never import this directly from a component; go through HospitalService.
 *
 * Same construction as doctors.mock.ts: ids are resolved against the location
 * and specialty mocks so they cannot drift, and anything derivable is derived
 * rather than authored twice (ADR-020). Here that is the district, which comes
 * from the city, and doctorCount, which comes from the doctors who list a
 * practice at this hospital.
 */

/** Resolving by id keeps this file consistent with the other mocks. */
function byId<T extends LookupItem>(source: readonly T[], id: number, kind: string): T {
  const match = source.find((item) => item.id === id);
  if (!match) {
    throw new Error(`Mock data error: unknown ${kind} id ${id}`);
  }
  return match;
}

const specialty = (id: number): Specialty => byId(SPECIALTIES, id, 'specialty');
const city = (id: number): City => byId(CITIES, id, 'city');

function districtOf(city: City): District {
  return byId(DISTRICTS, city.districtId, 'district');
}

const ALL_WEEK: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MON_TO_SAT: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MON_TO_FRI: readonly Weekday[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const STANDARD_HOURS: readonly OpeningHours[] = [
  { days: MON_TO_SAT, opensAt: '09:00 AM', closesAt: '08:00 PM' },
];

const CLINIC_HOURS: readonly OpeningHours[] = [
  { days: MON_TO_SAT, opensAt: '10:00 AM', closesAt: '02:00 PM' },
  { days: MON_TO_SAT, opensAt: '05:00 PM', closesAt: '08:00 PM' },
];

interface HospitalSeed {
  readonly id: number;
  readonly name: string;
  readonly cityId: number;
  readonly addressLine: string;
  readonly contactNumber: string;
  readonly description: string;
  readonly departmentIds: readonly number[];
  readonly facilities: readonly string[];
  readonly rating?: Rating;
  readonly openingHours?: readonly OpeningHours[];
  readonly isOpen24Hours?: boolean;
  readonly logoUrl?: string;
}

function buildHospital(seed: HospitalSeed): Hospital {
  const hospitalCity = city(seed.cityId);
  const isOpen24Hours = seed.isOpen24Hours ?? false;

  return {
    id: seed.id,
    name: seed.name,
    logoUrl: seed.logoUrl,
    rating: seed.rating,
    address: {
      line: seed.addressLine,
      city: hospitalCity,
      district: districtOf(hospitalCity),
    },
    departments: seed.departmentIds.map(specialty),
    // Derived: a hospital cannot disagree with the doctors who practise there.
    doctorCount: DOCTORS.filter((doctor) =>
      doctor.practices.some((practice) => practice.hospitalId === seed.id),
    ).length,
    openingHours: isOpen24Hours ? [] : (seed.openingHours ?? STANDARD_HOURS),
    isOpen24Hours,
    description: seed.description,
    facilities: seed.facilities,
    contactNumber: seed.contactNumber,
  };
}

const SEEDS: readonly HospitalSeed[] = [
  {
    id: 1,
    name: 'Sanjeevani Heart Centre',
    cityId: 101,
    addressLine: 'Civil Lines, near Collectorate, Deoria',
    contactNumber: '+91 5568 220145',
    description:
      'Dedicated cardiac care unit serving Deoria and the surrounding blocks. Runs a weekly low-cost hypertension screening clinic and keeps a cath lab on standby for emergencies.',
    departmentIds: [1, 8],
    facilities: ['Cath Lab', 'ICU', 'Pharmacy', 'Ambulance', 'Parking'],
    rating: { value: 4.7, reviewCount: 168 },
    openingHours: [{ days: ALL_WEEK, opensAt: '08:00 AM', closesAt: '09:00 PM' }],
  },
  {
    id: 2,
    name: 'Deoria City Clinic',
    cityId: 101,
    addressLine: 'Station Road, opposite Post Office, Deoria',
    contactNumber: '+91 5568 221876',
    description:
      'Neighbourhood clinic handling everyday illness, seasonal infection and long-term diabetes care, with a small in-house pathology counter.',
    departmentIds: [8, 4, 1],
    facilities: ['Pathology Lab', 'Pharmacy', 'Wheelchair Access'],
    rating: { value: 4.2, reviewCount: 94 },
    openingHours: CLINIC_HOURS,
  },
  {
    id: 3,
    name: 'Matru Chhaya Nursing Home',
    cityId: 102,
    addressLine: 'Hospital Road, Salempur',
    contactNumber: '+91 5568 245300',
    description:
      'Maternity and childcare nursing home that has served Salempur for over two decades. Round-the-clock labour room cover.',
    departmentIds: [9, 12],
    facilities: ['Labour Room', 'Operation Theatre', 'Neonatal Care', 'Ambulance', 'Pharmacy'],
    rating: { value: 4.8, reviewCount: 276 },
    isOpen24Hours: true,
  },
  {
    id: 4,
    name: 'Smile Care Dental',
    cityId: 103,
    addressLine: 'Main Market, Barhaj',
    contactNumber: '+91 5568 262410',
    description:
      'Dental practice offering routine and cosmetic treatment, with same-day slots kept aside for emergencies.',
    departmentIds: [2],
    facilities: ['Digital X-Ray', 'Sterilisation Unit', 'Parking'],
    rating: { value: 4.4, reviewCount: 61 },
    openingHours: [{ days: MON_TO_SAT, opensAt: '10:00 AM', closesAt: '07:00 PM' }],
  },
  {
    id: 5,
    name: 'Rudrapur Child Care',
    cityId: 104,
    addressLine: 'Bazaar Road, Rudrapur',
    contactNumber: '+91 5568 271055',
    description:
      'Paediatric centre covering newborn care through adolescence, with a busy immunisation clinic every Tuesday.',
    departmentIds: [12],
    facilities: ['Immunisation Clinic', 'Nebulisation Room', 'Pharmacy'],
    rating: { value: 4.6, reviewCount: 118 },
    openingHours: [{ days: MON_TO_SAT, opensAt: '09:30 AM', closesAt: '06:30 PM' }],
  },
  {
    id: 6,
    name: 'Mind Wellness Clinic',
    cityId: 101,
    addressLine: 'Kacheri Road, Deoria',
    contactNumber: '+91 5568 229940',
    description:
      'Counselling and psychiatric care for anxiety, depression and sleep disorders, with private consultation rooms.',
    departmentIds: [13],
    facilities: ['Counselling Rooms', 'Wheelchair Access'],
    openingHours: [{ days: MON_TO_FRI, opensAt: '11:00 AM', closesAt: '06:00 PM' }],
  },
  {
    id: 7,
    name: 'Gorakhpur Bone & Joint Hospital',
    cityId: 201,
    addressLine: 'Medical College Road, Gorakhpur',
    contactNumber: '+91 551 2334100',
    description:
      'Orthopaedic hospital specialising in joint replacement and sports injury, with an attached physiotherapy wing and trauma cover.',
    departmentIds: [11, 8],
    facilities: [
      'Operation Theatre',
      'Physiotherapy',
      'Digital X-Ray',
      'ICU',
      'Ambulance',
      'Parking',
    ],
    rating: { value: 4.6, reviewCount: 312 },
    isOpen24Hours: true,
  },
  {
    id: 8,
    name: 'Skin & Aesthetics Clinic',
    cityId: 201,
    addressLine: 'Golghar, Gorakhpur',
    contactNumber: '+91 551 2201788',
    description:
      'Dermatology and cosmetic practice treating acne, pigmentation and hair loss, with laser and peel facilities.',
    departmentIds: [3],
    facilities: ['Laser Room', 'Minor Procedure Room', 'Parking'],
    rating: { value: 4.3, reviewCount: 77 },
    openingHours: [{ days: MON_TO_SAT, opensAt: '11:00 AM', closesAt: '07:00 PM' }],
  },
  {
    id: 9,
    name: 'Purvanchal Neuro Centre',
    cityId: 202,
    addressLine: 'Bansgaon Main Road, Bansgaon',
    contactNumber: '+91 551 2456120',
    description:
      'Referral centre for neurology across Purvanchal, running a dedicated epilepsy clinic and stroke care unit.',
    departmentIds: [10, 8],
    facilities: ['EEG', 'ICU', 'Stroke Unit', 'Pharmacy', 'Ambulance'],
    rating: { value: 4.9, reviewCount: 389 },
    isOpen24Hours: true,
  },
  {
    id: 10,
    name: 'Campierganj ENT Care',
    cityId: 203,
    addressLine: 'Tehsil Road, Campierganj',
    contactNumber: '+91 551 2789045',
    description:
      'ENT practice handling sinus, hearing and throat conditions for adults and children, with audiometry on site.',
    departmentIds: [5],
    facilities: ['Audiometry', 'Minor Procedure Room', 'Pharmacy'],
    rating: { value: 4.1, reviewCount: 48 },
    openingHours: [{ days: MON_TO_SAT, opensAt: '10:00 AM', closesAt: '06:00 PM' }],
  },
  {
    id: 11,
    name: 'Drishti Eye Hospital',
    cityId: 204,
    addressLine: 'Sahjanwa Bypass, Sahjanwa',
    contactNumber: '+91 551 2812330',
    description:
      'High-volume cataract hospital that also runs free monthly screening camps in the surrounding villages.',
    departmentIds: [6],
    facilities: ['Operation Theatre', 'Optical Shop', 'Ambulance', 'Parking'],
    rating: { value: 4.5, reviewCount: 204 },
    openingHours: [{ days: MON_TO_SAT, opensAt: '09:00 AM', closesAt: '06:00 PM' }],
  },
  {
    id: 12,
    name: 'Gorakhpur General Hospital',
    cityId: 201,
    addressLine: 'Park Road, Gorakhpur',
    contactNumber: '+91 551 2205500',
    description:
      'Multi-speciality hospital and the largest private facility in the district, with emergency cover and most departments under one roof.',
    departmentIds: [8, 4, 10, 1, 11, 9, 12, 6],
    facilities: [
      'Emergency Department',
      'ICU',
      'Operation Theatre',
      'Pathology Lab',
      'Digital X-Ray',
      'Pharmacy',
      'Ambulance',
      'Blood Bank',
      'Parking',
      'Wheelchair Access',
    ],
    rating: { value: 4.4, reviewCount: 521 },
    isOpen24Hours: true,
  },
];

export const HOSPITALS: readonly Hospital[] = SEEDS.map(buildHospital);
