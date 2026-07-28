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
| `doctor-card`  | Standard mode only (ADR-017)                               |

Density and sizing are CSS custom properties rather than inputs, so consumers
can vary them per breakpoint (ADR-024).

Next to land: `hospital-card`, `rating-summary`, `spinner`, `pagination`,
`doctor-card-skeleton`.

See `../README.md` for the grouping rules.
