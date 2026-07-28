import { LookupItem } from '@core/models/lookup-item.model';
import { City } from '@core/models/location.model';
import { Specialty } from '@core/models/specialty.model';
import {
  Doctor,
  DoctorAvailability,
  DoctorPracticeDetail,
  DoctorRating,
  PracticeTiming,
  Qualification,
  RatingBreakdown,
  Registration,
} from '@core/models/doctor.model';
import { CITIES } from './locations.mock';
import { SPECIALTIES } from './specialties.mock';
import { DOCTOR_REVIEWS } from './doctor-reviews.mock';

/**
 * Phase 1 mock data — replaced by GET /api/doctors later.
 * Never import this directly from a component; go through DoctorService.
 *
 * Card-level fields are derived from profile detail rather than authored twice
 * (ADR-020): primarySpecialty, qualifications, consultationFee, practice,
 * rating and experienceYears all come out of the profile below. That is what
 * makes it impossible for a doctor's card to contradict their profile.
 */

/** Fixed "today" for the mock. Never use the real date — it would go stale and break tests. */
export const DATA_AS_OF_YEAR = 2026;

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

const upmc = (registrationNumber: string, year: number): Registration => ({
  council: 'Uttar Pradesh Medical Council',
  registrationNumber,
  year,
});

const MORNING_AND_EVENING: readonly PracticeTiming[] = [
  { days: 'Mon – Sat', opensAt: '10:00 AM', closesAt: '02:00 PM' },
  { days: 'Mon – Sat', opensAt: '05:00 PM', closesAt: '08:00 PM' },
];

const WEEKDAY_EVENINGS: readonly PracticeTiming[] = [
  { days: 'Mon – Fri', opensAt: '06:00 PM', closesAt: '09:00 PM' },
];

const DEFAULT_LANGUAGES: readonly string[] = ['Hindi', 'English'];

/** Plausible service lists so twelve profiles do not repeat the same three lines. */
const SERVICES_BY_SPECIALTY: Readonly<Record<number, readonly string[]>> = {
  1: ['ECG', 'Echocardiography', 'Angioplasty', 'Hypertension Management'],
  2: ['Root Canal Treatment', 'Dental Implants', 'Teeth Whitening', 'Braces'],
  3: ['Acne Treatment', 'Skin Allergy Testing', 'Hair Loss Treatment', 'Chemical Peels'],
  5: ['Tonsillectomy', 'Sinus Treatment', 'Hearing Assessment', 'Vertigo Management'],
  6: ['Cataract Surgery', 'Glaucoma Screening', 'Retina Check-up', 'Spectacle Prescription'],
  8: ['General Consultation', 'Diabetes Management', 'Fever & Infection Care', 'Health Check-up'],
  9: ['Antenatal Care', 'Normal & Caesarean Delivery', 'PCOS Treatment', 'Infertility Counselling'],
  10: ['EEG', 'Epilepsy Management', 'Stroke Care', 'Headache & Migraine Clinic'],
  11: ['Knee Replacement', 'Fracture Management', 'Arthroscopy', 'Spine Consultation'],
  12: ['Child Immunisation', 'Growth Monitoring', 'Newborn Care', 'Nutrition Counselling'],
  13: ['Counselling', 'Anxiety & Depression Treatment', 'Sleep Disorder Management'],
};

interface PracticeSeed {
  readonly hospitalName: string;
  readonly cityId: number;
  readonly addressLine: string;
  readonly consultationFee?: number;
  readonly timings?: readonly PracticeTiming[];
}

interface DoctorSeed {
  readonly id: number;
  readonly name: string;
  /** Primary first. */
  readonly specialtyIds: readonly number[];
  readonly about: string;
  readonly practices: readonly PracticeSeed[];
  readonly education?: readonly Qualification[];
  readonly experience?: readonly {
    role: string;
    organisation: string;
    fromYear: number;
    toYear?: number;
  }[];
  readonly registrations?: readonly Registration[];
  readonly languages?: readonly string[];
  readonly services?: readonly string[];
  readonly ratingBreakdown?: RatingBreakdown;
  readonly availability?: DoctorAvailability;
  readonly isVerified?: boolean;
  readonly photoUrl?: string;
}

