# Mock Data Strategy

Purpose

Until backend APIs are available, every screen should work using local mock data.

---

## Current Rule

Never call an API during Phase 1.

Every feature should have enough dummy data to demonstrate the complete user flow.

---

## Where mock data lives

src/app/mock-data/

Example

doctors.mock.ts

hospitals.mock.ts

appointments.mock.ts

specialties.mock.ts

locations.mock.ts

doctors.mock.ts

doctor-reviews.mock.ts

hospitals.mock.ts

Doctors reference specialties and cities by id through a lookup helper, so the
mocks cannot drift apart — an unknown id throws at module load.

A doctor's practice references its hospital by id. Hospitals derive their
doctorCount from those references, so the two can never disagree (ADR-025).
hospitals.mock.ts imports doctors.mock.ts; the reverse would be a cycle, so
practice hospitalIds are checked by integrity tests instead.

State, districts and their cities live in one file because they are one
hierarchy; splitting them would let the ids drift apart.

---

## Access rule

Components never import a *.mock.ts file.

They inject a core service (LocationService, SpecialtyService) which owns the
mock today and the HTTP call tomorrow.

---

## Future

When backend APIs are ready,

replace

DoctorMockData

with

DoctorService

without changing UI components.