"use client"

import { useEffect, useState } from "react";

type TemplateState = {
  id: string;
  name: string;
  isGlobal: boolean;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatsGrams: number | null;
  mealsCount: number;
};

export function useTemplates(trainerId: string) {
  const [templates, setTemplates] = useState<TemplateState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainerId) {
      setTemplates([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchTemplates() {
      try {
        const resp = await fetch('/api/trainer/templates', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) {
            setTemplates(data.templates.map((t: any) => ({
              id: t.id,
              name: t.name,
              isGlobal: t.isGlobal,
              calories: t.calories,
              proteinGrams: t.proteinGrams,
              carbsGrams: t.carbsGrams,
              fatsGrams: t.fatsGrams,
              mealsCount: t._count?.meals ?? 0,
            })));
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchTemplates();
    return () => { cancelled = true; };
  }, [trainerId]);

  async function mutate(action: "create" | "edit" | "delete", payload: Partial<TemplateState>) {
    setTemplates((prev) => {
      const copy = [...prev];
      if (!trainerId) return copy;
      if (action === "create" && payload.id) {
        copy.unshift({ ...(payload as TemplateState) });
      } else if (action === "edit" && payload.id) {
        const idx = copy.findIndex((t) => t.id === payload.id);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...payload } as TemplateState;
      } else if (action === "delete" && payload.id) {
        return copy.filter((t) => t.id !== payload.id);
      }
      return copy;
    });
  }

  return { templates, loading, mutate };
}
