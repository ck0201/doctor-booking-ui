/** Mock roles. No permissions model — the role only decides routing and navigation. */
export type UserRole = 'patient' | 'doctor' | 'admin';

export const USER_ROLES: readonly UserRole[] = ['patient', 'doctor', 'admin'];

export const USER_ROLE_LABELS: Readonly<Record<UserRole, string>> = {
  patient: 'Patient',
  doctor: 'Doctor',
  admin: 'Admin',
};

/** Where each role lands after verification. */
export const ROLE_HOME: Readonly<Record<UserRole, string>> = {
  patient: '/',
  doctor: '/doctor/dashboard',
  admin: '/admin',
};

export interface AuthUser {
  /** Ten digits, as entered. There is no account record to look up. */
  readonly phoneNumber: string;
  readonly role: UserRole;
}

export type OtpResult = 'verified' | 'invalid' | 'no-request';
