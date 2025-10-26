import { writable, derived } from "svelte/store";

import type { Activity } from "../types/index.js";

import {
  getActivities,
  saveActivity,
  deleteActivity,
  clearAllActivities,
} from "../utils/storage.js";

function createActivityStore() {
  const { subscribe, set, update } = writable<Activity[]>(getActivities());

  return {
    subscribe,

    addActivity: (activity: Activity) => {
      saveActivity(activity);

      update((activities) => [...activities, activity]);
    },

    updateActivity: (activity: Activity) => {
      // Track modifications for synced items

      const updatedActivity = { ...activity };

      // Update lastModified timestamp

      updatedActivity.lastModified = Date.now();

      // If this is a synced item (from iCal), track what was changed

      if (updatedActivity.source === "ical") {
        update((activities) => {
          const original = activities.find((a) => a.id === activity.id);

          if (original) {
            // Identify what changed and store in localOverrides

            const overrides: Partial<Activity> = {};

            if (updatedActivity.summary !== original.summary) {
              overrides.summary = updatedActivity.summary;
            }

            if (updatedActivity.description !== original.description) {
              overrides.description = updatedActivity.description;
            }

            if (updatedActivity.dtstart !== original.dtstart) {
              overrides.dtstart = updatedActivity.dtstart;
            }

            if (updatedActivity.dtend !== original.dtend) {
              overrides.dtend = updatedActivity.dtend;
            }

            if (updatedActivity.color !== original.color) {
              overrides.color = updatedActivity.color;
            }

            if (Object.keys(overrides).length > 0) {
              updatedActivity.localOverrides = {
                ...(updatedActivity.localOverrides || {}),

                ...overrides,
              };
            }
          }

          saveActivity(updatedActivity);

          return activities.map((a) =>
            a.id === updatedActivity.id ? updatedActivity : a,
          );
        });
      } else {
        // For non-synced items, just update normally

        saveActivity(updatedActivity);

        update((activities) =>
          activities.map((a) =>
            a.id === updatedActivity.id ? updatedActivity : a,
          ),
        );
      }
    },

    /**
     * Bulk apply subscription changes in one atomic update pass.
     * This avoids triggering per-item override detection and greatly
     * improves performance for large iCal refreshes.
     *
     * - removed: activities to delete (by id)
     * - updated: fully merged activities (preserve existing createdAt/localOverrides)
     * - added: new activities
     *
     * NOTE: updated & added items should already have correct timestamps.
     * We only fill missing createdAt/lastModified defensively.
     */
    bulkApplySubscriptionChanges: ({
      added = [],
      updated = [],
      removed = [],
    }: {
      added?: Activity[];
      updated?: Activity[];
      removed?: Activity[];
    }) => {
      update((activities) => {
        // Remove items
        const removedIds = new Set(removed.map((r) => r.id));
        let next = activities.filter((a) => !removedIds.has(a.id));

        // Map for quick lookup
        const existingMap = new Map(next.map((a) => [a.id, a]));

        // Apply updates (merge with existing createdAt & keep localOverrides untouched)
        for (const u of updated) {
          const original = existingMap.get(u.id);
          const merged: Activity = original
            ? {
                ...original,
                ...u,
                createdAt: original.createdAt,
                // Preserve existing localOverrides (do not recompute here)
                localOverrides: original.localOverrides,
              }
            : { ...u };

          if (!merged.createdAt) merged.createdAt = Date.now();
          if (!merged.lastModified) merged.lastModified = Date.now();

          saveActivity(merged);
          if (original) {
            next = next.map((a) => (a.id === merged.id ? merged : a));
          } else {
            next.push(merged);
          }
        }

        // Apply additions (skip if id already exists)
        for (const a of added) {
          if (existingMap.has(a.id)) continue;
          if (!a.createdAt) a.createdAt = Date.now();
          if (!a.lastModified) a.lastModified = a.createdAt;
          saveActivity(a);
          next.push(a);
        }

        // Persist deletions (already filtered)
        for (const rid of removedIds) {
          deleteActivity(String(rid));
        }

        return next;
      });
    },
    removeActivity: (id: string) => {
      deleteActivity(id);
      update((activities) => activities.filter((a) => a.id !== id));
    },
    clearAll: () => {
      clearAllActivities();
      set([]);
    },
  };
}

export const activities = createActivityStore();

export const activitiesByWeek = derived(
  [activities],

  ([$activities]) =>
    ($week: number, $year: number) =>
      $activities.filter((a) => a.week === $week && a.year === $year),
);

export const activitiesByDay = derived(
  [activities],

  ([$activities]) =>
    ($week: number, $year: number, $day: number) =>
      $activities.filter(
        (a) => a.week === $week && a.year === $year && a.day === $day,
      ),
);
