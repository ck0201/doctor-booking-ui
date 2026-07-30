# ui

Presentational display components — they render data and raise events, and hold
no input state of their own.

Currently here:

| Component      | Notes                                                     |
| -------------- | --------------------------------------------------------- |
| `avatar`       | Photo with initials fallback; sized via `--avatar-size`    |
| `rating-stars` | Glyph, optional count, accessible sentence; inherits colour |
| `profile-section` | Titled card section for detail pages (ADR-022)          |
| `tag-list`     | Pill labels; `primary` and `neutral` variants              |
| `empty-state`  | Projected message, optional `[emptyStateActions]`          |
| `stat-card`    | One headline figure; promoted in ADR-034                    |
| `doctor-card`  | Standard mode only (ADR-017)                               |

Density and sizing are CSS custom properties rather than inputs, so consumers
can vary them per breakpoint (ADR-024).

Next to land: `rating-summary`, `spinner`, `pagination`,
`doctor-card-skeleton`.

`hospital-card` lives in `features/hospitals/` for now — the search page is its
only consumer. Hospital Details would be the second, and that is when moving it
here is justified (ADR-031).

See `../README.md` for the grouping rules.
