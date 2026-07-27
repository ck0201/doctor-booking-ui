# Architecture Decision Log

## ADR-001

Decision

Use Angular Standalone Components.

Reason

Modern Angular standard.

---

## ADR-002

Decision

Use Angular Signals.

Reason

Simpler than RxJS for local state.

---

## ADR-003

Decision

Build reusable SearchableDropdown.

Reason

Will be used for Specialty, Hospital, District, City and future lookup screens.

---

## ADR-004

Decision

MVP launch only in Uttar Pradesh.

Reason

Smaller dataset and easier validation.

---

## ADR-005

Decision

Remove "Popular Specialties" from Doctors page.

Reason

Users come to search for doctors, not browse categories.

---

## ADR-006

Decision

Doctor search flow:

Doctor Name

Specialty

State (fixed)

District

City

Search

Reason

Optimised for quick appointment booking.

---

## ADR-007

Decision

Architecture first, implementation second.

Reason

Maintain consistency as the application grows.

---

## ADR-008

Decision

Use centralized mock data during MVP development.

Reason

The entire UI should be demo-ready without requiring backend APIs. Mock data will later be replaced by API services with minimal changes.

---

## ADR-009

Decision

Introduce a shared LookupItem contract.

interface LookupItem { id: number; name: string }

Specialty, District and City extend it.

Reason

Lookups are selected by id, not by label. A single contract lets one reusable dropdown serve every lookup, and it matches the DTO the API will return.

---

## ADR-010

Decision

Components read lookups through core services (LocationService, SpecialtyService), never by importing mock files directly.

Reason

Mock data becomes an implementation detail of one class. Wiring the real API later changes only the service body, exactly as MOCK_DATA.md requires.

---

## ADR-011

Decision

SearchableDropdown is generic over T extends LookupItem and is two-way bound through a model() signal.

Reason

model() is the shape a ControlValueAccessor wraps. Reactive Forms support becomes an additive change (NG_VALUE_ACCESSOR provider + four delegating methods) instead of a rewrite. The CVA seams (formDisabled signal, touched output) already exist.

---

## ADR-012

Decision

District → City cascade uses computed() for the options and linkedSignal() for the selected city.

Reason

The city list is derived state, and the selection resets itself when the district changes. Declarative dependency, no reset effect, no chance of city and district disagreeing.

---

## ADR-013

Decision

UI_GUIDELINES colours, radii and shadows live as CSS custom properties in src/styles.css.

Reason

The palette was being re-hardcoded in every component stylesheet. Tokens remove the duplication and make a future dark mode a token swap.

Future architectural decisions should be recorded here before implementation.