import { writable } from "svelte/store";
import type { ICalSubscription } from "../types/index.js";
import {
  getSubscriptions,
  saveSubscription,
  deleteSubscription,
} from "../utils/storage.js";

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
    },
    updateSubscription: (subscription: ICalSubscription) => {
      saveSubscription(subscription);
      update((subs) =>
        subs.map((s) => (s.id === subscription.id ? subscription : s)),
      );
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
    },
    removeSubscription: (id: string) => {
      deleteSubscription(id);
      update((subs) => subs.filter((s) => s.id !== id));
    },
  };
}

export const subscriptions = createICalStore();
