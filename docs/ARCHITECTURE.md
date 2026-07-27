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

Examples

Navbar

Searchable Dropdown

Search Box

Doctor Card

Hospital Card

Loading Spinner

Pagination

Modal

Confirmation Dialog

Reusable Button

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