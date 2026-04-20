## Why

The current store-area classifier handles exact matches against list history and the bundled dictionary, plus small typo corrections via edit-distance fuzzy matching. That works for items like `brocoli` and `tomatoe`, but it fails for common multi-word variants such as `instant oatmeal` and `chicken tenders` when only a meaningful token or sub-phrase is known.

This makes auto-assignment feel overly literal. Users reasonably expect an unknown multi-word item to inherit the store area of a known grocery concept contained inside it, especially when that concept is already present in history or the bundled dictionary.

## What Changes

- **Modified**: Store-area classification will use normalized, case-insensitive matching for exact, contained-phrase, and fuzzy comparison steps
- **Modified**: Store-area classification will try exact history and dictionary matches first, then fall back to token/phrase-based matching before edit-distance fuzzy matching
- **Modified**: Classification will prefer more specific contained matches (for example, `chicken broth` over `chicken`) when multiple known phrases are present
- **Modified**: Test coverage will expand to cover case-insensitive matching, multi-word variants, and longest-match precedence

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `store-area-classification`: Unknown multi-word item names can inherit a store area from meaningful contained history or dictionary terms before typo-style fuzzy matching

## Impact

- **Frontend only**: changes are confined to the client-side classifier and its tests
- No API, backend, or data model changes
