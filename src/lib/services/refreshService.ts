/**
 * refreshService.ts
 *
 * Unified subscription refresh orchestration:
 *  - Fetch enabled iCal subscriptions (optionally in parallel)
 *  - Parse raw iCal data to CalendarItem[] (delegates to icalService)
 *  - Diff existing vs incoming items for each subscription
 *  - Aggregate conflicts into a single list for one dialog
 *  - Provide apply helpers for chosen conflict resolution strategy
 *
 * This service is PURE (except for network fetch). It does NOT update Svelte
 * stores directly; the caller is responsible for:
 *  - Reading existing activities for subscription IDs
 *  - Applying returned diffs using activities.bulkApplySubscriptionChanges or custom logic
 *  - Updating subscription metadata (lastFetched timestamps)
 *  - Triggering UI state (overlay, dialog, progress bar)
 *
 * Typical usage:
 *
 *   import { refreshService } from "../services/refreshService";
 *   import { activities } from "../stores/activities";
 *   import { subscriptions } from "../stores/ical";
 *   import { icalService } from "../services/icalService";
 *
 *   const enabled = $subscriptions.filter(s => s.enabled);
 *   const existingMap = new Map(
 *     enabled.map(sub => [
 *       sub.id,
 *       $activities.filter(a => a.source === "ical" && a.sourceId === sub.id)
 *     ])
 *   );
 *
 *   const controller = new AbortController();
 *   const {
 *     diffs,
 *     aggregatedConflicts,
 *     summary
 *   } = await refreshService.fetchAndDiffAll(enabled, existingMap, {
 *     parallel: true,
 *     signal: controller.signal,
 *     onPhase: (phase, ctx) => { /* update progress UI */ },
 *     onSubscription: (index, total, sub) => { /* progress detail */ }
 *   });
 *
 *   if (aggregatedConflicts.length > 0) {
 *     // Show SINGLE conflict dialog with aggregatedConflicts
 *     // After user selects a resolution:
 *     const resolution: ConflictStrategy = userChoice === "keep" ? "keep-local" : "use-synced";
 *     const appliedActivities = refreshService.applyAllDiffs(
 *       $activities,
 *       diffs,
 *       { strategy: resolution }
 *     );
 *     // Persist appliedActivities and update subscription timestamps.
 *   } else {
 *     // No conflicts: auto apply with 'use-synced'
 *     const appliedActivities = refreshService.applyAllDiffs(
 *       $activities,
 *       diffs,
 *       { strategy: "use-synced" }
 *     );
 *   }
 *
 * Notes:
 *  - If a subscription has zero changes (no added/updated/removed), its diff arrays will be empty.
 *  - Conflicts are computed by icalService.diffSubscriptionItems (localOverrides presence + changed fields).
 */

import type {
  ICalSubscription,
  CalendarItem,
  SyncConflict,
  ConflictResolution, // may already exist; maps to "keep-local" | "use-synced" | "ask"
} from "../types/index.js";
import {
  icalService,
  type SubscriptionDiff,
  type ConflictStrategy,
  type ApplyOptions,
} from "./icalService";

/* ---------------------------------- Types ---------------------------------- */

export interface RefreshPhaseContext {
  subscriptionId?: string;
  subscriptionName?: string;
  index?: number;
  total?: number;
  fetchedCount?: number;
  added?: number;
  updated?: number;
  removed?: number;
  conflicts?: number;
}

export type RefreshPhase =
  | "init"
  | "fetching"
  | "parsing"
  | "diffing"
  | "aggregating"
  | "completed"
  | "error"
  | "cancelled";

export interface FetchAndDiffOptions {
  parallel?: boolean; // fetch subscriptions concurrently
  signal?: AbortSignal;
  onPhase?: (phase: RefreshPhase, ctx: RefreshPhaseContext) => void;
  onSubscription?: (
    index: number,
    total: number,
    subscription: ICalSubscription,
  ) => void;
}

export interface FetchAndDiffResult {
  diffs: SubscriptionDiff[];
  aggregatedConflicts: SyncConflict[];
  summary: {
    totalFetched: number;
    totalAdded: number;
    totalUpdated: number;
    totalRemoved: number;
    totalConflicts: number;
  };
}

/* -------------------------------- Utilities -------------------------------- */

/**
 * Fetch raw iCal text for a subscription.
 */
async function fetchSubscriptionRaw(
  subscription: ICalSubscription,
  signal?: AbortSignal,
): Promise<string> {
  const resp = await fetch(subscription.url, { signal });
  if (!resp.ok) {
    throw new Error(
      `Failed to fetch (${resp.status} ${resp.statusText}) for ${subscription.name}`,
    );
  }
  return resp.text();
}

/**
 * Diff a single subscription (already parsed raw text).
 */
function diffSingleSubscription(
  subscription: ICalSubscription,
  existingItems: CalendarItem[],
  rawText: string,
): SubscriptionDiff {
  const incoming = icalService.parseICalToCalendarItems(
    rawText,
    subscription.id,
  );
  return icalService.diffSubscriptionItems(subscription, existingItems, incoming);
}

/* -------------------------- Core Orchestration Logic ----------------------- */

/**
 * Fetch & diff all enabled subscriptions.
 * - If parallel = true, fetches all raw texts concurrently then parses/diffs sequentially.
 * - If parallel = false, processes strictly in sequence (more deterministic progress for UI).
 */
