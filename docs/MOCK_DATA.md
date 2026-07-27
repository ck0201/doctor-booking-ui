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