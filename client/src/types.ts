export type StoreArea = string

export interface Store {
  id: string
  name: string
  store_type_id: string
  store_type_name: string
  areas: string[]
}

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
  store_id: string
  store_type_id: string
  areas: string[]
  items: Item[]
  history: HistoryEntry[]
}
