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

---

## ADR-029

Decision

The doctor dashboard is its own feature at features/doctor-dashboard, lazy-loaded
under the `doctor` route segment, and it reads from a new
DoctorDashboardService rather than from DoctorService.

Reason

DoctorService answers questions patients ask — search, profile, who works at this
hospital. The dashboard answers questions a doctor asks about their own day. Two
audiences in one service would have made it the widest class in the app and left
the patient-facing reads entangled with a view that will one day sit behind
authentication.

The route is nested (`doctor` in app.routes.ts, `dashboard` inside the feature)
so a second doctor page costs a line in the feature and nothing at the root.

Not connected to the booking flow, as instructed. The dashboard's appointments
are not produced by createBooking and its references deliberately do not overlap
the patient history's — there is a test asserting that, so nobody later reads the
two lists as one dataset.

Models

Separate from the patient-facing ones. A dashboard row's subject is the patient,
not the doctor, and a doctor sees a consultation in progress where a patient's
history never does. Sharing AppointmentStatus would have meant adding
'in-progress' to a union whose exhaustive labels and ordering drive the patient
history's filters — changing a finished feature to serve this one.

AppointmentTime is reused, which is what extracting it in ADR-028 was for.

Availability toggle

The published state comes from the service; the page holds a linkedSignal copy,
so the switch changes this page and nothing else. Nothing is written back and no
other screen observes it. The panel says as much on screen, because a switch that
silently forgets is worse than no switch.

The summary cards deliberately do not react to it. "Available slots remaining"
stays what the service reported: making it drop to zero would imply the toggle
had done something, which it has not.

Formatting

formatRange was added to booking-slots as the one place the dash between two
times is decided; formatTimeRange now delegates to it, and the dashboard's working
hours use it directly. The doctor's slot duration is dashboard data at 30 minutes,
unrelated to the booking grid's SLOT_DURATION_MINUTES, because the two are not
the same thing.

Structure

Single-page feature, so the page sits at the feature root rather than in a folder
repeating its own name. Booking and appointments nest their pages because those
features expect siblings.

Not promoted

A status badge now exists in three places — patient history, dashboard rows,
availability state. It is a plausible shared component, but promoting it means
editing AppointmentCard and its assertions, which is a finished feature. Left
alone; worth doing as its own change if a fourth appears.

---

## ADR-030

Decision

The navbar is rendered once by the application shell (app.html) and enabled with
four links: Home, Doctors, My Appointments, Doctor Dashboard.

Reason

Every feature was reachable only by typing a URL. The navbar existed but had
never been switched on: it was commented out in landing.html, its stylesheet was
empty, and its links were all href="#".

In the shell rather than per page, so no feature renders its own copy and there is
one place to change. This also settles the open question carried in the roadmap
since Phase 1.

What the navbar knows

Routes and labels, in one array. No services, no feature imports, no state.
Active highlighting is RouterLinkActive with ariaCurrentWhenActive, not custom
logic. Home matches exactly, or '/' would look active everywhere; the others
match by prefix, so a doctor profile keeps Doctors highlighted.

Removals

Specialties, About, Login and Register were dead href="#" links to routes that do
not exist, and Login is an explicit non-goal. The Book Appointment button was
also removed: booking needs a doctor, so a global button could never work.

Not sticky

Doctor Details and Appointment Booking both have sticky sidebars at top: 24px. A
bar pinned to the top of the viewport would sit over them, so the navbar scrolls
with the page. Making it sticky is a fine follow-up, but it needs those two
sidebars raised first — which is a change to finished features.

Consequence

Pages set min-height: 100vh, so the navbar's height now makes every page
marginally taller than the viewport. Left alone rather than editing five finished
stylesheets; the fix is min-height: calc(100vh - <navbar height>) per page.

Also fixes the NG8113 warning the build has carried since Phase 1: Landing
imported Navbar without using it. The build is now warning-free.

---

## ADR-031

Decision

Hospital search is a new feature at features/hospitals, lazy-loaded at
/hospitals. It reuses the existing hospital domain untouched and adds one method
to HospitalService: searchByText(query).

Reason

