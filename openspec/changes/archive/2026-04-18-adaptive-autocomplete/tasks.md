## 1. Device Detection

- [x] 1.1 Add a `useIsTouch` hook in `client/src/lib/useIsTouch.ts` that returns `true` when `window.matchMedia('(pointer: coarse)').matches`

## 2. Mobile Chips UI

- [x] 2.1 Add `.autocomplete-chips` CSS block to `index.css`: horizontal flex row, `overflow-x: auto`, `gap: 8px`, `padding: 6px 0`
- [x] 2.2 Add `.autocomplete-chip` CSS: `<button>` style, min-height 44px, pill shape, primary border color, name-only label
- [x] 2.3 In `ItemInput.tsx`, render chips strip (instead of dropdown) when `useIsTouch()` is true and suggestions exist — each chip calls `submit(s.name)` on tap

## 3. Desktop Tab Cycling

- [x] 3.1 In `ItemInput.tsx` `handleKeyDown`, handle `Tab` key: if dropdown visible and not on last suggestion, advance `activeIdx` and call `e.preventDefault()`; if on last suggestion, clear `activeIdx` and let native Tab proceed
- [x] 3.2 Handle `Shift+Tab`: if dropdown visible and `activeIdx > 0`, retreat `activeIdx` and call `e.preventDefault()`; if `activeIdx === 0`, set to -1 and let native Tab proceed

## 4. Remove Store Area from Dropdown

- [x] 4.1 Remove the `<span className="autocomplete__area">` element from the dropdown item template in `ItemInput.tsx`
- [x] 4.2 Remove the `.autocomplete__area` CSS rule from `index.css`

## 5. Verify

- [x] 5.1 On desktop: type a partial item name, confirm dropdown appears, Tab cycles suggestions, Enter adds the item, store area label is gone
- [x] 5.2 On mobile (or Chrome DevTools touch emulation): type a partial item name, confirm chips appear (not dropdown), tap a chip to add the item
