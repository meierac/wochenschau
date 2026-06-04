import { writable } from "svelte/store";

import type { UserProfile } from "../types/index.js";
import { getUserProfile, saveUserProfile } from "../utils/storage.js";

export const defaultUserProfile: UserProfile = {
  role: "User",
  username: "wochenschau-user",
  firstName: "Max",
  lastName: "Mustermann",
  email: "max.mustermann@example.com",
  phoneNumber: "+49 170 1234567",
  profileImage: "",
  shortBio:
    "I use Wochenschau to keep my weekly schedule and priorities in one place.",
};

function createProfileStore() {
  const { subscribe, set } = writable<UserProfile>(
    getUserProfile(defaultUserProfile),
  );

  return {
    subscribe,
    updateProfile: (profile: UserProfile) => {
      saveUserProfile(profile);
      set(profile);
    },
    resetProfile: () => {
      saveUserProfile(defaultUserProfile);
      set(defaultUserProfile);
    },
  };
}

export const profile = createProfileStore();
