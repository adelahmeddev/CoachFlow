"use client"

import { useEffect, useState } from "react";

export function useUnreadCount(role: "COACH" | "CLIENT", id: string | undefined) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(Boolean(id));

  useEffect(() => {
    if (!id) return;
    
    let cancelled = false;

    async function fetchCount() {
      try {
        const resp = await fetch('/api/messages/unread-count', { credentials: 'include' });
        if (resp.status === 401) {
          clearInterval(intervalId);
          return;
        }
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) setCount(data.count as number);
        }
      } catch {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchCount();
    const intervalId = setInterval(fetchCount, 120_000);
    
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [role, id]);

  return { count, loading };
}
