import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientForm } from './patient-form';
import { PatientInfo } from '@core/models/booking.model';
import { EMPTY_PATIENT_INFO } from '@core/utils/booking-validation';

@Component({
  imports: [PatientForm],
  template: `<app-patient-form [(patient)]="patient" [showAllErrors]="showAllErrors()" />`,
})
class HostComponent {
  readonly patient = signal<PatientInfo>(EMPTY_PATIENT_INFO);
  readonly showAllErrors = signal(false);
}

describe('PatientForm', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const input = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
  const errors = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.field-error')) as HTMLElement[];
  const genderButtons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('.choice')) as HTMLButtonElement[];

  const type = (id: string, value: string) => {
    const field = input(id);
    field.value = value;
    field.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('starts empty and quiet — nothing is red before it is filled in', () => {
    expect(input('patient-name').value).toBe('');
    expect(errors().length).toBe(0);
  });

  it('writes each field back to the parent', () => {
    type('patient-name', 'Ramesh Gupta');
    type('patient-phone', '9876543210');
    type('patient-age', '42');
    type('patient-reason', 'Chest pain');

    expect(host.patient()).toEqual({
      fullName: 'Ramesh Gupta',
      phoneNumber: '9876543210',
      age: '42',
      gender: '',
      reasonForVisit: 'Chest pain',
    });
  });

  it('selects a gender by button', () => {
    genderButtons()[1].click();
    fixture.detectChanges();

    expect(host.patient().gender).toBe('male');
    expect(genderButtons()[1].getAttribute('aria-pressed')).toBe('true');
  });

  it('complains about a field only once it has been left', () => {
    expect(errors().length).toBe(0);

    input('patient-phone').dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(errors().length).toBe(1);
    expect(errors()[0].textContent).toContain('10-digit');
  });

  it('stops complaining once the field is valid', () => {
    input('patient-phone').dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(errors().length).toBe(1);

    type('patient-phone', '9876543210');

    expect(errors().length).toBe(0);
  });

  it('reveals everything missing when the page asks it to', () => {
    host.showAllErrors.set(true);
    fixture.detectChanges();

    expect(errors().length).toBe(4);
  });

  it('never complains about the optional reason', () => {
    host.showAllErrors.set(true);
    fixture.detectChanges();

    expect(errors().some((error) => error.textContent?.includes('reason'))).toBe(false);
  });

  it('marks an invalid field for assistive tech', () => {
    host.showAllErrors.set(true);
    fixture.detectChanges();

    expect(input('patient-name').getAttribute('aria-invalid')).toBe('true');
    expect(input('patient-name').getAttribute('aria-describedby')).toBe('patient-name-error');
  });

  it('drops the invalid marking once the field is good', () => {
    host.showAllErrors.set(true);
    fixture.detectChanges();

    type('patient-name', 'Ramesh Gupta');

    expect(input('patient-name').getAttribute('aria-invalid')).toBeNull();
  });

  it('reflects a value set from outside', () => {
    host.patient.set({
      fullName: 'Sunita Devi',
      phoneNumber: '9000000000',
      age: '31',
      gender: 'female',
      reasonForVisit: '',
    });
    fixture.detectChanges();

    expect(input('patient-name').value).toBe('Sunita Devi');
    expect(genderButtons()[0].getAttribute('aria-pressed')).toBe('true');
    expect(errors().length).toBe(0);
  });
});
