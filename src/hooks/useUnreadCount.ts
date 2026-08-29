"use client"

import { useEffect, useState } from "react";
import { db } from "@/lib/idb";


const TTL_MS = 5 * 60 * 1000; // 5 minutes

export function useUnreadCount(role: "TRAINER" | "CLIENT", id: string | undefined) {
  const cacheKey = id ? `${role}-${id}` : undefined;
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setCount(0);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // 1️⃣ Read from IndexedDB if fresh
    (async () => {
      const rec = await db.unreadCounts.get(cacheKey as string);
      if (rec && Date.now() - rec.ts < TTL_MS) {
        if (!cancelled) setCount(rec.count);
      }
      // always fetch fresh count in background
      fetchCount();
    })();

async function fetchCount() {
  try {
    const resp = await fetch('/api/messages/unread-count', { credentials: 'include' });
    if (resp.ok) {
      const data = await resp.json();
      const fresh = data.count as number;
      if (!cancelled) {
        setCount(fresh);
        await db.unreadCounts.put({ key: cacheKey as string, count: fresh, ts: Date.now() });
      }
    }
  } catch (e) {
    console.error('Failed to fetch unread count', e);
  } finally {
    if (!cancelled) setLoading(false);
  }
}

    // optional periodic refresh – every minute
    const interval = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [cacheKey, role, id]);

  return { count, loading };
}
