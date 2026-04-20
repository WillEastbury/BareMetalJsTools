# BareMetalStyles

Minimal CSS framework implementing only the ~200 Bootstrap 5 classes actually used across BareMetalWeb, PicoWAL, and RP2350B_Bitnet. **Zero JavaScript, zero build step, zero dependencies.**

## Quick start

```html
<link rel="stylesheet" href="BareMetalStyles.css">
```

Or via the package export:

```js
import 'baremetal-js-tools/styles';
```

## What's included

| Category | Examples | Count |
|---|---|---:|
| Grid / Layout | `container-fluid`, `row`, `col-md-*` (sm/md/xl breakpoints) | ~50 |
| Flexbox | `d-flex`, `align-items-center`, `justify-content-between`, `gap-*` | 18 |
| Spacing | `m-*`, `p-*`, `gap-*` (0–5 scale + auto) | 42 |
| Typography | `small`, `display-4/5`, `fs-*`, `fw-bold`, `text-truncate` | 18 |
| Text / BG colors | `text-primary`, `bg-success`, `bg-primary-subtle` | 24 |
| Borders / Rounding | `border`, `rounded-pill`, `shadow-sm` | 15 |
| Buttons | `btn`, `btn-primary`, `btn-outline-*`, `btn-close`, `btn-group` | 22 |
| Forms | `form-control`, `form-select`, `form-check`, `form-switch`, `input-group`, validation | 17 |
| Tables | `table`, `table-hover`, `table-striped`, `table-responsive` | 11 |
| Cards | `card`, `card-body`, `card-header` | 5 |
| List groups | `list-group`, `list-group-item`, `list-group-flush` | 7 |
| Badges | `badge` | 1 |
| Nav / Dropdowns | `navbar`, `nav-link`, `breadcrumb`, `dropdown` | 11 |
| Modals | `modal`, `modal-dialog-centered`, `modal-sm/lg` | 11 |
| Alerts | `alert`, `alert-info/success/warning/danger` | 6 |
| Spinners / Progress | `spinner-border`, `progress-bar` | 7 |
| Pagination | `pagination`, `page-item`, `page-link` | 4 |
| Positioning / Misc | `position-absolute`, `w-100`, `visually-hidden`, `fade`, `collapse` | ~15 |

## Theming

All colors, spacing, borders, and radii use CSS custom properties on `:root`. Override them to re-theme:

```css
:root {
  --bs-primary: #7c3aed;      /* purple instead of blue */
  --bs-border-radius: .5rem;   /* rounder corners */
  --bs-body-bg: #0f172a;       /* dark mode background */
  --bs-body-color: #e2e8f0;    /* dark mode text */
}
```

## Design principles

- **Usage-driven** — only classes proven in use across 3 codebases, no speculative additions
- **Bootstrap-compatible** — same class names, same semantics, drop-in replacement
- **CSS-only interactivity** — modals/dropdowns/collapses toggled via `.show` class (use `BareMetalBind` `m-if` for state)
- **Focus-visible** — all interactive elements have `:focus-visible` ring styles for accessibility
- **Flexbox grid** — 12-column system using flexbox, matching Bootstrap's wrapping/gutter behavior

## What's NOT included

- JavaScript (use BareMetalBind for reactivity)
- Carousel, offcanvas, accordion, popover, tooltip
- Print styles
- RTL-specific overrides (uses logical properties where possible)
- Responsive navbar collapse (use `m-if` + `d-none`/`d-md-block`)