async function fetchAndDiffAll(
  subscriptions: ICalSubscription[],
  existingBySubscription: Map<string, CalendarItem[]>,
  options: FetchAndDiffOptions = {},
): Promise<FetchAndDiffResult> {
  const {
    parallel = true,
    signal,
    onPhase,
    onSubscription,
  } = options;

  if (signal?.aborted) {
    return {
      diffs: [],
      aggregatedConflicts: [],
      summary: {
        totalFetched: 0,
        totalAdded: 0,
        totalUpdated: 0,
        totalRemoved: 0,
        totalConflicts: 0,
      },
    };
  }

  onPhase?.("init", { total: subscriptions.length });

  const rawMap = new Map<string, string>();
  const diffs: SubscriptionDiff[] = [];

  if (parallel) {
    // Parallel fetch
    onPhase?.("fetching", { total: subscriptions.length });
    await Promise.all(
      subscriptions.map(async (sub, idx) => {
        if (signal?.aborted) return;
        try {
          onSubscription?.(idx, subscriptions.length, sub);
          const raw = await fetchSubscriptionRaw(sub, signal);
          rawMap.set(sub.id, raw);
        } catch (e) {
          // On error, still record an empty diff (error handled upstream)
          onPhase?.("error", {
            subscriptionId: sub.id,
            subscriptionName: sub.name,
            index: idx,
            total: subscriptions.length,
          });
          rawMap.set(sub.id, "");
        }
      }),
    );

    // Parse & diff sequentially for controlled memory usage / conflict ordering
    for (let i = 0; i < subscriptions.length; i++) {
      if (signal?.aborted) {
        onPhase?.("cancelled", {});
        break;
      }
      const sub = subscriptions[i];
      onPhase?.("parsing", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
      });
      const existing = existingBySubscription.get(sub.id) || [];
      const raw = rawMap.get(sub.id) || "";
      onPhase?.("diffing", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
      });
      const diff = diffSingleSubscription(sub, existing, raw);
      diffs.push(diff);
      onPhase?.("aggregating", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
        fetchedCount: diff.fetchedCount,
        added: diff.added.length,
        updated: diff.updated.length,
        removed: diff.removed.length,
        conflicts: diff.conflicts.length,
      });
    }
  } else {
    // Sequential fetch + parse + diff
    for (let i = 0; i < subscriptions.length; i++) {
      if (signal?.aborted) {
        onPhase?.("cancelled", {});
        break;
      }
      const sub = subscriptions[i];
      onPhase?.("fetching", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
      });
      let raw = "";
      try {
        raw = await fetchSubscriptionRaw(sub, signal);
      } catch {
        onPhase?.("error", {
          subscriptionId: sub.id,
          subscriptionName: sub.name,
          index: i,
          total: subscriptions.length,
        });
      }
      onPhase?.("parsing", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
      });
      const existing = existingBySubscription.get(sub.id) || [];
      onPhase?.("diffing", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
      });
      const diff = diffSingleSubscription(sub, existing, raw);
      diffs.push(diff);
      onPhase?.("aggregating", {
        subscriptionId: sub.id,
        subscriptionName: sub.name,
        index: i,
        total: subscriptions.length,
        fetchedCount: diff.fetchedCount,
        added: diff.added.length,
        updated: diff.updated.length,
        removed: diff.removed.length,
        conflicts: diff.conflicts.length,
      });
    }
  }

  // Aggregate all conflicts
  const aggregate = icalService.aggregateDiffs(diffs);
  onPhase?.("completed", {
    total: subscriptions.length,
    added: aggregate.totalAdded,
    updated: aggregate.totalUpdated,
    removed: aggregate.totalRemoved,
    conflicts: aggregate.totalConflicts,
  });

  return {
    diffs,
    aggregatedConflicts: aggregate.conflicts,
    summary: {
      totalFetched: aggregate.totalFetched,
      totalAdded: aggregate.totalAdded,
      totalUpdated: aggregate.totalUpdated,
      totalRemoved: aggregate.totalRemoved,
      totalConflicts: aggregate.totalConflicts,
    },
  };
}

/* ------------------------------- Apply Helpers ------------------------------ */

/**
 * Apply ALL diffs to a full activities array using a chosen conflict strategy.
 * This is pure; caller must persist the returned array.
 */
function applyAllDiffs(
  currentActivities: CalendarItem[],
  diffs: SubscriptionDiff[],
  options: ApplyOptions,
): CalendarItem[] {
  let next = currentActivities.slice();
  for (const diff of diffs) {
    next = icalService.applySubscriptionDiff(next, diff, options);
  }
  return next;
}

/**
 * Convenience to resolve a ConflictResolution (possibly containing "ask") into a ConflictStrategy.
 */
function normalizeResolution(
  resolution: ConflictResolution | ConflictStrategy,
): ConflictStrategy {
  if (resolution === "ask") {
    // "ask" should be resolved externally; default fallback is keep-local
    return "keep-local";
  }
  return resolution;
}

/* ---------------------------------- Export --------------------------------- */

export const refreshService = {
  fetchAndDiffAll,
  applyAllDiffs,
  normalizeResolution,
  // Expose internals for advanced usage:
  fetchSubscriptionRaw,
  diffSingleSubscription,
};
