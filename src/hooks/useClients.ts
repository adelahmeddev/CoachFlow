"use client"

import { useEffect, useState } from "react";
import { db, Client } from "@/lib/idb";

import type { Goal } from "@/lib/db/enums";

/**
 * Hook to provide assignable clients for a trainer.
 * Mirrors useTemplates – cached in IndexedDB then refreshed.
 */
export function useClients(trainerId: string) {
  const [clients, setClients] = useState<Array<{ id: string; fullName: string; goal: Goal | null }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainerId) {
      setClients([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Load from IDB
    db.clients.where("trainerId").equals(trainerId as string).toArray().then((cached) => {
      if (!cancelled) {
        setClients(
          cached.map((c) => ({
            id: c.id,
            fullName: c.fullName,
            goal: c.goal as Goal | null,
          }))
        );
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    // Refresh from server
    async function refresh() {
      try {
        const resp = await fetch('/api/trainer/clients', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          const fetchedClients = data.clients as Array<{ id: string; fullName: string | null; goal: string | null }>;
          const now = new Date().toISOString();
          const rows = fetchedClients.map((c) => ({
            id: c.id,
            trainerId,
            fullName: c.fullName ?? "",
            goal: c.goal,
            updatedAt: now,
            dirty: false,
          }));
          await db.clients.bulkPut(rows);
          if (!cancelled) setClients(fetchedClients.map((c) => ({
            id: c.id,
            fullName: c.fullName ?? "",
            goal: c.goal as Goal | null,
          })));
        }
      } catch (e) {
        console.error("Failed to refresh clients", e);
      }
    }
    refresh();
    return () => { cancelled = true };
  }, [trainerId]);

   // Simple optimistic mutation (e.g., assign template to client) – placeholder.
   async function mutate(action: "assign" | "update" | "delete", payload: Partial<Client>) {
     // Update UI state (UI shape)
     if (!payload.id) return;
     setClients((prev) => prev.map((c) => (c.id === payload.id ? { ...c, ...(payload as any) } : c)));
     // Persist to IndexedDB with dirty flag (optional)
     await db.clients.put({ ...(payload as Client), trainerId, updatedAt: new Date().toISOString(), dirty: true });
   }

  return { clients, loading, mutate };
}
