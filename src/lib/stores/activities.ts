import { writable, derived } from 'svelte/store';
import type { Activity } from '../types/index.js';
import { getActivities, saveActivity, deleteActivity, clearAllActivities } from '../utils/storage.js';

function createActivityStore() {
  const { subscribe, set, update } = writable<Activity[]>(getActivities());

  return {
    subscribe,
    addActivity: (activity: Activity) => {
      saveActivity(activity);
      update((activities) => [...activities, activity]);
    },
    updateActivity: (activity: Activity) => {
      saveActivity(activity);
      update((activities) => activities.map((a) => (a.id === activity.id ? activity : a)));
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
      $activities.filter((a) => a.week === $week && a.year === $year)
);

export const activitiesByDay = derived(
  [activities],
  ([$activities]) =>
    ($week: number, $year: number, $day: number) =>
      $activities.filter((a) => a.week === $week && a.year === $year && a.day === $day)
);
