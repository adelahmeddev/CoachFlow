"use client";

import Dexie, { Table } from "dexie";

export interface Template {
  id: string;
  trainerId: string;
  name: string;
  isGlobal: boolean;
  calories: number | null;
  proteinGrams: number | null;
  carbsGrams: number | null;
  fatsGrams: number | null;
  mealsCount: number;
  updatedAt: string; // ISO timestamp from server
  dirty?: boolean; // true when local changes need sync
}

export interface Client {
  id: string;
  trainerId: string;
  fullName: string;
  goal: string | null;
  updatedAt: string;
  dirty?: boolean;
}

export interface UnreadCountRecord {
  key: string; // e.g. "TRAINER-<id>" or "CLIENT-<id>"
  count: number;
  ts: number; // epoch ms of cache write
}

export class CoachDB extends Dexie {
  templates!: Table<Template, string>;
  clients!: Table<Client, string>;
  unreadCounts!: Table<UnreadCountRecord, string>;

  constructor() {
    super("coach-db");
    // version 1 schema – add trainerId for queries
    (this as any).version(1).stores({
      templates: "id, trainerId, updatedAt, dirty",
      clients: "id, trainerId, updatedAt, dirty",
      unreadCounts: "key, ts",
    });
  }
}

export const db = new CoachDB();
