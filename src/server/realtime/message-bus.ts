// Distributed pub/sub for SSE across multi-instance deployments.
// Uses Redis PUBLISH/SUBSCRIBE when REDIS_URL is configured (e.g. Upstash Redis).
// Falls back to in-memory event bus in local development when REDIS_URL is omitted.

import Redis from "ioredis"
import { logger } from "@/lib/logger"

type Listener = (msg: unknown) => void

const channels = new Map<string, Set<Listener>>()

let publisher: Redis | null = null
let subscriber: Redis | null = null
let redisInitialized = false

function initRedis() {
  if (redisInitialized) return
  redisInitialized = true

  const redisUrl = process.env.REDIS_URL
  if (!redisUrl) {
    logger.info("[message-bus] REDIS_URL not configured; using local in-memory emitter")
    return
  }

  try {
    const opts = {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: false,
    }

    publisher = new Redis(redisUrl, opts)
    subscriber = new Redis(redisUrl, opts)

    publisher.on("error", (err) => {
      logger.error("[message-bus] Redis publisher error", err)
    })

    subscriber.on("error", (err) => {
      logger.error("[message-bus] Redis subscriber error", err)
    })

    subscriber.on("message", (channel: string, message: string) => {
      const prefix = "conversation:"
      if (!channel.startsWith(prefix)) return
      const conversationId = channel.slice(prefix.length)
      const listeners = channels.get(conversationId)
      if (!listeners || listeners.size === 0) return

      try {
        const parsed = JSON.parse(message)
        for (const fn of listeners) {
          try {
            fn(parsed)
          } catch (err) {
            logger.error("[message-bus] Listener execution failed", err)
          }
        }
      } catch (err) {
        logger.error("[message-bus] Failed to parse pub/sub message", err)
      }
    })

    logger.info("[message-bus] Redis pub/sub connected successfully")
  } catch (err) {
    logger.error("[message-bus] Failed to initialize Redis clients; falling back to memory bus", err)
    publisher = null
    subscriber = null
  }
}

export function subscribe(conversationId: string, fn: Listener): () => void {
  initRedis()

  let set = channels.get(conversationId)
  const isFirstListener = !set || set.size === 0
  if (!set) {
    set = new Set()
    channels.set(conversationId, set)
  }
  set.add(fn)

  if (subscriber && isFirstListener) {
    subscriber.subscribe(`conversation:${conversationId}`).catch((err) => {
      logger.error(`[message-bus] Failed to subscribe to conversation:${conversationId}`, err)
    })
  }

  return () => {
    const currentSet = channels.get(conversationId)
    if (currentSet) {
      currentSet.delete(fn)
      if (currentSet.size === 0) {
        channels.delete(conversationId)
        if (subscriber) {
          subscriber.unsubscribe(`conversation:${conversationId}`).catch((err) => {
            logger.error(`[message-bus] Failed to unsubscribe from conversation:${conversationId}`, err)
          })
        }
      }
    }
  }
}

export function publish(conversationId: string, data: unknown) {
  initRedis()

  const payload = JSON.stringify(data)

  if (publisher) {
    publisher.publish(`conversation:${conversationId}`, payload).catch((err) => {
      logger.error(`[message-bus] Failed to publish message to conversation:${conversationId}`, err)
    })
  }

  // Also notify local listeners if Redis is not active
  if (!publisher) {
    const set = channels.get(conversationId)
    if (set) {
      for (const fn of set) {
        try {
          fn(data)
        } catch {}
      }
    }
  }
}
