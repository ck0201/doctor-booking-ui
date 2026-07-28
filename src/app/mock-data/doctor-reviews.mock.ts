import { DoctorReview } from '@core/models/doctor.model';

/**
 * Phase 1 mock data — replaced by GET /api/doctors/{id}/reviews later.
 * Keyed by doctor id; doctors.mock.ts attaches them to the profile.
 *
 * These are the *written* reviews. The total rating count lives in each
 * doctor's ratingBreakdown and is deliberately larger — most people rate
 * without writing anything.
 *
 * Dates are fixed ISO strings. Nothing here may derive from the current date,
 * or the data goes stale and the tests become time-dependent.
 */
export const DOCTOR_REVIEWS: Readonly<Record<number, readonly DoctorReview[]>> = {
  1: [
    {
      id: 1001,
      patientName: 'Ramesh Gupta',
      rating: 5,
      comment:
        'Explained my ECG report in plain language and did not rush the consultation. The clinic runs close to its appointment times.',
      visitedOn: '2026-06-14',
      isVerifiedVisit: true,
    },
    {
      id: 1002,
      patientName: 'Sunil Kumar',
      rating: 5,
      comment: 'Second opinion that saved me an unnecessary procedure. Very thorough.',
      visitedOn: '2026-04-02',
      isVerifiedVisit: true,
    },
    {
      id: 1003,
      patientName: 'Meena Devi',
      rating: 4,
      comment: 'Excellent doctor. Waiting area gets crowded on Saturdays.',
      visitedOn: '2026-02-21',
      isVerifiedVisit: false,
    },
  ],
  3: [
    {
      id: 1004,
      patientName: 'Anonymous',
      rating: 5,
      comment:
        'Looked after me through both pregnancies. Patient with every question, however small.',
      visitedOn: '2026-05-30',
      isVerifiedVisit: true,
    },
    {
      id: 1005,
      patientName: 'Pooja Singh',
      rating: 5,
      comment: 'Calm and reassuring during a difficult time. Staff are kind too.',
      visitedOn: '2026-03-11',
      isVerifiedVisit: true,
    },
    {
      id: 1006,
      patientName: 'Anonymous',
      rating: 4,
      comment: 'Very good consultation, though it is hard to get an early slot.',
      visitedOn: '2025-12-08',
      isVerifiedVisit: false,
    },
  ],
  6: [
    {
      id: 1007,
      patientName: 'Arun Pratap',
      rating: 5,
      comment: 'Knee replacement went smoothly and the follow-up care was well organised.',
      visitedOn: '2026-06-01',
      isVerifiedVisit: true,
    },
    {
      id: 1008,
      patientName: 'Dinesh Yadav',
      rating: 4,
      comment: 'Straightforward advice, no unnecessary tests.',
      visitedOn: '2026-01-19',
      isVerifiedVisit: true,
    },
  ],
  8: [
    {
      id: 1009,
      patientName: 'Kamla Prasad',
      rating: 5,
      comment:
        'Travelled from out of district on a recommendation and it was worth it. Diagnosed a condition two other doctors had missed.',
      visitedOn: '2026-05-05',
      isVerifiedVisit: true,
    },
    {
      id: 1010,
      patientName: 'Anonymous',
      rating: 5,
      comment: 'Extremely experienced. Consultation fee is on the higher side but justified.',
      visitedOn: '2026-03-27',
      isVerifiedVisit: true,
    },
    {
      id: 1011,
      patientName: 'Shivam Jaiswal',
      rating: 4,
      comment: 'Good doctor, appointments run late in the evening slot.',
      visitedOn: '2025-11-16',
      isVerifiedVisit: false,
    },
  ],
  11: [
    {
      id: 1012,
      patientName: 'Geeta Sharma',
      rating: 5,
      comment: 'Our family doctor for years. Always available and never over-prescribes.',
      visitedOn: '2026-06-22',
      isVerifiedVisit: true,
    },
    {
      id: 1013,
      patientName: 'Anonymous',
      rating: 4,
      comment: 'Reliable and honest advice.',
      visitedOn: '2026-02-04',
      isVerifiedVisit: false,
    },
  ],
};
