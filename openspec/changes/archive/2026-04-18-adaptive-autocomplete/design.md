## Context

The item entry input currently shows autocomplete suggestions as a vertical dropdown on all devices. The change is confined entirely to the frontend (`ItemInput.tsx` and `index.css`). No API, backend, or data changes are needed.

The app is used on mobile ~2/3 of the time. Desktop users have requested Tab key cycling. Mobile users benefit from suggestion chips positioned close to the thumb.

## Goals / Non-Goals

**Goals:**
- Touch devices get horizontal suggestion chips below the input (thumb-reachable, no reaching past a dropdown)
- Pointer devices keep the existing dropdown and gain Tab / Shift+Tab cycling
- Detection is based on input device capability, not screen width

**Non-Goals:**
- Changing suggestion ranking or data sources
- Supporting hybrid devices perfectly (a tablet with a keyboard attached will get the pointer experience, which is acceptable)
- Animating the chip strip or dropdown

## Decisions

### Detection: `pointer: coarse` media query (not screen width)

`pointer: coarse` is true on touch-primary devices (phones, tablets without a mouse). `pointer: fine` is true on pointer devices (desktop, laptop). This is more semantically correct than a breakpoint — a 768px tablet in landscape is still touch-primary.

Implementation: a single CSS media query drives the visual switch. A matching `window.matchMedia('(pointer: coarse)')` call in React drives the behavioral switch (chips vs dropdown component path).

**Alternatives considered:** `max-width: 600px` breakpoint — rejected because it misclassifies wide tablets and doesn't reflect actual input modality.

### Chips: horizontal scroll, name only, no store area label

With 2–5 suggestions and limited horizontal space, chips showing only the item name are cleaner and easier to tap. The store area is shown automatically once the item is added to the list, so displaying it in the chip adds noise without value.

Each chip is a `<button>` with adequate touch target height (≥44px).

**Alternatives considered:** showing area in chip (e.g., `milk · Dairy`) — rejected as cluttered on narrow screens.

### Tab cycling: does not wrap past the last suggestion

Tab on the last suggestion dismisses the dropdown and lets focus move naturally (standard browser Tab behavior). This matches user expectations — Tab is also a "move on" key, not just a navigation key.

```
No active    → Tab         → suggestion[0] active
suggestion[0] → Tab        → suggestion[1] active
...
suggestion[N] → Tab        → dropdown dismissed, native Tab
suggestion[N] → Shift+Tab  → suggestion[N-1] active
suggestion[0] → Shift+Tab  → no active (back to input value)
```

## Risks / Trade-offs

- **Hybrid devices** (e.g., iPad with keyboard): `pointer: coarse` returns true even with a keyboard attached, so they get chips. Tab cycling won't be available. This is acceptable — the keyboard user on a tablet is an edge case.
- **`matchMedia` SSR**: Not applicable here (Vite SPA, no SSR).
- **Chip overflow on very narrow screens**: A horizontal scroll on the chip strip handles this gracefully without clipping.
