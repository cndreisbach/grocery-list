## Context

The current classifier in `client/src/lib/classify.ts` uses three steps: exact history match, exact bundled-dictionary match, and edit-distance fuzzy matching. This works for returning items and typos, but not for common multi-word variants whose important grocery concept appears as only part of the input.

Examples:
- `instant oatmeal` should classify like `oatmeal` → `Pantry`
- `chicken tenders` should classify like `chicken` → `Meat & Seafood`
- `low sodium chicken broth` should classify like `chicken broth` → `Pantry`, not generic `chicken`

The improvement should stay deterministic, cheap to compute, and easy to reason about. It should not require any API or schema changes.

## Goals / Non-Goals

**Goals:**
- Preserve existing precedence for exact matches from history and dictionary
- Keep matching behavior case-insensitive by consistently using normalized item names and tokens
- Add a token/phrase-based fallback before typo fuzzy matching
- Prefer the most specific contained known phrase when multiple candidates match
- Reuse the existing history and dictionary data sources
- Cover the new behavior with focused classifier tests

**Non-Goals:**
- Machine-learning or semantic classification
- Re-ranking autocomplete suggestions
- Adding new persistence or backend classification logic
- Solving every ambiguous grocery phrase perfectly

## Decisions

### Classification order: exact → contained phrase/token → fuzzy

The classifier will keep its current high-confidence first steps:
1. exact normalized history match
2. exact normalized dictionary match

If no exact match exists, it will perform containment matching before typo fuzzy matching:
3. contained history phrase/token match
4. contained dictionary phrase/token match
5. edit-distance fuzzy match
6. `Other`

This preserves the current behavior for known items and typos while adding a more intuitive fallback for multi-word variants.

### Containment matching uses normalized whole-word tokens

Containment matching should operate on normalized word tokens rather than raw substring checks. This avoids bad matches such as matching `ham` inside `shampoo`.

Implementation sketch:
- normalize the input name
- split it into word tokens
- normalize candidate history/dictionary entries and split them into tokens
- consider a candidate a match when all of its tokens appear in the input tokens in order as a contiguous phrase, or as a single token match for one-word entries

This allows:
- `instant oatmeal` to match `oatmeal`
- `low sodium chicken broth` to match `chicken broth`
- `ground beef tacos` to match `ground beef`

### Prefer the most specific contained match

When multiple candidates match, the classifier should prefer the most specific candidate rather than the first one encountered.

Ranking:
1. more matched tokens
2. longer normalized candidate phrase length
3. history over dictionary when otherwise tied
4. existing history order as the tie-breaker within history

This ensures `chicken broth` beats `chicken` when both are present.

## Risks / Trade-offs

- **Ambiguous products remain ambiguous**: `chicken tenders` could mean fresh meat or frozen prepared food. The initial heuristic will choose the best contained known phrase, which is acceptable for a first step.
- **Tokenization simplicity**: a simple whitespace-based tokenization is likely enough here, but punctuation handling should be considered so `half-and-half` style names normalize sensibly if encountered.
- **Broader matching means broader mistakes**: containment matching can introduce false positives if too permissive. Whole-word phrase matching and longest-match preference keep that risk bounded.
