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

---

## ADR-019

Decision

The doctors feature owns its routes in doctors.routes.ts and is lazy-loaded as
one chunk. Its pages live in sibling folders:

features/doctors/doctors.routes.ts

features/doctors/doctor-search/

features/doctors/doctor-details/

app.routes.ts holds only:

{ path: 'doctors', loadChildren: () => import('@features/doctors/doctors.routes') }

Reason

Two pages under one feature made the flat layout ambiguous — `Doctors` no
longer says which page it is. Splitting before the profile UI exists means the
rename touches one route entry and one spec instead of a finished feature.

Route ownership follows the same rule as the rest of the codebase: the feature
that owns the pages owns their configuration. app.routes.ts no longer has to
know that doctors has two pages, or gain a third entry when doctor availability
arrives.

Lazy loading is what ARCHITECTURE.md asks for where appropriate, and it is
appropriate here: the landing page has no use for the search panel or the
profile page. Measured effect — initial bundle 282.11 kB to 240.93 kB
(66.89 kB transferred), with the feature in a 43.20 kB on-demand chunk.

Consequences

Doctors renamed to DoctorSearch, selector app-doctors to app-doctor-search.

doctors.routes.ts uses a default export, which is what loadChildren consumes.

Titles are set per route. A resolver-based title carrying the doctor's name
comes with the profile page.

Both specs route through the real doctors.routes.ts rather than a hand-rolled
route table, so the relative navigation in DoctorSearch.search() is exercised
in the nested shape production uses.

---

## ADR-020

Decision

Doctor extends DoctorCardData. List operations return the narrow
DoctorCardData; only getById returns the full Doctor.

Reason

Honours the ADR-016 promise that the aggregate satisfies the card contract, so
a profile page hands its Doctor straight to DoctorCard with no mapping. Search
results have no business carrying review arrays and practice timings, and the
narrow return type is what stops them growing into it.

The mock holds one object either way, so today the narrowing is a compile-time
contract rather than a smaller payload. The real list endpoint will send less.
A @ts-expect-error test fails the build if either list method widens.

Amendment after implementation

Card-level fields that duplicate profile detail are DERIVED when the data is
built, never authored twice:

primarySpecialty  <- specialties[0]

qualifications    <- education degrees, joined

consultationFee   <- practices[0].consultationFee

practice          <- practices[0]

rating            <- ratingBreakdown

experienceYears   <- DATA_AS_OF_YEAR minus the earliest role

This was not in the approved design, which authored rating and
experienceYears separately. Two sources for the same fact drift, and a card
contradicting the profile it links to is the most visible way this demo could
embarrass itself. Deriving makes that class of bug unrepresentable, and the
consistency suite asserts each rule.

Consequences

DATA_AS_OF_YEAR is a fixed constant, not the current date, so experience
figures and tests never go stale.

PracticeTiming stays display strings. Structuring it into slots is the first
task of booking, and keeping it as text is what holds that boundary.

Reviews live in doctor-reviews.mock.ts keyed by doctor id, so DoctorReview
needs no doctorId field it would not have in an API response. rating.
reviewCount counts everyone who rated; reviews holds only the written subset,
so reviews.length is deliberately smaller.

---

## ADR-021

Decision

The URL is the source of truth for the submitted doctor search.

/doctors?name=asha&specialty=1&district=1&city=101

Results are derived from the query parameters. Pressing Search does not set
state — it navigates, and everything downstream reacts to the navigation.

Reason

Raised while designing Doctor Details. Once a card links to a profile, back
navigation would destroy a search held in component state and drop the user on
an empty prompt after five filters. Deriving from the URL fixes that and gives
shareable searches, refresh survival and deep-linkable specialty pages for
roughly the same code.

Details

Panel controls stay local signals seeded from the URL through linkedSignal, so
typing does not rewrite history on every keystroke. They re-seed whenever the
URL changes, which is what makes back and forward work.

Parameters carry ids, not labels. Anything that is not a positive integer id is
ignored, as is a city that does not belong to the district in the URL — a
hand-edited URL degrades instead of breaking.

A bare /doctors is the pristine state, so a search submitted with no filters
would be indistinguishable from a first visit. That case alone adds
`searched=1`; it never appears alongside real filters, so shareable URLs stay
clean.