The existing search(criteria) narrows by several structured filters at once,
which is an AND. A single box asking "does this word appear in the name, the city
or a department" is an OR. Layering either on the other would obscure both, so
they sit side by side. Filtering stays in the service; the page only holds the
query.

Note that search(criteria) now has no consumer. It is fully tested and is the
seam a structured filter panel would use, so it stays.

URL synchronisation

Follows ADR-021 — the query is in the URL, so a search survives a refresh and can
be shared — with one difference from doctor search: results update as you type
rather than on submit.

That difference forces two choices. The URL is written with replaceUrl, because
typing is not navigation history and a five-letter word should not cost five back
presses. And the box is bound to a local signal seeded from the parameter rather
than to the parameter directly: rebinding a text input to an awaited navigation
drops characters when someone types quickly.

No debounce. Filtering twelve records in memory is immediate, and a debounce
would add a delay with nothing to hide behind it. It becomes worth adding when
the query reaches an API.

Components

HospitalCard is feature-local. Hospital Details is a non-goal this phase, so the
search page is its only consumer, and this phase's rule was to promote nothing
without two. shared/components/ui/README.md previously listed hospital-card as a
future resident; that expectation is now recorded as conditional on Hospital
Details arriving.

Reused rather than rebuilt: Avatar for the logo, RatingStars for the rating,
TagList for the departments, EmptyState for no matches. Nothing new was added to
shared.

View Details

Disabled while /hospitals/:id does not exist, rather than linking to a route that
would bounce off the wildcard — the same call ADR-018 made for DoctorCard's
detailsRoute. The input is already there for Hospital Details to fill.

Landing page

The "Find Hospitals" card had no routerLink and had been inert since Phase 1.
Given one attribute, symmetrical with the doctors card beside it. The navbar was
not touched, as instructed, so this is the only way in.

---

## ADR-032

Decision

Hospital Details at /hospitals/:hospitalId, in the existing hospitals feature. No
new service method, no new model, no new mock data.

Reason

Everything it needs already existed: HospitalService.getById for the profile and
DoctorService.getByHospital — the seam ADR-025 added — for the doctor list. The
page only composes.

Unknown and malformed ids render not-found in place through the shared
toRouteId, per ADR-023.

Doctors

Rendered with DoctorCard, with practice omitted (it is the page you are on) and
actions omitted, so no booking action appears here. Doctor Details remains the
single booking entry point, and the cards link there.

HospitalCard

detailsRoute became input.required and the temporary disabled branch was
removed. Every consumer now has a route, so the null case was dead code rather
than a state worth keeping.

Still feature-local. Hospital Details renders its own header rather than a card,
so the search page is still HospitalCard's only consumer and the two-consumer
rule from ADR-024 is not yet met.

---

## ADR-033

Decision

Mock authentication in AuthService, in-memory only. Two lazy routes (/login,
/verify-otp), an authGuard and a roleGuard factory, and role-based navbar links.
Fixed OTP 123456.

Reason

The application needed role-based access without a backend. Signals hold the
session, so the navbar and the guards read the same source with no store and no
event bus. Nothing is written to localStorage, sessionStorage or a cookie —
asserted by a test — so a refresh signs the user out. That is the honest
consequence of not persisting, not an oversight.

Three-step handshake

requestOtp → verifyOtp → loginAs, and each step refuses to skip its predecessor:
verifyOtp answers 'no-request' if no code was asked for, and loginAs returns
false unless a code was verified. Without that last check the role selector
would itself be a way in.

Guards

authGuard sends unauthenticated users to /login with the attempted URL as
?redirect=, so they resume where they were going rather than landing on a
default page.

roleGuard(...roles) sends a signed-in user with the wrong role to their own home,
not to /login. They are authenticated but not entitled, and returning them to a
sign-in form they already completed reads as a broken app.

Both guards sit on the parent route (/doctor, /admin), so every child is covered
by one rule and a new page under either cannot be added unprotected by accident.

Navbar

Reads the role from AuthService and picks from a table of link sets. Still no
feature imports, no state of its own, and highlighting is still RouterLinkActive
(ADR-030). Logout is a button styled as a link, because it is an action rather
than a destination. Hospitals was added to the public set, which had been missing
since ADR-031.

Admin placeholder

