interface QueuedMutation {
  id: string
  method: string
  url: string
  body?: unknown
  timestamp: number
}

const QUEUE_KEY = 'grocery-offline-queue'

function getQueue(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function saveQueue(queue: QueuedMutation[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function queueMutation(mutation: Omit<QueuedMutation, 'id' | 'timestamp'>) {
  const queue = getQueue()
  queue.push({ ...mutation, id: crypto.randomUUID(), timestamp: Date.now() })
  saveQueue(queue)
}

export async function flushQueue(): Promise<void> {
  const queue = getQueue()
  if (queue.length === 0) return

  const remaining: QueuedMutation[] = []
  for (const mutation of queue) {
    try {
      const res = await fetch(mutation.url, {
        method: mutation.method,
        headers: { 'Content-Type': 'application/json' },
        body: mutation.body != null ? JSON.stringify(mutation.body) : undefined,
      })
      if (!res.ok) remaining.push(mutation)
    } catch {
      remaining.push(mutation)
    }
  }
  saveQueue(remaining)
}

export function hasQueuedMutations(): boolean {
  return getQueue().length > 0
}
