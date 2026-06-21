import { writable } from "svelte/store";

import type { UserProfile } from "../types/index.js";
import {
  fetchProfile,
  saveProfile,
  uploadAvatar as uploadAvatarService,
  removeAvatar as removeAvatarService,
} from "../services/profileService.js";

export const emptyUserProfile: UserProfile = {
  role: "Member",
  username: "",
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  profileImage: "",
  shortBio: "",
};

function createProfileStore() {
  const { subscribe, set } = writable<UserProfile>(emptyUserProfile);

  return {
    subscribe,

    async loadFromPocketBase() {
      const profile = await fetchProfile();
      set(profile);
    },

    async saveToRemote(data: {
      username: string;
      firstName: string;
      lastName: string;
      phoneNumber: string;
      shortBio: string;
    }) {
      const updated = await saveProfile(data);
      set(updated);
    },

    async uploadAvatar(file: File) {
      const updated = await uploadAvatarService(file);
      set(updated);
    },

    async removeAvatar() {
      const updated = await removeAvatarService();
      set(updated);
    },

    setFromRecord(profile: UserProfile) {
      set(profile);
    },
  };
}

export const profile = createProfileStore();