/admin is the admin role's home and the subject of a guard, so the route must
exist or that redirect would bounce off the wildcard. features/admin holds a
placeholder page; the portal itself is a later phase.

---

## ADR-034

Decision

The admin panel is a read-only operational dashboard at /admin, reading through a
new AdminService that aggregates DoctorService, HospitalService and
BookingService. StatCard was promoted to shared.

Reason

AdminService owns no data — it asks the existing services, so the admin figures
cannot disagree with the pages they describe, and the counting stays out of the
component.

Promotion

DashboardStatCard moved from features/doctor-dashboard/components to
shared/components/ui/stat-card and was renamed StatCard. The admin summary is its
second genuine consumer, which is the bar ADR-024 sets. The doctor dashboard was
updated to import it from shared; nothing about its behaviour changed.

Mock actions

View links to the profile that already exists — /doctors/:id and /hospitals/:id —
so it is real navigation rather than a stub. Appointments have no profile page, so
their View toggles an inline detail row, which avoids the modal the non-goals rule
out.

Enable/Disable holds a local Set of doctor ids and is not saved. The Active
Doctors figure counts available-and-not-disabled, so the toggle visibly does
something; a test asserts the service still reports the unmodified count.

Deliberately absent

No CRUD, forms, modals, charts, sorting, pagination, export or user management,
per the brief. Tables are plain markup with scope attributes rather than a
data-table component, since one consumer does not justify one.

Appointment rows show the reference in the patient column, because the mock
history is a single patient's and carries no patient name. Worth revisiting when
appointments belong to identifiable patients.

---

## ADR-035

Decision

Hospitals are registered by an administrator at /admin/hospitals/new, behind the
existing admin role guard. There is no public or self-service hospital
registration.

Reason

A hospital listing is a claim patients act on: they choose where to take a sick
child from the name, the departments and the rating shown. Anyone who could
self-register could publish that claim unverified, and the application has no way
to check a registration number, an address or an ownership document — the
Registration fields on a doctor exist precisely because credentials are supposed
to be verifiable.

Admin-controlled registration keeps a human between a submission and a public
listing. It also matches where the data already comes from: hospitals are
referenced by doctors' practices and counted into the search, so an unvetted row
would immediately affect other features' figures.

Self-service would need an approval state (draft, pending, published), a claim
flow proving someone represents the hospital, and an audit trail. All three are
out of scope, and none of them makes sense before a backend exists.

Reactive Forms here, signals elsewhere

The only ReactiveFormsModule page in the app. Eight fields with cross-field
validation is where a FormGroup earns its keep; the search panels stay
signal-bound, which ADR-011 left room for. City is a SearchableDropdown, not free
text, because HospitalAddress holds a real City and derives its district from it —
the dropdown's selection is mirrored into a cityId control rather than
implementing ControlValueAccessor, so the shared component was not modified.

Storage

HospitalService now holds its list in a signal seeded from the mock, and all
internal reads go through it, so a registered hospital is immediately visible to
getById, search, searchByText and the admin dashboard. In memory only, like the
session in ADR-033: a refresh restores the mock. The id continues the mock's
sequence, so it cannot collide with a seeded one.

A registered hospital starts with no departments, facilities or opening hours,
because the form does not collect them, and doctorCount 0, because that is derived
from doctors' practices (ADR-025) rather than set here.

Amendment — registration is account creation only

Registration answers who the hospital is and how to reach them: name, type,
contact person, email, mobile, city, address, and optionally a registration
number and website. Everything describing what the hospital does, or how well,
is profile completion and will be done by the hospital itself in a later phase
rather than by the platform admin registering them.

HospitalDraft therefore no longer carries `description` or `rating`. They had
survived as optional fields after the form stopped collecting them, which left
the draft able to express a claim nothing could produce — and a rating in
particular is the one field an onboarding form has no business accepting, since
it is earned rather than declared (the same reasoning as the empty credentials
in ADR-037).

Both remain on the Hospital entity, where the seeded mocks and every read path
still use them. addHospital now defaults description to '' and leaves rating
undefined, alongside the empty departments, facilities and opening hours it
already produced.

