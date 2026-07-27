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

---

## ADR-014

Decision

Group shared components by responsibility:

shared/components/layout

shared/components/forms

shared/components/ui

Reason

Done before Doctor Cards land, while there are only two components to move. A
flat components folder stops being navigable at roughly ten entries, and by
then the move touches every import in the app.

The "components" folder is kept so shared/pipes and shared/directives have an
obvious home later.

---

## ADR-015

Decision

Cross-boundary imports use path aliases (@core, @shared, @features,
@mock-data). Imports within the same top-level folder stay relative.

Reason

Relative chains encode directory depth, so every folder move becomes an
app-wide import rewrite — exactly the cost ADR-014 was paying. Aliases make the
next reorganisation cheap.

---

## ADR-016

Decision

DoctorCard takes a single `doctor` object typed as DoctorCardData — a narrow
read-model — rather than a dozen scalar inputs.

Reason

Five consumers are planned (landing, search results, hospital details,
favourites, recommendations). With scalar inputs, every new field is a
signature change at five call sites; with one object it is a model change.

DoctorCardData is deliberately smaller than the future Doctor aggregate, so a
list endpoint can return a trimmed payload and the details-page Doctor still
satisfies it structurally. Only id, name and primarySpecialty are required —
the card degrades on its own when the rest is absent.

---

## ADR-017

Decision

Display modes (compact, standard, featured) are density presets over one
template, resolved by a `visibleFields` computed:

mode preset − omit() ∩ fields the data actually has

Only standard is implemented.

Reason

Three templates behind @if would triple the markup and let the variants drift.
Adding compact or featured is additive: a new field preset and a host class,
with no template branching.

Per-context suppression uses one `omit` input over a typed field union rather
than showRating / showFee / showHospital booleans, which would be 64 states,
most meaningless, and one more input per future field.

---

## ADR-018

Decision

DoctorCard exposes no booking API. Actions arrive by content projection:

[doctorCardBadge], [doctorCardActions], [doctorCardFooter]

Reason

Each consumer needs different actions — Book, Remove from favourites, View
profile. A `bookClick` output would force a `showBookButton` flag on every
context that does not book. Projection lets booking land later without the
card changing at all.

Note

`detailsRoute` defaults to null in this iteration. /doctors/:id does not exist
yet, so a default link would bounce off the wildcard route to the landing
page. The details page (Phase 3) flips the default on.

Future architectural decisions should be recorded here before implementation.