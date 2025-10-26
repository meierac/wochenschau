/**
 * Unified iCal parsing + diff service for Wochenschau.
 *
 * This module centralizes:
 *  - Raw iCal text parsing into CalendarItem objects
 *  - Diff computation between existing subscription items and incoming items
 *  - Conflict detection (local overrides present on changed items)
 *
 * Usage (simplified):
 *
 *   import {
 *     parseICalToCalendarItems,
 *     diffSubscriptionItems,
 *     applySubscriptionDiff
 *   } from "../services/icalService";
 *
 *   const incoming = parseICalToCalendarItems(rawIcal, subscription.id);
 *   const existing = activitiesForSubscription(subscription.id);
 *   const diff = diffSubscriptionItems(subscription, existing, incoming);
 *   // show diff.conflicts if any; on resolution:
 *   applySubscriptionDiff(activitiesStore, diff, { strategy: "preserve-local" });
 *
 * Notes:
 *  - NO network I/O here (pure transformation/diff functions).
 *  - Does not touch localStorage directly; caller is responsible for persistence.
 */

import type {
  CalendarItem,
  ICalSubscription,
  SyncConflict,
} from "../types/index.js";

/* ---------------------------------- Types ---------------------------------- */

export interface SubscriptionDiff {
  subscriptionId: string;
  subscriptionName: string;
  added: CalendarItem[];
  updated: CalendarItem[];
  removed: CalendarItem[];
  conflicts: SyncConflict[];
  fetchedCount: number;
  timestamp: number;
}

export type ConflictStrategy = "keep-local" | "use-synced";

export interface ApplyOptions {
  /**
   * Strategy for conflict items:
   *  - keep-local: do not overwrite conflict items
   *  - use-synced: overwrite with incoming updated version
   */
  strategy: ConflictStrategy;
}

/* -------------------------------- Utilities -------------------------------- */

/**
 * Sanitize an iCal UID for inclusion in an internal identifier.
 */
function sanitizeUid(uid: string): string {
  return uid.replace(/[^a-zA-Z0-9-]/g, "");
}

/**
 * Extract date portion (YYYYMMDD) from an iCal date/datetime.
 */
function extractDate(iCalDateTime: string): string {
  return iCalDateTime.includes("T") ? iCalDateTime.split("T")[0] : iCalDateTime;
}

/**
 * Extract time HH:mm from an iCal datetime; fallback default for all-day events.
 */
function extractTime(iCalDateTime: string): string {
  if (!iCalDateTime.includes("T")) return "09:00";
  const timePart = iCalDateTime.split("T")[1].replace("Z", "");
  const hours = timePart.substring(0, 2);
  const minutes = timePart.substring(2, 4);
  return `${hours}:${minutes}`;
}

/**
 * Decode iCal escaped text (newlines, commas, semicolons, backslashes).
 */
