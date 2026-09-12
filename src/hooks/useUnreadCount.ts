"use client"

import { useEffect, useState } from "react";

export function useUnreadCount(role: "COACH" | "CLIENT", id: string | undefined) {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setCount(0);
      setLoading(false);
      return;
    }
    
    let cancelled = false;

    async function fetchCount() {
      try {
        const resp = await fetch('/api/messages/unread-count', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) setCount(data.count as number);
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchCount();
    const interval = setInterval(fetchCount, 60_000);
    
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role, id]);

  return { count, loading };
}
