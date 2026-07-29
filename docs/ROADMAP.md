# Development Roadmap

## Phase 1

✅ Project Setup

✅ Landing Page

✅ Navbar

✅ Searchable Dropdown

✅ Doctors Page — Search Panel

✅ Doctor Cards — Standard Mode

✅ Search Filters in URL — ADR-021

✅ Doctor Details — Profile Page, Not Found State, Breadcrumbs

✅ UI Component Consolidation — ADR-024

- Avatar
- RatingStars
- ProfileSection
- TagList
- EmptyState

✅ Doctor Cards link to `/doctors/:id`

---

## Phase 2 (Current)

### Appointment Booking

✅ Booking Domain — Models, Mock Availability, BookingService — ADR-026

✅ Appointment Booking Page — `/book/:doctorId`

✅ Doctor Availability (Mock Slots)

✅ Date Selection

✅ Time Slot Selection

✅ Patient Information Form

✅ Booking Confirmation — page state, not a route — ADR-027

✅ Book Appointment CTA on Doctor Details — ADR-027

✅ Duplicate Submission Prevention — ADR-027

✅ Booking Flow End-to-End

Landing → Doctor Search → Doctor Details → Book → Confirmation.

⬜ Slots stay taken once booked

createBooking is stateless — see ADR-026.

⬜ Book Appointment from doctor search cards

Deliberately not added: the card action slot stays empty per ADR-018.

---

## Phase 3

### Hospital Discovery

✅ Models, Mock Data, HospitalService — ADR-025

⬜ Hospital Search Page

⬜ Hospital Card

⬜ Hospital Details

⬜ Doctors Available in Hospital (Reuse DoctorCard)

---

## Phase 4

### Patient Experience

✅ My Appointments — read-only history at `/appointments` — ADR-028

Bookings made in the session do not appear: the service is stateless by
ADR-026.

⬜ Appointment Details

⬜ Appointment Cancellation

⬜ Appointment Rescheduling

---

## Phase 5

### Authentication & Dashboards

⬜ Authentication (OTP)

⬜ Patient Dashboard

✅ Doctor Dashboard — read-only at `/doctor/dashboard` — ADR-029

Availability toggle is local and unsaved. Not wired to the booking flow.

---

## Phase 6

### Administration

⬜ Admin Portal

⬜ Reporting

⬜ Analytics

---

## Phase 7

### Advanced Features

⬜ Video Consultation

⬜ Notifications

⬜ PWA

⬜ Offline Support

⬜ AI Assistant

---

## Deferred

Raised during earlier phases, not yet scheduled.

- Doctor Card Compact Mode (ADR-017)
- Doctor Card Featured Mode (ADR-017)
- Doctor Card Skeleton (when async data is introduced)
- Scroll Position Restoration for Doctor Details
- Navbar on Every Page (or remove from UI_GUIDELINES)
- ESLint