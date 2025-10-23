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
    removeSubscription: (id: string) => {
      deleteSubscription(id);
      update((subs) => subs.filter((s) => s.id !== id));
    },
  };
}

export const subscriptions = createICalStore();
