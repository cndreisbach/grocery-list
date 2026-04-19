export type StoreArea =
  | 'Produce'
  | 'Dairy'
  | 'Bakery'
  | 'Meat & Seafood'
  | 'Frozen'
  | 'Pantry'
  | 'Beverages'
  | 'Snacks'
  | 'Household'
  | 'Personal Care'
  | 'Other'

export const STORE_AREAS: StoreArea[] = [
  'Produce',
  'Dairy',
  'Bakery',
  'Meat & Seafood',
  'Frozen',
  'Pantry',
  'Beverages',
  'Snacks',
  'Household',
  'Personal Care',
  'Other',
]

export interface Item {
  id: string
  list_id: string
  name: string
  store_area: StoreArea
  area_overridden: boolean
  checked: boolean
  created_at: string
  updated_at: string
}

export interface HistoryEntry {
  name: string
  store_area: StoreArea
  last_used: string
}

export interface GroceryList {
  id: string
  name: string
  items: Item[]
  history: HistoryEntry[]
}
