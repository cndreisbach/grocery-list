import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from './api'
import type { User } from '../types'

export function useAuth() {
  const queryClient = useQueryClient()

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ['me'],
    queryFn: api.getMe,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  async function logout() {
    await api.logout()
    queryClient.setQueryData(['me'], null)
    queryClient.clear()
  }

  return {
    user: user ?? null,
    isLoading,
    logout,
  }
}