This also supersedes ADR-036's summary of registration as "name and city, and
nothing else". The reason that sentence gave still holds — registration must be
completable from a phone call — but the field set it described has since grown
to the contact details above. No operational information was added.

---

## ADR-036

Decision

Operational information — opening hours, departments, facilities — is managed on
a separate page at /admin/hospitals/:id/manage, not on the registration form.

Reason

Registration answers "does this hospital exist and where is it", which an
administrator can complete from a phone call. Operational detail answers "what
does it do and when", which usually needs someone at the hospital to confirm. Two
questions, two moments, and forcing them into one form would mean an admin either
guesses or abandons the registration.

Keeping them apart also keeps registration honest about what is required: name
and city, and nothing else (ADR-035). A hospital exists as soon as it is known to
exist, and its profile is completed incrementally as facts arrive — the same
reason Save is one button per page rather than one per section.

The management page is the only place these three lists can be edited. Hospital
editing beyond them is out of scope.

Departments are Specialties

Hospital.departments is Specialty[], and hospital search matches on it, so free
text has to resolve to one. The service reuses an existing specialty when the
name matches case-insensitively and mints an id only for a genuinely new name,
which keeps a newly added "Neurologist" findable by the existing search rather
than creating a second, unsearchable one.

One interval per day

The form edits seven days, each with a closed toggle and one interval, and stores
each open day as its own OpeningHours entry with a single-day `days` array. The
existing structure already expresses that, so the model did not change — a
seeded 'Mon – Sat' window simply reads back as six rows.

A consequence: saving re-writes those windows per day, so a hospital that was
seeded with one grouped window will afterwards hold up to seven. Hospital Details
renders them through the same label helper either way.

Signals, not Reactive Forms

Registration uses a FormGroup because it is a fixed field set (ADR-035). This page
is two lists and seven toggles, which a FormGroup would fight, so it edits local
signals and writes to the service only on Save. That is what makes Cancel a real
discard rather than an undo.

---

## ADR-037

Decision

A doctor is registered by an administrator at /admin/doctors/new against one
hospital, and their specialty is chosen from that hospital's configured
departments rather than typed freely.

Reason

The specialty is not a label on the doctor; it is the claim that this hospital
provides this care through this person. Free text would let the two disagree —
a cardiologist assigned to a hospital that runs no cardiology — and a patient
filtering hospitals by department would find one whose only cardiologist is not
reachable through it.

Free text would also mint orphan specialties. Doctor search filters by specialty
id (ADR-016), so "Cardiology", "cardiology" and "Cardiologist" typed on three
occasions would become three ids, none of which matches the seeded one, and each
new doctor would quietly vanish from the search that should find them.

Scoping the dropdown makes the invalid state unreachable rather than merely
validated against, and it gives the two admin pages a deliberate order:
a hospital's departments are configured first (ADR-036), then doctors are
assigned to them. A hospital with no departments cannot take a doctor yet, and
the form says so instead of silently offering an empty list.

Derived doctor counts

Hospital.doctorCount was baked into the mock at build time, so a newly registered
doctor would not have moved it. HospitalService now recomputes it from
DoctorService.getByHospital at read time, through a computed so repeated reads
keep object identity. One direction only — Hospital reads Doctor, never the
reverse — so there is no cycle, and every count (admin summary, hospital search,
hospital details) follows a registration at once.

What a registered doctor does not get

Education, registrations, reviews, languages and ratings start empty. The form
does not collect them, and inventing them would put unverifiable credentials on
a public profile — the same reasoning as ADR-035.

---

## ADR-038

Decision

A platform admin's responsibility ends when the hospital account exists and its
credentials have been handed over. Completing the operational profile is the
hospital admin's job, done after their first sign-in.

Registration therefore finishes at /admin/hospitals/:id/registered, which shows
the Hospital ID, the username and a temporary password, rather than returning to
the dashboard.

Reason

Two different people, with two different kinds of knowledge. A platform admin can
establish that a hospital exists and how to reach it from a phone call — that is
what ADR-035 scoped registration to. Which departments run, which facilities are
available and when the doors open are facts only the hospital itself holds
reliably, and ADR-036 already split them onto their own page for exactly that
reason. ADR-038 finishes the thought by naming who does it.

