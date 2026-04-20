import type { StoreArea, HistoryEntry } from '../types'
import dictionary from '../data/dictionary.json'

const dict = dictionary as Record<string, StoreArea>

const SYNONYMS: Record<string, string> = {
  pop: 'soda',
  capsicum: 'bell pepper',
  coriander: 'cilantro',
  aubergine: 'eggplant',
  courgette: 'zucchini',
  rocket: 'arugula',
  'spring onion': 'scallion',
  'green onion': 'scallion',
  'heavy whipping cream': 'heavy cream',
  'half & half': 'half and half',
  'oj': 'orange juice',
}

interface CandidateMatch {
  area: StoreArea
  tokenCount: number
  phraseLength: number
}

export function normalizeItemName(name: string): string {
  let n = name.toLowerCase().trim()

  if (SYNONYMS[n]) return SYNONYMS[n]

  // -ies → -y (berries → berry)
  if (n.endsWith('ies') && n.length > 4) return n.slice(0, -3) + 'y'
  // -oes → -o (tomatoes → tomato, potatoes → potato)
  if (n.endsWith('oes') && n.length > 4) return n.slice(0, -2)
  // regular plural: strip trailing 's' (but not 'ss')
  if (n.endsWith('s') && !n.endsWith('ss') && n.length > 3) return n.slice(0, -1)

  return n
}

function tokenize(name: string): string[] {
  return normalizeItemName(name).split(/\s+/).filter(Boolean)
}

function containsPhrase(inputTokens: string[], candidateTokens: string[]): boolean {
  if (candidateTokens.length === 0 || candidateTokens.length > inputTokens.length) return false

  for (let start = 0; start <= inputTokens.length - candidateTokens.length; start++) {
    let matches = true
    for (let i = 0; i < candidateTokens.length; i++) {
      if (inputTokens[start + i] !== candidateTokens[i]) {
        matches = false
        break
      }
    }
    if (matches) return true
  }

  return false
}

function isBetterMatch(candidate: CandidateMatch, current: CandidateMatch | null): boolean {
  if (!current) return true
  if (candidate.tokenCount !== current.tokenCount) return candidate.tokenCount > current.tokenCount
  if (candidate.phraseLength !== current.phraseLength) return candidate.phraseLength > current.phraseLength
  return false
}

function findContainedHistoryMatch(inputTokens: string[], history: HistoryEntry[]): StoreArea | null {
  let bestMatch: CandidateMatch | null = null

  for (const entry of history) {
    const normalizedName = normalizeItemName(entry.name)
    const candidateTokens = tokenize(entry.name)
    if (!containsPhrase(inputTokens, candidateTokens)) continue

    const candidate = {
      area: entry.store_area,
      tokenCount: candidateTokens.length,
      phraseLength: normalizedName.length,
    }

    if (isBetterMatch(candidate, bestMatch)) {
      bestMatch = candidate
    }
  }

  return bestMatch?.area ?? null
}

function findContainedDictionaryMatch(inputTokens: string[]): StoreArea | null {
  let bestMatch: CandidateMatch | null = null

  for (const [key, area] of Object.entries(dict)) {
    const candidateTokens = tokenize(key)
    const matches =
      containsPhrase(inputTokens, candidateTokens) ||
      (candidateTokens.length > 1 && containsPhrase(candidateTokens, inputTokens))
    if (!matches) continue

    const candidate = {
      area,
      tokenCount: candidateTokens.length,
      phraseLength: key.length,
    }

    if (isBetterMatch(candidate, bestMatch)) {
      bestMatch = candidate
    }
  }

  return bestMatch?.area ?? null
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  )
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

export function classifyItem(name: string, history: HistoryEntry[] = []): StoreArea {
  const normalized = normalizeItemName(name)
  const inputTokens = tokenize(name)

  // 1. History match (exact normalized, case-insensitive)
  const historyMatch = history.find(h => normalizeItemName(h.name) === normalized)
  if (historyMatch) return historyMatch.store_area

  // 2. Exact dictionary match
  if (dict[normalized]) return dict[normalized]

  // 3. Contained history phrase/token match
  const historyContainedMatch = findContainedHistoryMatch(inputTokens, history)
  if (historyContainedMatch) return historyContainedMatch

  // 4. Contained dictionary phrase/token match
  const dictContainedMatch = findContainedDictionaryMatch(inputTokens)
  if (dictContainedMatch) return dictContainedMatch

  // 5. Fuzzy match (Levenshtein ≤ 2) — only for inputs ≥ 4 chars to avoid noise
  if (normalized.length >= 4) {
    let bestArea: StoreArea | null = null
    let bestDist = Infinity
    for (const [key, area] of Object.entries(dict)) {
      const dist = levenshtein(normalized, key)
      if (dist < bestDist && dist <= 2) {
        bestDist = dist
        bestArea = area
      }
    }
    if (bestArea) return bestArea
  }

  return 'Other'
}

export function getSuggestions(
  input: string,
  history: HistoryEntry[],
  maxResults = 8
): Array<{ name: string; store_area: StoreArea }> {
  const query = input.toLowerCase().trim()
  if (!query) return []

  const seen = new Set<string>()
  const results: Array<{ name: string; store_area: StoreArea; score: number }> = []

  // History matches (sorted by recency — history is already ordered DESC by last_used)
  for (const entry of history) {
    if (entry.name.toLowerCase().startsWith(query) && !seen.has(entry.name.toLowerCase())) {
      seen.add(entry.name.toLowerCase())
      results.push({ name: entry.name, store_area: entry.store_area, score: 0 })
    }
  }

  // Dictionary matches
  for (const [key, area] of Object.entries(dict)) {
    if (key.startsWith(query) && !seen.has(key)) {
      seen.add(key)
      results.push({ name: key, store_area: area, score: 1 })
    }
  }

  return results.slice(0, maxResults).map(({ name, store_area }) => ({ name, store_area }))
}
