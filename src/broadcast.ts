type Subscriber = (event: { type: string; payload: unknown }) => void

const channels = new Map<string, Set<Subscriber>>()

export function subscribe(listId: string, cb: Subscriber): () => void {
  if (!channels.has(listId)) channels.set(listId, new Set())
  channels.get(listId)!.add(cb)
  return () => {
    const subs = channels.get(listId)
    if (!subs) return
    subs.delete(cb)
    if (subs.size === 0) channels.delete(listId)
  }
}

export function broadcast(listId: string, type: string, payload: unknown): void {
  channels.get(listId)?.forEach(cb => cb({ type, payload }))
}
