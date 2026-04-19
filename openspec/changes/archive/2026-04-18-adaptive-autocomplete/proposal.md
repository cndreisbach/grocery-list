## Why

The current autocomplete dropdown works on both desktop and mobile, but the interaction model isn't optimal for either: desktop users have no keyboard shortcut to cycle through suggestions, and mobile users must reach past the suggestion list to tap — the opposite direction from where their thumbs rest near the keyboard. The app is used on mobile ~2/3 of the time, so the mobile experience deserves a purpose-built UI.

## What Changes

- **Modified**: On touch devices (`pointer: coarse`), autocomplete suggestions are displayed as horizontal tap-friendly chips directly below the input rather than a vertical dropdown
- **Modified**: On pointer devices (`pointer: fine`), the existing dropdown gains Tab / Shift+Tab cycling through suggestions in addition to the existing arrow key navigation
- **Removed**: Store area label shown in dropdown suggestions on desktop (simplification; already displayed when item is added to the list)

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `item-autocomplete`: Suggestion UI is now adaptive — chips on touch devices, dropdown on pointer devices; dropdown gains Tab cycling

## Impact

- **Frontend only**: changes confined to `client/src/components/ItemInput.tsx` and `client/src/index.css`
- No API, backend, or data model changes
