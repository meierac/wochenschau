import type { RecordModel } from "pocketbase";

import {
  pocketbase,
  POCKETBASE_URL,
  POCKETBASE_AUTH_COLLECTION,
} from "../services/cloudSync.js";
import type { UserProfile } from "../types/index.js";

function getAuthUserId(): string {
  const id = pocketbase.authStore.record?.id;
  if (!id) {
    throw new Error("Not authenticated. Please sign in first.");
  }
  return id;
}

export function getAvatarUrl(record: {
  id: string;
  collectionId: string;
  avatar?: string;
}): string | null {
  if (!record.avatar) {
    return null;
  }
  return `${POCKETBASE_URL}/api/files/${record.collectionId}/${record.id}/${record.avatar}`;
}

export function mapRecordToProfile(record: RecordModel): UserProfile {
  return {
    role: "Member",
    username: record["username"] ?? "",
    firstName: record["firstName"] ?? "",
    lastName: record["lastName"] ?? "",
    email: record["email"] ?? "",
    phoneNumber: record["phoneNumber"] ?? "",
    profileImage:
      getAvatarUrl(
        record as { id: string; collectionId: string; avatar?: string },
      ) ?? "",
    shortBio: record["shortBio"] ?? "",
  };
}

export async function fetchProfile(): Promise<UserProfile> {
  const userId = getAuthUserId();

  const record = await pocketbase
    .collection(POCKETBASE_AUTH_COLLECTION)
    .getOne(userId);

  return mapRecordToProfile(record);
}

export async function saveProfile(profileData: {
  username: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  shortBio: string;
}): Promise<UserProfile> {
  const userId = getAuthUserId();

  const record = await pocketbase
    .collection(POCKETBASE_AUTH_COLLECTION)
    .update(userId, {
      username: profileData.username,
      firstName: profileData.firstName,
      lastName: profileData.lastName,
      phoneNumber: profileData.phoneNumber,
      shortBio: profileData.shortBio,
    });

  return mapRecordToProfile(record);
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const userId = getAuthUserId();

  const formData = new FormData();
  formData.append("avatar", file);

  const record = await pocketbase
    .collection(POCKETBASE_AUTH_COLLECTION)
    .update(userId, formData);

  return mapRecordToProfile(record);
}

export async function removeAvatar(): Promise<UserProfile> {
  const userId = getAuthUserId();

  const record = await pocketbase
    .collection(POCKETBASE_AUTH_COLLECTION)
    .update(userId, { avatar: null });

  return mapRecordToProfile(record);
}
