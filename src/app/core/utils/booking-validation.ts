import { PatientInfo, PatientInfoErrors } from '@core/models/booking.model';

/**
 * Patient form validation, kept out of the component so the form and the
 * Confirm button read the same rules rather than each having their own opinion.
 */

const TEN_DIGITS = /^\d{10}$/;

export function patientInfoErrors(patient: PatientInfo): PatientInfoErrors {
  const age = Number(patient.age);

  return {
    fullName: patient.fullName.trim().length < 2 ? 'Enter the patient’s full name' : null,

    phoneNumber: TEN_DIGITS.test(patient.phoneNumber.trim())
      ? null
      : 'Enter a 10-digit mobile number',

    age:
      patient.age.trim() === '' || !Number.isInteger(age) || age < 1 || age > 120
        ? 'Enter an age between 1 and 120'
        : null,

    gender: patient.gender === '' ? 'Select a gender' : null,
  };
}

export function isPatientInfoValid(patient: PatientInfo): boolean {
  return Object.values(patientInfoErrors(patient)).every((error) => error === null);
}

export const EMPTY_PATIENT_INFO: PatientInfo = {
  fullName: '',
  phoneNumber: '',
  age: '',
  gender: '',
  reasonForVisit: '',
};