Enables withComponentInputBinding(), so pages read parameters as signals
instead of injecting ActivatedRoute. Doctor Details will read :id the same way.

Consequence

`lastSearch` became `appliedCriteria` and is now computed, not written.

---

## ADR-022

Decision

Profile sections are content inside the page template, not a component each.
A section becomes a component only when it carries its own conditional logic,
stateful iteration, or exceeds roughly forty lines of template.

Reason

About, Education, Experience, Registrations, Services and Languages are each a
heading and a list. Six wrapper components would be six files, six specs and
six indirections for no reuse.

Status

Settled. Sections are markup inside the shared ProfileSection, and the
duplication this ADR flagged has been removed — see ADR-024.

---

## ADR-023

Decision

An invalid or unknown doctor id renders a not-found state in place. The URL is
preserved and no redirect happens.

Reason

The wildcard route would send /doctors/9999 to the landing page, which reads as
a broken application. Keeping the URL lets the user see what they asked for,
share the broken link with someone who can fix it, and back out deliberately.

Implementation details

One not-found path, not two. `toRouteId` returns null for anything that is not
a positive integer, and `getById` returns undefined for an id nobody has, so
both collapse into `doctor() === undefined`. The template branches once.

Validation lives in @core/utils/route-params.ts and is shared with the search
page rather than duplicated. It tightened in the process: the previous check
used Number(), which accepted '1e3' as 1000 and '0x10' as 16. It is now a digit
pattern, so '1e3', '0x10', '1.5', '-1' and '0' are all rejected.

The id stays a string on the component input, because that is what the router
hands over. Parsing is a computed, so an id that changes mid-session
re-validates with everything else.

The route title resolves through the same path: the doctor's name and specialty
when found, 'Doctor not found' otherwise. A browser tab should not claim a
doctor exists when the page says otherwise.

No guard and no resolver for the doctor itself. A guard would have to redirect,
which is the behaviour this ADR rejects, and a resolver would move the lookup
away from the component that already derives everything else from the id.

---

## ADR-024

Decision

Five presentational components extracted to shared/components/ui:

Avatar, RatingStars, ProfileSection, TagList, EmptyState

DoctorCard, DoctorDetails and DoctorSearch all consume them. Doctor cards now
link to /doctors/:id.

Reason

Each had two or three copies of the same markup and CSS across the card, the
profile and the search results. The initials derivation existed twice, and the
screen-reader sentence for a rating existed twice with different wording.

Sizing and density are CSS custom properties, not inputs

--avatar-size, --avatar-font-size, --tag-gap, --empty-state-padding,
--empty-state-title-size, --empty-state-title-weight

A `size="md"` input cannot follow a media query, and the card's avatar is 72px
on desktop and 56px on mobile. Properties also let the two existing empty
states keep the densities they already had instead of forcing a visual change
into a refactor that was supposed to have none.

RatingStars owns the glyph, the optional count and the accessible sentence, but
inherits colour and weight. The same rating reads amber in a card's meta row and
plain text in a profile stat; that belongs to the consumer.

EmptyState projects its message rather than taking a string input, because
callers need markup inside it — the id that was not found. It still owns the
paragraph, so it keeps control of the typography.

Consequences

DoctorCard lost its `initials` and `ratingLabel` members; DoctorDetails lost
`initials` and `ratingLabel` and gained `specialtyNames`.

One wording had to win in the shared screen-reader sentence: "N out of 5 from N
ratings". The card previously said "reviews", which was wrong — the count
includes people who rated without writing anything.

`.btn` moved to styles.css during the same pass, since both feature stylesheets
had a copy and doctor-details.css was over its 4 kB budget.

Two paragraph resets now cross a projection boundary
(`app-profile-section p`), because projected content keeps the parent's style
scope. Worth knowing before moving those rules.

Not consolidated

The rating distribution bars stay local to DoctorDetails. The design called
that RatingSummary and it was not in this phase's scope; hospital reviews will
be the second consumer that justifies it.

DoctorDetails keeps a local `.card` for the profile header and the sidebar,
which are surfaces without a section title.

---

