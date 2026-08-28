// In-memory pub/sub for SSE. Single-instance only (dev / single container).
// For multi-instance production, replace with Redis pub/sub.
type Listener = (msg: unknown) => void

const channels = new Map<string, Set<Listener>>()

export function subscribe(conversationId: string, fn: Listener): () => void {
  let set = channels.get(conversationId)
  if (!set) {
    set = new Set()
    channels.set(conversationId, set)
  }
  set.add(fn)
  return () => {
    set!.delete(fn)
    if (set!.size === 0) channels.delete(conversationId)
  }
}

export function publish(conversationId: string, data: unknown) {
  const set = channels.get(conversationId)
  if (!set) return
  for (const fn of set) {
    try {
      fn(data)
    } catch {}
  }
}
