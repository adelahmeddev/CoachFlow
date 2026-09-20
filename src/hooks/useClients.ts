"use client"

import { useEffect, useState } from "react";
import type { Goal } from "@/lib/db/enums";
import { parseGoals } from "@/lib/goals";

type ClientState = { id: string; fullName: string; goals: Goal[] };

export function useClients(trainerId: string) {
  const [clients, setClients] = useState<ClientState[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!trainerId) {
      setClients([]);
      setLoading(false);
      return;
    }
    
    let cancelled = false;

    async function fetchClients() {
      try {
        const resp = await fetch('/api/trainer/clients', { credentials: 'include' });
        if (resp.ok) {
          const data = await resp.json();
          if (!cancelled) {
            setClients(data.clients.map((c: any) => ({
              id: c.id,
              fullName: c.fullName ?? "",
              goals: parseGoals(c.goals),
            })));
          }
        }
      } catch (e) {
        // ignore
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    
    fetchClients();
    return () => { cancelled = true };
  }, [trainerId]);

  async function mutate(action: "assign" | "update" | "delete", payload: Partial<ClientState>) {
    if (!payload.id) return;
    setClients((prev) => prev.map((c) => (c.id === payload.id ? { ...c, ...(payload as any) } : c)));
  }

  return { clients, loading, mutate };
}
