# Healthcare Appointment Booking Platform

## Overview

This project is a modern healthcare appointment booking platform built using Angular 21.

The application is designed with scalability in mind so it can evolve from an MVP into a complete healthcare ecosystem.

---

# Tech Stack

Frontend
- Angular 21
- Standalone Components
- Signals
- CSS

Backend (Planned)
- ASP.NET Core
- Entity Framework Core
- SQL Server
- JWT Authentication

---

# Project Goals

- Clean architecture
- Reusable components
- High performance
- Mobile responsive
- Easy maintenance
- Scalable codebase

---

# Folder Structure

src/

app/

features/

shared/

core/

models/

services/

guards/

interceptors/

environments/

---

# Shared Components

Grouped by responsibility under src/app/shared/components/

layout/

App shell and page structure.

Navbar, Footer, Page Shell

forms/

Components that capture user input.

Searchable Dropdown, Search Box

ui/

Presentational components that only display data.

Doctor Card, Hospital Card, Loading Spinner, Pagination, Modal,
Confirmation Dialog, Reusable Button, Empty State

Non-component shared code lives in sibling folders (shared/pipes,
shared/directives), never inside these groups.

See src/app/shared/components/README.md for the rules.

---

# Path Aliases

Imports that cross a top-level boundary use an alias instead of a relative
chain. Imports inside the same top-level folder stay relative.

@core/\*

src/app/core/\*

@shared/\*

src/app/shared/\*

@features/\*

src/app/features/\*

@mock-data/\*

src/app/mock-data/\*

Defined in tsconfig.json, so moving a folder no longer rewrites every
consumer's import path.

---

# Feature Modules

Landing

Doctors

Hospitals

Doctor Details

Hospital Details

Appointments

Authentication

Profile

Admin

---

# Design Principles

- Single Responsibility Principle
- Reusable Components
- Composition over duplication
- Modern Angular APIs
- Lazy Loading where appropriate
- Smart feature components
- Dumb reusable components

---

# State Management

Current

Signals

Future

Signals + Resource APIs if required.

Avoid introducing NgRx unless complexity justifies it.

---

# Naming Convention

Component

doctor-card

searchable-dropdown

hospital-card

Service

DoctorService

HospitalService

AppointmentService

Signal

selectedDoctor

selectedDistrict

filteredDoctors

---

# Routing Strategy

Each feature owns its routes in <feature>.routes.ts and is lazy-loaded from
app.routes.ts (ADR-019). app.routes.ts never lists a feature's individual
pages.

/

Landing

/doctors

Doctor Search

/doctors/:id

Doctor Details

/hospitals

Hospital Listing

/hospitals/:id

Hospital Details

/appointments

Appointments

/profile

Profile

---

# Future Architecture

Authentication

Role Based Authorization

Caching

Offline Support

PWA

Internationalization

Dark Mode

Accessibility