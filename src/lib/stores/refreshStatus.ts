/**
 * Global refresh status store for tracking subscription refresh workflow.
 *
 * Intended usage:
 * import { refreshStatus } from "./stores/refreshStatus";
 *
 * refreshStatus.start(subscriptions.length);
 * for (const sub of subscriptions) {
 *   refreshStatus.startSubscription(sub);
 *   refreshStatus.setPhase("fetching");
 *   // fetch...
 *   refreshStatus.setPhase("parsing");
 *   // parse...
 *   refreshStatus.setPhase("diffing");
 *   // build diff...
 *   refreshStatus.incrementCounters({ added: newItems, updated: changedItems, removed: removedItems, conflicts: conflictsFound });
 *   refreshStatus.setPhase("updating");
 *   // apply changes...
 * }
 * refreshStatus.finish();
 *
 * If an error occurs:
 * refreshStatus.fail(error);
 *
 * If user cancels:
 * refreshStatus.cancel();
 */

import { writable, derived } from "svelte/store";
import type { ICalSubscription } from "../types/index.js";

export type RefreshPhase =
  | "idle"
  | "fetching"
  | "parsing"
  | "diffing"
  | "conflict-check"
  | "updating"
  | "completed"
  | "error"
  | "cancelled";

export interface RefreshStatus {
  phase: RefreshPhase;
  // Subscription iteration tracking
  currentSubscriptionIndex: number;
  totalSubscriptions: number;
  currentSubscriptionId: string | null;
  currentSubscriptionName: string | null;

  // Counters (cumulative across all subscriptions in a refresh-all flow)
  fetchedCount: number; // raw events fetched
  addedCount: number;
  updatedCount: number;
  removedCount: number;
  conflictCount: number;

  // Timing
  startTime: number | null;
  endTime: number | null;

  // Flags
  indeterminate: boolean; // true while we cannot compute deterministic progress
  errorMessage: string | null;

  // Internal meta (optional, not for UI directly)
  _subscriptionHistory: {
    id: string;
    name: string;
    added: number;
    updated: number;
    removed: number;
    conflicts: number;
    fetched: number;
  }[];
}

const initialStatus: RefreshStatus = {
  phase: "idle",
  currentSubscriptionIndex: 0,
  totalSubscriptions: 0,
  currentSubscriptionId: null,
  currentSubscriptionName: null,

  fetchedCount: 0,
  addedCount: 0,
  updatedCount: 0,
  removedCount: 0,
  conflictCount: 0,

  startTime: null,
  endTime: null,

  indeterminate: true,
  errorMessage: null,

  _subscriptionHistory: [],
};

function now() {
  return Date.now();
}

function createRefreshStatusStore() {
  const { subscribe, set, update } = writable<RefreshStatus>(initialStatus);

  function reset() {
    set({ ...initialStatus });
  }

  function start(totalSubscriptions: number) {
    set({
      ...initialStatus,
      phase: totalSubscriptions === 0 ? "completed" : "fetching",
      totalSubscriptions,
      startTime: now(),
      indeterminate: totalSubscriptions === 0,
    });
  }

  function startSubscription(subscription: Pick<ICalSubscription, "id" | "name">) {
    update((s) => {
      const nextIndex =
        s.currentSubscriptionId === null
          ? 0
          : Math.min(s.currentSubscriptionIndex + 1, s.totalSubscriptions - 1);

      return {
        ...s,
        currentSubscriptionIndex: nextIndex,
        currentSubscriptionId: subscription.id,
        currentSubscriptionName: subscription.name,
        phase: "fetching",
        indeterminate: false,
      };
    });
  }

  function setPhase(phase: RefreshPhase) {
    update((s) => ({
      ...s,
      phase,
    }));
  }

  function incrementCounters(counters: {
    fetched?: number;
    added?: number;
    updated?: number;
    removed?: number;
    conflicts?: number;
  }) {
    update((s) => ({
      ...s,
      fetchedCount: s.fetchedCount + (counters.fetched || 0),
      addedCount: s.addedCount + (counters.added || 0),
      updatedCount: s.updatedCount + (counters.updated || 0),
      removedCount: s.removedCount + (counters.removed || 0),
      conflictCount: s.conflictCount + (counters.conflicts || 0),
    }));
  }

  function recordSubscriptionResult(result: {
    id: string;
    name: string;
    added: number;
    updated: number;
    removed: number;
    conflicts: number;
    fetched: number;
  }) {
    update((s) => ({
      ...s,
      _subscriptionHistory: [...s._subscriptionHistory, result],
    }));
  }

  function finish() {
    update((s) => ({
      ...s,
      phase: "completed",
      endTime: now(),
      indeterminate: false,
    }));
  }

  function fail(error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error || "Unknown error");
    update((s) => ({
      ...s,
      phase: "error",
      errorMessage: message,
      endTime: now(),
      indeterminate: false,
    }));
  }

  function cancel() {
    update((s) => ({
      ...s,
      phase: "cancelled",
      endTime: now(),
      indeterminate: false,
    }));
  }

  function updateProgress(partial: Partial<RefreshStatus>) {
    update((s) => ({ ...s, ...partial }));
  }

  return {
    subscribe,
    // Lifecycle
    reset,
    start,
    startSubscription,
    setPhase,
    finish,
    fail,
    cancel,
    // Metrics
    incrementCounters,
    recordSubscriptionResult,
    updateProgress,
  };
}