Without that boundary the platform admin becomes a data-entry clerk for every
hospital on the platform, transcribing operational detail second-hand, and every
listing patients act on is only as accurate as the last phone call. Handing over
credentials moves the work to the party who can keep it current.

It also gives the two roles a clean audit story once a backend exists: the
platform admin created the account, and everything after that was the hospital's
own edit.

The credentials screen is a route, not a page state

The opposite call to ADR-027, which made booking confirmation a state because a
confirmation had nothing to show unless a booking had just happened in that
component. Here the page reads the hospital back from HospitalService by route id,
so it needs nothing passed through navigation and no hidden state: /admin/hospitals/13/registered
renders on its own.

A malformed id, an unknown id, and a seeded hospital that was never registered all
resolve to the same not-found state, so the template branches once (ADR-023). The
last case matters: the mock hospitals carry no account code, and this page must not
invent credentials for them.

Because the store is in memory (ADR-035), refreshing the credentials screen loses
the hospital and lands on not-found. That is the honest consequence of not
persisting, the same as the session in ADR-033, and the page says so rather than
implying the password can be retrieved later.

Mock credentials

Hospital ID is a stored field, `hospitalCode`, issued from a counter starting at
HSP-100001. Stored rather than derived from `id` so the code an admin reads out
cannot change if the list is later ordered or filtered differently. The seeded
hospitals have none, which is what makes them distinguishable from registered
ones.

Username is the email the form already collects. No second identifier is minted,
so there is nothing that can disagree with the contact address.

The temporary password is the fixed constant `Temp@1234`, the same call ADR-033
made with MOCK_OTP. A random string would imply a credential store, an expiry and
a reset path — none of which exist. It now lives in HospitalService as
TEMPORARY_PASSWORD, moved there when hospital sign-in became its second consumer:
the screen that shows it and the form that checks it read one value, and the
hospital portal does not import from the admin feature to get it.

No User model, no authentication and no storage were introduced. The credentials
are derived from hospital data at render time and exist nowhere else.

Copy Credentials

Interface only, per the brief: no Clipboard API, no toast. The button is in the
markup so the layout and the action set are settled; wiring it is a later change
that touches one handler.

Consequences

Hospital Registration no longer navigates to /admin on save, so
hospital-registration.spec.ts asserts the wrong destination and will need
updating. Left alone deliberately — tests run as their own milestone.

The management page at /admin/hospitals/:id/manage stays as it is and remains
admin-only. It is the interim path to the operational profile until the hospital
portal exists, which is a later phase and out of scope here.

Hospital sign-in

/hospital/login implements the entry point this decision described, as a lazy
feature group (ADR-019) with /hospital/welcome as a placeholder. The credential
check is local to the login component: it matches the email against the hospitals
HospitalService holds and compares the password to TEMPORARY_PASSWORD. Nothing is
written, so signing in establishes no session — the welcome page is reachable
directly by URL, and that is the honest limit of a navigation-only phase.

AuthService was not touched. Its roles are patient, doctor and admin, and its
handshake is phone plus OTP (ADR-033); a hospital signs in with an email and an
issued password, which is a different mechanism for a different subject. Adding a
fourth role would have meant changing a finished feature to serve a mock that
stores nothing.

One error message covers both a wrong email and a wrong password, so the form does
not confirm whether an account exists.

What a hospital may edit about itself

Setup step one lets a hospital change its contact person, phone and website, and
shows its name, type, registration number, email, city and address read-only. The
split follows this decision's own logic: the read-only fields are the account and
legal identity the platform admin established and can verify, while contact details
are operational facts that go stale and that only the hospital notices.

Enforced by shape, not by disabling inputs. The three editable fields are the whole
FormGroup, and HospitalContactUpdate carries only those three, so there is no path
from this page that could write a name or an email even if the markup changed.

The hospital travels through the wizard as the same ?hospitalId= query parameter
the welcome page uses, and every step resolves it through the one not-found path
(ADR-023). Still no session, so a refresh mid-wizard shows the unavailable state.

The validators registration already used — notBlank, the ten-digit phone pattern
and the optional-http(s) URL check — moved to @core/utils/hospital-validators when
this page became their second consumer, so the two forms cannot drift apart.

---

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