/** Summary rating comes from the star distribution, so the two cannot disagree. */
function toRating(breakdown: RatingBreakdown): DoctorRating {
  const stars = [5, 4, 3, 2, 1] as const;
  const reviewCount = stars.reduce((sum, star) => sum + breakdown[star], 0);
  const points = stars.reduce((sum, star) => sum + star * breakdown[star], 0);

  return { value: Math.round((points / reviewCount) * 10) / 10, reviewCount };
}

function buildDoctor(seed: DoctorSeed): Doctor {
  const specialties = seed.specialtyIds.map(specialty);
  const education = seed.education ?? [];
  const experience = seed.experience ?? [];

  const practices: readonly DoctorPracticeDetail[] = seed.practices.map((practice) => ({
    hospitalName: practice.hospitalName,
    city: city(practice.cityId),
    addressLine: practice.addressLine,
    consultationFee: practice.consultationFee,
    timings: practice.timings ?? MORNING_AND_EVENING,
  }));

  const earliestYear = experience.length
    ? Math.min(...experience.map((entry) => entry.fromYear))
    : undefined;

  return {
    id: seed.id,
    name: seed.name,
    photoUrl: seed.photoUrl,
    availability: seed.availability,
    isVerified: seed.isVerified,

    // --- Derived from the profile detail below. ---
    primarySpecialty: specialties[0],
    qualifications: education.length
      ? education.map((entry) => entry.degree).join(', ')
      : undefined,
    experienceYears: earliestYear === undefined ? undefined : DATA_AS_OF_YEAR - earliestYear,
    rating: seed.ratingBreakdown ? toRating(seed.ratingBreakdown) : undefined,
    consultationFee: practices[0].consultationFee,
    practice: practices[0],

    // --- Profile detail. ---
    about: seed.about,
    specialties,
    education,
    experience,
    registrations: seed.registrations ?? [],
    languages: seed.languages ?? DEFAULT_LANGUAGES,
    services: seed.services ?? SERVICES_BY_SPECIALTY[seed.specialtyIds[0]] ?? [],
    practices,
    reviews: DOCTOR_REVIEWS[seed.id] ?? [],
    ratingBreakdown: seed.ratingBreakdown,
  };
}

