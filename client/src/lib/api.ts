import type { GroceryList, Item, StoreArea } from '../types'

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error((err as { error?: string }).error ?? 'Request failed')
  }
  if (res.status === 204) return undefined as T
  return res.json()
}

export const api = {
  createList: (email: string, name?: string) =>
    request<{ id: string; name: string }>('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    }),

  recoverLists: (email: string) =>
    request<{ message: string }>('/api/recover', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  getList: (id: string) => request<GroceryList>(`/api/lists/${id}`),

  updateListName: (id: string, name: string) =>
    request<{ id: string; name: string }>(`/api/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  addItem: (
    listId: string,
    data: { name: string; store_area: StoreArea; area_overridden: boolean }
  ) =>
    request<Item>(`/api/lists/${listId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateItem: (
    listId: string,
    itemId: string,
    data: Partial<Pick<Item, 'name' | 'store_area' | 'area_overridden' | 'checked'>>
  ) =>
    request<Item>(`/api/lists/${listId}/items/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteItem: (listId: string, itemId: string) =>
    request<void>(`/api/lists/${listId}/items/${itemId}`, { method: 'DELETE' }),

  clearChecked: (listId: string) =>
    request<void>(`/api/lists/${listId}/items?checked=true`, { method: 'DELETE' }),
}