export const refreshStatus = createRefreshStatusStore();

/**
 * Derived progress (0-1).
 * Strategy:
 * - If indeterminate or totalSubscriptions == 0 => 0
 * - Otherwise progress based on subscription index + phase weighting.
 *
 * Simple weighting:
 * Each subscription uses 5 logical phases (fetching, parsing, diffing, conflict-check, updating):
 * Fraction for current subscription:
 *   phaseIndex / totalPhaseCount
 * Overall progress:
 *   (completedSubscriptions + currentPhaseFraction) / totalSubscriptions.
 */
const phaseOrder: RefreshPhase[] = [
  "fetching",
  "parsing",
  "diffing",
  "conflict-check",
  "updating",
  "completed",
];

export const refreshProgress = derived(refreshStatus, ($status) => {
  if (
    $status.indeterminate ||
    $status.totalSubscriptions === 0 ||
    $status.phase === "idle"
  ) {
    return 0;
  }

  if ($status.phase === "error" || $status.phase === "cancelled") {
    return 1;
  }

  if ($status.phase === "completed") {
    return 1;
  }

  const totalSubs = $status.totalSubscriptions;
  const currentIndex = $status.currentSubscriptionIndex;
  const completedSubs = Math.max(0, currentIndex); // previous subscriptions assumed done when a new one starts

  // Determine phase fraction
  const phaseIdx = phaseOrder.indexOf($status.phase);
  const phasesInCycle = 5; // excluding completed/error/cancelled
  const phaseFraction =
    phaseIdx >= 0 && phaseIdx < phasesInCycle
      ? phaseIdx / phasesInCycle
      : 0;

  const progress =
    (completedSubs + phaseFraction) / Math.max(1, totalSubs);

  return Math.min(1, Math.max(0, progress));
});

/**
 * Human readable summary for UI display.
 */
export const refreshSummary = derived(refreshStatus, ($s) => {
  switch ($s.phase) {
    case "idle":
      return "Idle";
    case "fetching":
      return `Fetching (${($s.currentSubscriptionIndex + 1)}/${$s.totalSubscriptions})`;
    case "parsing":
      return `Parsing (${($s.currentSubscriptionIndex + 1)}/${$s.totalSubscriptions})`;
    case "diffing":
      return `Computing changes (${($s.currentSubscriptionIndex + 1)}/${$s.totalSubscriptions})`;
    case "conflict-check":
      return `Checking conflicts (${($s.currentSubscriptionIndex + 1)}/${$s.totalSubscriptions})`;
    case "updating":
      return `Applying updates (${($s.currentSubscriptionIndex + 1)}/${$s.totalSubscriptions})`;
    case "completed":
      return "Refresh complete";
    case "error":
      return `Error: ${$s.errorMessage ?? "Unknown"}`;
    case "cancelled":
      return "Cancelled";
    default:
      return "Working...";
  }
});

/**
 * Elapsed duration (ms) for display.
 */
export const refreshElapsed = derived(refreshStatus, ($s) => {
  if (!$s.startTime) return 0;
  const end = $s.endTime ?? now();
  return end - $s.startTime;
});