function decodeICalText(text: string): string {
  return text
    .replace(/\\n/g, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

/**
 * Build a CalendarItem from a parsed interim event object.
 */
function buildCalendarItem(event: {
  summary?: string;
  description?: string;
  dtstart?: string;
  dtend?: string;
  uid?: string;
  sourceId: string;
}): CalendarItem | null {
  try {
    const dtstart = event.dtstart || "";
    const dtend = event.dtend || dtstart;
    if (!dtstart || !event.summary) return null;

    const isAllDay = !dtstart.includes("T");
    const startDate = extractDate(dtstart);
    const endDate = extractDate(dtend);
    const startTime = isAllDay ? "09:00" : extractTime(dtstart);
    const endTime = isAllDay ? "17:00" : extractTime(dtend);
    if (!startDate) return null;

    const yearNum = parseInt(startDate.substring(0, 4));
    const monthNum = parseInt(startDate.substring(4, 6)) - 1;
    const dayNum = parseInt(startDate.substring(6, 8));
    const dateObj = new Date(yearNum, monthNum, dayNum);

    const day = (dateObj.getDay() + 6) % 7; // Monday=0
    const week = getIsoWeek(dateObj);
    const year = dateObj.getFullYear();

    const id = event.uid
      ? `${event.sourceId}-${sanitizeUid(event.uid)}`
      : `${event.sourceId}-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const now = Date.now();

    return {
      id,
      summary: event.summary,
      description: event.description || "",
      dtstart,
      dtend,
      startDate,
      endDate,
      startTime,
      endTime,
      day,
      week,
      year,
      isAllDay,
      source: "ical",
      sourceId: event.sourceId,
      uid: event.uid,
      createdAt: now,
      lastModified: now,
    };
  } catch (e) {
    console.error("[iCalService] buildCalendarItem error:", e);
    return null;
  }
}

/**
 * ISO week number (mimics getWeekNumber utility but self-contained).
 */
function getIsoWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

/* ------------------------------ Parsing Logic ------------------------------ */

/**
 * Parse raw iCal text into CalendarItem[] for a given subscription.
 * Handles line folding per RFC5545 (continuation lines starting with space or tab).
 */
export function parseICalToCalendarItems(
  rawText: string,
  subscriptionId: string,
): CalendarItem[] {
  const items: CalendarItem[] = [];
  const lines = rawText.split(/\r?\n/);
  // Narrow event typing for safer buildCalendarItem usage
  let currentEvent: {
    summary?: string;
    description?: string;
    dtstart?: string;
    dtend?: string;
    uid?: string;
    sourceId: string;
  } | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Line folding: join subsequent lines starting with space or tab.
    while (i + 1 < lines.length && /^[\t ]/.test(lines[i + 1])) {
      i++;
      line += lines[i].substring(1);
    }

    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      currentEvent = { sourceId: subscriptionId, description: "" };
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (currentEvent && currentEvent.summary && currentEvent.dtstart) {
        const item = buildCalendarItem(currentEvent);
        if (item) items.push(item);
      }
      currentEvent = null;
      continue;
    }
    if (!currentEvent) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;
    const field = trimmed.substring(0, colonIndex);
    const value = trimmed.substring(colonIndex + 1);

    if (field === "SUMMARY") {
      currentEvent.summary = decodeICalText(value);
    } else if (field.startsWith("DTSTART")) {
      currentEvent.dtstart = value;
    } else if (field.startsWith("DTEND")) {
      currentEvent.dtend = value;
    } else if (field === "UID") {
      currentEvent.uid = value;
    } else if (field === "DESCRIPTION") {
      currentEvent.description = decodeICalText(value);
    }
  }

  return items;
}

/* ------------------------------- Diff Routine ------------------------------ */

/**
 * Compute diff between existing subscription items and incoming items.
 * Conflict definition:
 *  - Item exists locally
 *  - Local item has localOverrides (user modified a synced event)
 *  - Remote fields changed (summary/description/dtstart/dtend)
 */
export function diffSubscriptionItems(
  subscription: ICalSubscription,
  existing: CalendarItem[],
  incoming: CalendarItem[],
): SubscriptionDiff {
  const existingMap = new Map(existing.map((e) => [e.id, e]));
  const incomingMap = new Map(incoming.map((i) => [i.id, i]));

  const added: CalendarItem[] = [];
  const updated: CalendarItem[] = [];
  const removed: CalendarItem[] = [];
  const conflicts: SyncConflict[] = [];

  for (const item of incoming) {
    const prev = existingMap.get(item.id);
    if (!prev) {
      added.push(item);
      continue;
    }

    const changed =
      prev.summary !== item.summary ||
      prev.description !== item.description ||
      prev.dtstart !== item.dtstart ||
      prev.dtend !== item.dtend;

    if (changed) {
      // Merge with preserved local overrides & timestamps
      const merged: CalendarItem = {
        ...item,
        createdAt: prev.createdAt,
        lastModified: Date.now(),
        localOverrides: prev.localOverrides,
        color: prev.color,
      };

      updated.push(merged);

      if (prev.localOverrides && Object.keys(prev.localOverrides).length > 0) {
        conflicts.push({
          localItem: prev,
          incomingItem: merged,
          subscriptionName: subscription.name,
        });
      }
    }
  }

  for (const prev of existing) {
    if (!incomingMap.has(prev.id)) {
      removed.push(prev);
    }
  }

  return {
    subscriptionId: subscription.id,
    subscriptionName: subscription.name,
    added,
    updated,
    removed,
    conflicts,
    fetchedCount: incoming.length,
    timestamp: Date.now(),
  };
}

/* ------------------------------ Apply Strategy ----------------------------- */

/**
 * Apply a SubscriptionDiff to an activities array in-memory.
 * Returns new activities array without persisting (caller persists).
 *
 * Strategy:
 *  - keep-local: do not overwrite conflict items (skip those in updated that are conflicts)
 *  - use-synced: replace all updated items (including conflicts)
 */
export function applySubscriptionDiff(
  current: CalendarItem[],
  diff: SubscriptionDiff,
  options: ApplyOptions,
): CalendarItem[] {
  const { added, updated, removed, conflicts } = diff;
  const removedIds = new Set(removed.map((r) => r.id));
  let next = current.filter((a) => !removedIds.has(a.id));

  const conflictIds = new Set(conflicts.map((c) => c.localItem.id));

  // Build map for replacement
  const map = new Map(next.map((a) => [a.id, a]));

  for (const u of updated) {
    if (options.strategy === "keep-local" && conflictIds.has(u.id)) {
      // Skip overwrite for conflicts
      continue;
    }
    if (map.has(u.id)) {
      map.set(u.id, u);
    } else {
      map.set(u.id, u);
    }
  }

  for (const a of added) {
    if (!map.has(a.id)) {
      map.set(a.id, a);
    }
  }

  next = Array.from(map.values());
  return next;
}

/* ------------------------------- Aggregation ------------------------------- */

/**
 * Aggregate multiple diffs into combined statistics & conflicts list.
 */
export function aggregateDiffs(diffs: SubscriptionDiff[]) {
  const combined = {
    totalFetched: 0,
    totalAdded: 0,
    totalUpdated: 0,
    totalRemoved: 0,
    totalConflicts: 0,
    conflicts: [] as SyncConflict[],
  };

  for (const d of diffs) {
    combined.totalFetched += d.fetchedCount;
    combined.totalAdded += d.added.length;
    combined.totalUpdated += d.updated.length;
    combined.totalRemoved += d.removed.length;
    combined.totalConflicts += d.conflicts.length;
    combined.conflicts.push(...d.conflicts);
  }

  return combined;
}

/* ---------------------------------- Export --------------------------------- */

export const icalService = {
  parseICalToCalendarItems,
  diffSubscriptionItems,
  applySubscriptionDiff,
  aggregateDiffs,
};
