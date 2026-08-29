"use client"

import { useEffect, useState } from "react";
import { db, Template } from "@/lib/idb";


/**
 * Hook to provide nutrition templates for a given trainer.
 * It reads from IndexedDB first (instant UI) and then refreshes from the server.
 */
export function useTemplates(trainerId: string) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  // Load from IDB, then refresh from server.
  useEffect(() => {
    if (!trainerId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    // 1️⃣ Load cached templates for this trainer.
    let cancelled = false;
    db.templates
      .where("trainerId")
        .equals(trainerId as string)
      .toArray()
      .then((cached: Template[]) => {
        if (!cancelled) setTemplates(cached);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    // 2️⃣ Background refresh from the API.
    async function refresh() {
      try {
        const resp = await fetch('/api/trainer/templates', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          const fresh = data.templates as any[];
          const now = new Date().toISOString();
          const rows = fresh.map((t) => ({
            id: t.id,
            name: t.name,
            isGlobal: t.isGlobal,
            calories: t.calories,
            proteinGrams: t.proteinGrams,
            carbsGrams: t.carbsGrams,
            fatsGrams: t.fatsGrams,
            mealsCount: t._count?.meals ?? 0,
            trainerId,
            updatedAt: now,
            dirty: false,
          }));
          await db.templates.bulkPut(rows);
          if (!cancelled) setTemplates(rows);
        }
      } catch (e) {
        console.error("Failed to refresh templates", e);
      }
    }
    refresh();

    return () => {
      cancelled = true;
    };
  }, [trainerId]);

  // Placeholder for mutations – optimistic UI + dirty flag.
  async function mutate(action: "create" | "edit" | "delete", payload: Partial<Template>) {
    // Basic optimistic UI updates
    setTemplates((prev) => {
      const copy = [...prev];
      if (!trainerId) return copy;
      if (action === "create" && payload.id) {
        copy.unshift({ ...(payload as Template), trainerId, updatedAt: new Date().toISOString(), dirty: true });
      } else if (action === "edit" && payload.id) {
        const idx = copy.findIndex((t) => t.id === payload.id);
        if (idx >= 0) copy[idx] = { ...(copy[idx] as Template), ...payload, updatedAt: new Date().toISOString(), dirty: true } as Template;
      } else if (action === "delete" && payload.id) {
        return copy.filter((t) => t.id !== payload.id);
      }
      return copy;
    });
    // Write to IDB with dirty flag for later sync.
    if (payload.id) {
      await db.templates.put({ ...(payload as Template), trainerId: trainerId ?? "", updatedAt: new Date().toISOString(), dirty: true });
    }
    // Real API call – implement in a separate service when ready.
  }

  return { templates, loading, mutate };
}
