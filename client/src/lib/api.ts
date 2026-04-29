import type { GroceryList, Item, Store, ListSummary, Member, User } from '../types'

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
  requestOtp: (email: string) =>
    request<{ message: string }>('/api/auth/request-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyOtp: (email: string, code: string) =>
    request<User>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    }),

  logout: () => request<{ message: string }>('/api/auth/logout', { method: 'POST' }),

  getMe: () =>
    fetch('/api/auth/me').then(res => {
      if (res.status === 401) return null
      if (!res.ok) return null
      return res.json() as Promise<User>
    }),

  getMyLists: () => request<ListSummary[]>('/api/users/me/lists'),

  createList: (name?: string) =>
    request<{ id: string; name: string }>('/api/lists', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  getList: (id: string) => request<GroceryList>(`/api/lists/${id}`),

  updateListName: (id: string, name: string) =>
    request<{ id: string; name: string }>(`/api/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    }),

  updateListStore: (id: string, storeId: string) =>
    request<{ id: string; store_id: string }>(`/api/lists/${id}/store`, {
      method: 'PATCH',
      body: JSON.stringify({ store_id: storeId }),
    }),

  getStores: () => request<Store[]>('/api/stores'),

  getStoreDictionary: (storeTypeId: string) =>
    request<Record<string, string>>(`/api/store-types/${storeTypeId}/dictionary`),

  addItem: (
    listId: string,
    data: { name: string; store_area: string; area_overridden: boolean }
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

  getMembers: (listId: string) => request<Member[]>(`/api/lists/${listId}/members`),

  inviteMember: (listId: string, email: string) =>
    request<Member>(`/api/lists/${listId}/members`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  removeMember: (listId: string, userId: string) =>
    request<void>(`/api/lists/${listId}/members/${userId}`, { method: 'DELETE' }),
}
