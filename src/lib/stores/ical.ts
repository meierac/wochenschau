import { writable } from "svelte/store";
import type { ICalSubscription } from "../types/index.js";
import {
  getSubscriptions,
  saveSubscription,
  deleteSubscription,
} from "../utils/storage.js";
import { notifyDataChanged } from "../services/syncTrigger.js";

function createICalStore() {
  const { subscribe, update } =
    writable<ICalSubscription[]>(getSubscriptions());

  const persistUpdatedSubscription = (subscription: ICalSubscription) => {
    saveSubscription(subscription);
    return subscription;
  };

  return {
    subscribe,
    addSubscription: (subscription: ICalSubscription) => {
      saveSubscription(subscription);
      update((subs) => [...subs, subscription]);
      notifyDataChanged();
    },
    updateSubscription: (subscription: ICalSubscription) => {
      saveSubscription(subscription);
      update((subs) =>
        subs.map((s) => (s.id === subscription.id ? subscription : s)),
      );
      notifyDataChanged();
    },
    markFetched: (id: string, fetchedAt = Date.now()) => {
      update((subs) =>
        subs.map((sub) =>
          sub.id === id
            ? persistUpdatedSubscription({
                ...sub,
                lastFetched: fetchedAt,
              })
            : sub,
        ),
      );
      notifyDataChanged();
    },
    markFetchedMany: (ids: string[], fetchedAt = Date.now()) => {
      const idSet = new Set(ids);
      update((subs) =>
        subs.map((sub) =>
          idSet.has(sub.id)
            ? persistUpdatedSubscription({
                ...sub,
                lastFetched: fetchedAt,
              })
            : sub,
        ),
      );
      notifyDataChanged();
    },
    removeSubscription: (id: string) => {
      deleteSubscription(id);
      update((subs) => subs.filter((s) => s.id !== id));
      notifyDataChanged();
    },
    replaceAll: (all: ICalSubscription[]) => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "wochenschau_ical_subscriptions",
          JSON.stringify(all),
        );
      }
      update(() => all);
      notifyDataChanged();
    },
  };
}

export const subscriptions = createICalStore();
