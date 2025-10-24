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
