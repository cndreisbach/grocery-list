## 1. Classifier Matching Order

- [x] 1.1 Update `client/src/lib/classify.ts` so classification still checks exact history and exact dictionary matches first
- [x] 1.2 Add a containment-matching step before edit-distance fuzzy matching
- [x] 1.3 Keep fuzzy matching as the fallback for typo-style near matches

## 2. Containment Matching Heuristic

- [x] 2.1 Normalize and tokenize the input and candidate item names for whole-word matching
- [x] 2.2 Match contained multi-word phrases and single meaningful tokens from history entries
- [x] 2.3 Match contained multi-word phrases and single meaningful tokens from dictionary entries
- [x] 2.4 Rank multiple matches so more specific phrases win over generic terms

## 3. Verification

- [x] 3.1 Add tests for case-insensitive matching so differently capitalized inputs classify the same as normalized lowercase inputs
- [x] 3.2 Add tests for contained dictionary matches such as `instant oatmeal` → `Pantry` and `chicken tenders` → `Meat & Seafood`
- [x] 3.3 Add tests for longest-match precedence such as `low sodium chicken broth` → `Pantry`
- [x] 3.4 Add tests confirming exact history and exact dictionary matches still take precedence over containment matching
- [x] 3.5 Run the focused classifier test suite
- [x] 3.6 Manually verify smarter section assignment in the UI
