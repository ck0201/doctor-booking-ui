# Shared Components

Reusable, feature-agnostic components. A component belongs here only if it
could be dropped into any feature without modification.

Grouped by responsibility so the folder stays navigable as it grows:

| Group    | Holds                                              | Examples                                        |
| -------- | -------------------------------------------------- | ----------------------------------------------- |
| `layout/` | Page structure and app shell                       | `navbar`, later `footer`, `page-shell`          |
| `forms/`  | Anything that captures user input                  | `searchable-dropdown`, later `search-box`       |
| `ui/`     | Presentational display components (no input state) | later `doctor-card`, `pagination`, `spinner`    |

Rules

- Shared components are dumb: inputs in, outputs out, no service injection and
  no knowledge of a feature.
- Feature-specific components live under `src/app/features/<feature>/`.
- Non-component shared code goes in sibling folders (`shared/pipes/`,
  `shared/directives/`), not inside these groups.

Import with the path alias, never a relative chain:

```ts
import { SearchableDropdown } from '@shared/components/forms/searchable-dropdown/searchable-dropdown';
```