## ADR-025

Decision

The hospital module mirrors the doctor module exactly: HospitalCardData narrow
read model, Hospital aggregate extending it, HospitalService with getHospitals /
getById / search, mock data built from seeds with ids resolved through byId.

A hospital's doctor list is not stored. DoctorPracticeDetail gained a
hospitalId, and both DoctorService.getByHospital(id) and each hospital's
doctorCount derive from it.

Reason

Following the established pattern was the instruction, and the pattern earns its
keep here: the narrow/aggregate split, the derive-don't-duplicate rule and the
integrity tests all transfer without adaptation.

The relationship needed one owner. Storing doctorIds on the hospital as well as
practices on the doctor would let the two disagree — a doctor practising at a
hospital that does not list them. Practices own it; the hospital derives.

hospitalId replaced a name-string match, which would have been the alternative.
That is the one change made to the completed doctor module: an additive field on
DoctorPracticeDetail plus a value per practice seed. It is not a refactor, and
without it "doctors at this hospital" would have matched on a display string.

Details

Opening hours are structured by weekday (Weekday[]) because the search results
need an open-today indicator, which a display string cannot answer. The times
stay display strings, so the booking boundary from ADR-020 holds. The
'Mon – Sat' label is derived from the days by weekdayLabel, never authored
alongside them.

isOpenOn(hospital, weekday) takes the day rather than reading the clock, so it
is pure and its tests are not time-dependent. Resolving "today" belongs to the
caller, and lands with the card in Phase 3.

isOpen24Hours is a flag rather than a 00:00–23:59 window, because three of the
twelve hospitals genuinely run round the clock and a fake window reads as a data
error.

The hospital address carries its District as well as its City, derived from
city.districtId. The card has to show both and should not have to look one up.

Rating uses a new @core/models/rating.model.ts. DoctorRating has the same shape
and is deliberately left alone — collapsing them would be a refactor of a
finished module for no functional gain.

One data fix

Deoria City Clinic had two different address strings across two doctors'
practices. Unified, and an integrity test now asserts every practice's name,
city and address match its hospital.

---

## ADR-026

Decision

Booking follows the established layout rather than a domains/ tree: models in
core/models, service in core/services, mock in mock-data, page and its parts in
features/booking. The five booking components live in the feature, not in shared.

Reason

The brief specified domains/booking/{models,services,mocks,types,utils} and also
said to follow the existing architecture and mirror the hospital domain. Those
conflict — hospital is not built that way and nothing in the repo is. Confirmed
with the author before writing anything; a second organisational scheme would
have left booking unlike doctor and hospital forever.

The components stay in the feature because none has a second consumer.
BookingStepper, DateSelector and SlotGrid are the candidates for shared/ui the
day something else needs them, which is the same rule ADR-024 followed.

Slot times

This is where the timing boundary held since ADR-020 finally moves. Opening
hours and practice timings stayed display strings so that slots would be the
app's first machine-readable times, and they are: BookingSlot carries an ISO
date plus display times, and the calendar helpers parse in UTC so a label never
shifts by a day depending on the machine.

The availability window is a fixed constant, not "the next seven days". A moving
window would make every assertion depend on the day the suite runs.

State

Local signals only, as instructed. Availability, the chosen day, the chosen slot
and validity are computed or linkedSignal off the route parameter; nothing is
stored outside the component and no store was introduced. A single page's worth
of state does not need one.

selectedSlotId resets from the slot list rather than the selected date. Two
doctors can share a first available date, and keying the reset off the date left
a slot id belonging to the previous doctor. Caught by a test.

Service shape

Synchronous, like every other service (ADR-008). createBooking rejects rather
than throws, so callers render a message instead of handling an exception, and
it is stateless — the slot is not marked taken, because no persistence exists to
hold that. Both are noted as assumptions for the review.

Validation lives in @core/utils/booking-validation.ts so the form and the
Confirm button apply one set of rules, and the service can refuse a request that
never went through the form.

Out of scope, as instructed

No confirmation destination: a successful request is reported in place. No
payment, authentication, OTP or notifications. The page says payment happens at
the clinic rather than implying an online step that does not exist.

---

## ADR-027

Decision