const SEEDS: readonly DoctorSeed[] = [
  {
    id: 1,
    name: 'Dr. Asha Verma',
    specialtyIds: [1],
    about:
      'Interventional cardiologist with a focus on preventive heart care. Believes most cardiac events in eastern UP are avoidable with earlier screening, and runs a weekly low-cost hypertension clinic on that basis.',
    education: [
      { degree: 'MBBS', institute: 'King George Medical University, Lucknow', year: 2006 },
      { degree: 'MD (Cardiology)', institute: 'SGPGI, Lucknow', year: 2011 },
    ],
    experience: [
      {
        role: 'Registrar, Cardiology',
        organisation: 'SGPGI, Lucknow',
        fromYear: 2012,
        toYear: 2016,
      },
      { role: 'Consultant Cardiologist', organisation: 'Sanjeevani Heart Centre', fromYear: 2016 },
    ],
    registrations: [upmc('UPMC/2006/41287', 2006)],
    languages: ['Hindi', 'English', 'Bhojpuri'],
    ratingBreakdown: { 5: 180, 4: 25, 3: 5, 2: 1, 1: 1 },
    availability: { isAvailableToday: true },
    isVerified: true,
    practices: [
      {
        hospitalName: 'Sanjeevani Heart Centre',
        cityId: 101,
        addressLine: 'Civil Lines, near Collectorate, Deoria',
        consultationFee: 700,
      },
      {
        hospitalName: 'Deoria City Clinic',
        cityId: 101,
        addressLine: 'Station Road, Deoria',
        consultationFee: 500,
        timings: WEEKDAY_EVENINGS,
      },
    ],
  },
  {
    id: 2,
    name: 'Dr. Rakesh Mishra',
    specialtyIds: [8],
    about:
      'General physician handling everyday illness, seasonal infection and long-term diabetes care for families across Deoria town.',
    education: [{ degree: 'MBBS', institute: 'BRD Medical College, Gorakhpur', year: 2013 }],
    experience: [
      {
        role: 'Junior Resident',
        organisation: 'BRD Medical College',
        fromYear: 2017,
        toYear: 2019,
      },
      { role: 'Consultant Physician', organisation: 'Deoria City Clinic', fromYear: 2019 },
    ],
    registrations: [upmc('UPMC/2013/58104', 2013)],
    ratingBreakdown: { 5: 60, 4: 24, 3: 8, 2: 2, 1: 2 },
    availability: { isAvailableToday: true },
    practices: [
      {
        hospitalName: 'Deoria City Clinic',
        cityId: 101,
        addressLine: 'Station Road, opposite Post Office, Deoria',
        consultationFee: 300,
      },
    ],
  },
  {
    id: 3,
    name: 'Dr. Sunita Yadav',
    specialtyIds: [9],
    about:
      'Obstetrician and gynaecologist who has delivered over four thousand babies in Salempur and the surrounding villages. Particular interest in reducing avoidable caesareans through better antenatal monitoring.',
    education: [
      { degree: 'MBBS', institute: 'Motilal Nehru Medical College, Prayagraj', year: 2003 },
      { degree: 'DGO', institute: 'Motilal Nehru Medical College, Prayagraj', year: 2007 },
    ],
    experience: [
      { role: 'Medical Officer', organisation: 'CHC Salempur', fromYear: 2009, toYear: 2014 },
      { role: 'Senior Consultant', organisation: 'Matru Chhaya Nursing Home', fromYear: 2014 },
    ],
    registrations: [upmc('UPMC/2003/31996', 2003)],
    languages: ['Hindi', 'Bhojpuri', 'English'],
    ratingBreakdown: { 5: 315, 4: 20, 3: 4, 2: 1, 1: 1 },
    availability: { isAvailableToday: false, nextSlotLabel: 'Tomorrow, 10:00 AM' },
    isVerified: true,
    practices: [
      {
        hospitalName: 'Matru Chhaya Nursing Home',
        cityId: 102,
        addressLine: 'Hospital Road, Salempur',
        consultationFee: 600,
      },
    ],
  },
  {
    id: 4,
    name: 'Dr. Imran Ansari',
    specialtyIds: [2],
    about: 'Dental surgeon offering routine and cosmetic dentistry, with same-day emergency slots.',
    education: [
      { degree: 'BDS', institute: 'Career Dental College, Lucknow', year: 2015 },
      { degree: 'MDS', institute: 'Career Dental College, Lucknow', year: 2018 },
    ],
    experience: [{ role: 'Dental Surgeon', organisation: 'Smile Care Dental', fromYear: 2019 }],
    registrations: [upmc('UPMC/2015/66432', 2015)],
    ratingBreakdown: { 5: 48, 4: 19, 3: 5, 2: 1, 1: 1 },
    availability: { isAvailableToday: true },
    practices: [
      {
        hospitalName: 'Smile Care Dental',
        cityId: 103,
        addressLine: 'Main Market, Barhaj',
        consultationFee: 350,
      },
    ],
  },
  {
    id: 5,
    name: 'Dr. Neha Tripathi',
    specialtyIds: [12],
    about:
      'Paediatrician covering newborn care through adolescence, with a busy immunisation clinic every Tuesday.',
    education: [
      { degree: 'MBBS', institute: 'BRD Medical College, Gorakhpur', year: 2010 },
      { degree: 'MD (Pediatrics)', institute: 'IMS BHU, Varanasi', year: 2014 },
    ],
    experience: [
      { role: 'Senior Resident', organisation: 'IMS BHU, Varanasi', fromYear: 2015, toYear: 2018 },
      { role: 'Consultant Paediatrician', organisation: 'Rudrapur Child Care', fromYear: 2018 },
    ],
    registrations: [upmc('UPMC/2010/50218', 2010)],
    ratingBreakdown: { 5: 120, 4: 30, 3: 5, 2: 2, 1: 1 },
    availability: { isAvailableToday: false, nextSlotLabel: 'Monday, 09:30 AM' },
    practices: [
      {
        hospitalName: 'Rudrapur Child Care',
        cityId: 104,
        addressLine: 'Bazaar Road, Rudrapur',
        consultationFee: 450,
      },
    ],
  },
  {
    id: 6,
    name: 'Dr. Vikram Singh',
    specialtyIds: [11],
    about:
      'Orthopaedic surgeon specialising in joint replacement and sports injury, with two decades of trauma experience from BRD Medical College.',
    education: [
      { degree: 'MBBS', institute: 'BRD Medical College, Gorakhpur', year: 2000 },
      { degree: 'MS (Ortho)', institute: 'KGMU, Lucknow', year: 2005 },
    ],
    experience: [
      {
        role: 'Registrar, Orthopaedics',
        organisation: 'BRD Medical College',
        fromYear: 2006,
        toYear: 2012,
      },
      {
        role: 'Head of Orthopaedics',
        organisation: 'Gorakhpur Bone & Joint Hospital',
        fromYear: 2012,
      },
    ],
    registrations: [upmc('UPMC/2000/27743', 2000)],
    ratingBreakdown: { 5: 200, 4: 65, 3: 15, 2: 4, 1: 3 },
    availability: { isAvailableToday: true },
    isVerified: true,
    practices: [
      {
        hospitalName: 'Gorakhpur Bone & Joint Hospital',
        cityId: 201,
        addressLine: 'Medical College Road, Gorakhpur',
        consultationFee: 800,
      },
    ],
  },
  {
    id: 7,
    name: 'Dr. Priya Chaudhary',
    specialtyIds: [3],
    about:
      'Dermatologist treating acne, pigmentation and hair loss, with a small cosmetic practice.',
    education: [
      { degree: 'MBBS', institute: 'GSVM Medical College, Kanpur', year: 2014 },
      { degree: 'MD (Dermatology)', institute: 'GSVM Medical College, Kanpur', year: 2019 },
    ],
    experience: [
      {
        role: 'Consultant Dermatologist',
        organisation: 'Skin & Aesthetics Clinic',
        fromYear: 2020,
      },
    ],
    registrations: [upmc('UPMC/2014/61870', 2014)],
    ratingBreakdown: { 5: 33, 4: 18, 3: 7, 2: 2, 1: 1 },
    availability: { isAvailableToday: false, nextSlotLabel: 'Thursday, 05:00 PM' },
    practices: [
      {
        hospitalName: 'Skin & Aesthetics Clinic',
        cityId: 201,
        addressLine: 'Golghar, Gorakhpur',
        consultationFee: 500,
      },
    ],
  },
  {
    id: 8,
    name: 'Dr. Anil Gupta',
    specialtyIds: [10],
    about:
      'Senior neurologist and one of the few DM-qualified specialists practising in the region. Runs a dedicated epilepsy clinic and takes referrals from across Purvanchal.',
    education: [
      { degree: 'MBBS', institute: 'IMS BHU, Varanasi', year: 1996 },
      { degree: 'MD (Medicine)', institute: 'IMS BHU, Varanasi', year: 2000 },
      { degree: 'DM (Neurology)', institute: 'SGPGI, Lucknow', year: 2004 },
    ],
    experience: [
      {
        role: 'Assistant Professor',
        organisation: 'BRD Medical College',
        fromYear: 2004,
        toYear: 2011,
      },
      {
        role: 'Director & Senior Neurologist',
        organisation: 'Purvanchal Neuro Centre',
        fromYear: 2011,
      },
    ],
    registrations: [upmc('UPMC/1996/18205', 1996)],
    languages: ['Hindi', 'English', 'Bhojpuri'],
    ratingBreakdown: { 5: 370, 4: 25, 3: 4, 2: 2, 1: 1 },
    availability: { isAvailableToday: false, nextSlotLabel: 'Wednesday, 11:00 AM' },
    isVerified: true,
    practices: [
      {
        hospitalName: 'Purvanchal Neuro Centre',
        cityId: 202,
        addressLine: 'Bansgaon Main Road, Bansgaon',
        consultationFee: 1000,
      },
      {
        hospitalName: 'Gorakhpur General Hospital',
        cityId: 201,
        addressLine: 'Park Road, Gorakhpur',
        consultationFee: 1200,
        timings: [{ days: 'Sat', opensAt: '11:00 AM', closesAt: '02:00 PM' }],
      },
    ],
  },
  {
    id: 9,
    name: 'Dr. Farhan Khan',
    specialtyIds: [5],
    about: 'ENT surgeon handling sinus, hearing and throat conditions for adults and children.',
    education: [
      { degree: 'MBBS', institute: 'Aligarh Muslim University', year: 2012 },
      { degree: 'MS (ENT)', institute: 'Aligarh Muslim University', year: 2017 },
    ],
    experience: [
      { role: 'Consultant ENT Surgeon', organisation: 'Campierganj ENT Care', fromYear: 2018 },
    ],
    registrations: [upmc('UPMC/2012/55901', 2012)],
    languages: ['Hindi', 'English', 'Urdu'],
    ratingBreakdown: { 5: 26, 4: 16, 3: 8, 2: 2, 1: 1 },
    availability: { isAvailableToday: true },
    practices: [
      {
        hospitalName: 'Campierganj ENT Care',
        cityId: 203,
        addressLine: 'Tehsil Road, Campierganj',
        consultationFee: 400,
      },
    ],
  },
  {
    id: 10,
    name: 'Dr. Kavita Pandey',
    specialtyIds: [6],
    about:
      'Ophthalmologist running a high-volume cataract practice with free monthly screening camps.',
    education: [
      { degree: 'MBBS', institute: 'LLRM Medical College, Meerut', year: 2008 },
      { degree: 'MS (Ophthalmology)', institute: 'LLRM Medical College, Meerut', year: 2013 },
    ],
    experience: [
      { role: 'Consultant Ophthalmologist', organisation: 'Drishti Eye Hospital', fromYear: 2014 },
    ],
    registrations: [upmc('UPMC/2008/47316', 2008)],
    ratingBreakdown: { 5: 92, 4: 30, 3: 8, 2: 2, 1: 1 },
    availability: { isAvailableToday: true },
    practices: [
      {
        hospitalName: 'Drishti Eye Hospital',
        cityId: 204,
        addressLine: 'Sahjanwa Bypass, Sahjanwa',
        consultationFee: 450,
      },
    ],
  },
  {
    id: 11,
    name: 'Dr. Mohan Lal Srivastava',
    specialtyIds: [8, 4],
    about:
      'General physician and diabetologist who has practised in Gorakhpur since 2000. Known for long consultations and conservative prescribing.',
    education: [
      { degree: 'MBBS', institute: 'BRD Medical College, Gorakhpur', year: 1994 },
      { degree: 'MD (Medicine)', institute: 'KGMU, Lucknow', year: 1999 },
    ],
    experience: [
      {
        role: 'Medical Officer',
        organisation: 'District Hospital, Gorakhpur',
        fromYear: 2000,
        toYear: 2009,
      },
      {
        role: 'Senior Consultant Physician',
        organisation: 'Gorakhpur General Hospital',
        fromYear: 2009,
      },
    ],
    registrations: [upmc('UPMC/1994/15662', 1994)],
    languages: ['Hindi', 'English', 'Bhojpuri'],
    ratingBreakdown: { 5: 400, 4: 95, 3: 16, 2: 5, 1: 3 },
    availability: { isAvailableToday: true },
    isVerified: true,
    practices: [
      {
        hospitalName: 'Gorakhpur General Hospital',
        cityId: 201,
        addressLine: 'Park Road, Gorakhpur',
        consultationFee: 550,
      },
    ],
  },
  {
    id: 12,
    // Deliberately sparse: no education, rating or fee, so the card and the
    // profile both have to degrade gracefully.
    name: 'Dr. Ritu Sahani',
    specialtyIds: [13],
    about:
      'Psychiatrist offering counselling and treatment for anxiety, depression and sleep disorders.',
    practices: [
      {
        hospitalName: 'Mind Wellness Clinic',
        cityId: 101,
        addressLine: 'Kacheri Road, Deoria',
      },
    ],
  },
];

export const DOCTORS: readonly Doctor[] = SEEDS.map(buildDoctor);
