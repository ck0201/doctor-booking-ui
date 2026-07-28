import { PatientInfo } from '@core/models/booking.model';
import { EMPTY_PATIENT_INFO, isPatientInfoValid, patientInfoErrors } from './booking-validation';

const patient = (overrides: Partial<PatientInfo> = {}): PatientInfo => ({
  fullName: 'Ramesh Gupta',
  phoneNumber: '9876543210',
  age: '42',
  gender: 'male',
  reasonForVisit: '',
  ...overrides,
});

describe('patientInfoErrors', () => {
  it('finds nothing wrong with complete details', () => {
    expect(patientInfoErrors(patient())).toEqual({
      fullName: null,
      phoneNumber: null,
      age: null,
      gender: null,
    });
  });

  it('flags every field on an empty form', () => {
    const errors = patientInfoErrors(EMPTY_PATIENT_INFO);

    expect(errors.fullName).toBeTruthy();
    expect(errors.phoneNumber).toBeTruthy();
    expect(errors.age).toBeTruthy();
    expect(errors.gender).toBeTruthy();
  });

  it('requires a name of more than one character', () => {
    expect(patientInfoErrors(patient({ fullName: 'R' })).fullName).toBeTruthy();
    expect(patientInfoErrors(patient({ fullName: '  ' })).fullName).toBeTruthy();
    expect(patientInfoErrors(patient({ fullName: 'Ra' })).fullName).toBeNull();
  });

  it('requires exactly ten digits for the phone number', () => {
    expect(patientInfoErrors(patient({ phoneNumber: '98765' })).phoneNumber).toBeTruthy();
    expect(patientInfoErrors(patient({ phoneNumber: '98765432101' })).phoneNumber).toBeTruthy();
    expect(patientInfoErrors(patient({ phoneNumber: '98765abcde' })).phoneNumber).toBeTruthy();
    expect(patientInfoErrors(patient({ phoneNumber: '+919876543210' })).phoneNumber).toBeTruthy();
    expect(patientInfoErrors(patient({ phoneNumber: ' 9876543210 ' })).phoneNumber).toBeNull();
  });

  it('requires a whole age between 1 and 120', () => {
    expect(patientInfoErrors(patient({ age: '0' })).age).toBeTruthy();
    expect(patientInfoErrors(patient({ age: '121' })).age).toBeTruthy();
    expect(patientInfoErrors(patient({ age: '-5' })).age).toBeTruthy();
    expect(patientInfoErrors(patient({ age: '4.5' })).age).toBeTruthy();
    expect(patientInfoErrors(patient({ age: 'abc' })).age).toBeTruthy();
    expect(patientInfoErrors(patient({ age: '1' })).age).toBeNull();
    expect(patientInfoErrors(patient({ age: '120' })).age).toBeNull();
  });

  it('requires a gender to be chosen', () => {
    expect(patientInfoErrors(patient({ gender: '' })).gender).toBeTruthy();
    expect(patientInfoErrors(patient({ gender: 'other' })).gender).toBeNull();
  });

  it('never requires a reason for the visit', () => {
    expect(isPatientInfoValid(patient({ reasonForVisit: '' }))).toBe(true);
  });
});

describe('isPatientInfoValid', () => {
  it('is true only when every field passes', () => {
    expect(isPatientInfoValid(patient())).toBe(true);
    expect(isPatientInfoValid(EMPTY_PATIENT_INFO)).toBe(false);
    expect(isPatientInfoValid(patient({ gender: '' }))).toBe(false);
  });
});