Booking confirmation is a state of the booking page, not a route.
BookingConfirmation lives in features/booking/components and composes the
existing EmptyState and ProfileSection.

Reason

A confirmation has nothing to show unless a booking just happened in this
component, so a route would need either state passed through the router or a
persisted booking to read back. Neither exists, and both were out of scope. As a
state it is reachable, testable and honest about what it depends on.

No new success component was written: the headline is EmptyState and the detail
list sits in ProfileSection, both untouched.

Duplicate submission

confirm() guards on canConfirm() before it does anything, and canConfirm()
includes "no confirmed response yet" and "not currently submitting". The guard,
not the disabled attribute, is what actually prevents a double booking: a second
click can land before change detection has disabled the button, and the guard
still drops it. There is a test that clicks twice without a render in between.

isSubmitting is set around the call and cleared in a finally. With a synchronous
service the window is instantaneous, so the flag changes nothing visible today —
it exists so the button is already bound to it and the guard already respects it.
Making the service async needs an await and nothing else.

A rejection deliberately leaves the form usable, so the patient can pick another
slot and try again.

Doctor Details call to action

Fills the sidebar region reserved in ADR-018, using the global .btn and
.btn--primary. A .btn--ghost variant was added next to them in styles.css for
the confirmation's secondary action, rather than a local button style in the
feature.

Doctor Search cards were not touched: their action slot stays empty, as ADR-018
intended.

---

## ADR-028

Decision

Appointment history is its own feature at features/appointments, lazy-loaded at
/appointments. Its data comes from BookingService.getAppointmentHistory(), which
reads a mock and stays read-only.

Reason

A separate route and a separate job — a list to look back at, not a wizard to
walk through — so it is a separate feature. It shares the booking domain the way
doctor-details and booking already share DoctorService: through core, not through
each other.

ADR-026 holds unchanged. createBooking still writes nothing, and the history is
what a backend would return rather than a record of this session. A booking made
now does not appear in the list. That is a visible limitation and it is
deliberate; persistence was out of scope.

Model

One appointment model, composed rather than restated: Appointment holds a
DoctorCardData and an AppointmentTime. Nothing about a doctor is copied, so a
name or specialty cannot drift from the doctor module.

AppointmentTime was extracted from BookingSlot, which now extends it. Purely
additive — BookingSlot's shape is unchanged and every existing use compiles. It
exists so a past appointment does not carry an isAvailable flag that means
nothing for it.

AppointmentStatus is separate from BookingStatus on purpose: one is where an
appointment stands, the other is whether a single request was accepted.

Sorting

In @core/utils/appointment-order.ts, applied by the service, never in a template.
Groups by status — upcoming, completed, cancelled — then newest date first inside
each group, with the reference as a final tie-break so the order is stable rather
than dependent on the order the mock declares.

"Newest first" is applied uniformly, including to upcoming. For a history that
reads correctly, but soonest-first may be what a patient actually wants for
upcoming appointments; it is a single comparator line to flip.

Filtering

A local signal, not a query parameter. Doctor search puts filters in the URL
(ADR-021) because a search is worth sharing and worth surviving a refresh; a
glance at your own history is neither.

Formatting

formatTimeRange was added to booking-slots and BookingConfirmation now uses it
too, so the confirmation and the history cannot word the same appointment
differently. SLOT_DURATION_MINUTES moved to the same util for the same reason.

Components

Both new components stay in the feature: AppointmentCard and
AppointmentStatusFilter each have exactly one consumer. Nothing was promoted to
shared. DoctorCard was considered for the list rows and rejected — it brings its
own card surface, heading and stretched link, so nesting it would double the card
chrome and it has no room for a reference, a date or a status.

Future architectural decisions should be recorded here before implementation.

## ADR-026 — Prioritize Appointment Booking before Hospital Discovery

Status: Accepted

### Context

The Hospital domain (models, services and mock data) has already been implemented.

However, the MVP should demonstrate a complete patient journey before adding another discovery flow.

### Decision

Appointment Booking becomes the next feature.

Hospital Search and Hospital Details move to the following phase.

### Consequences

- Better MVP
- Complete end-to-end demo
- Hospital module reused later
- No architectural changes required