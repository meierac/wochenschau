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

const MAX_AVATAR_DIMENSION = 1024;
const AVATAR_JPEG_QUALITY = 0.88;
const AVATAR_NORMALIZED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function createImageLoadError(file: File): Error {
  return new Error(
    `Could not read "${file.name}" as an image. Please choose a JPEG, PNG, or WebP image.`,
  );
}

async function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(createImageLoadError(file));
    };

    image.src = objectUrl;
  });
}

async function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  if (typeof canvas.toBlob === "function") {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Could not prepare avatar image for upload."));
          }
        },
        type,
        quality,
      );
    });
  }

  const response = await fetch(canvas.toDataURL(type, quality));
  return response.blob();
}

function avatarFileName(fileName: string): string {
  const baseName = fileName.replace(/\.[^.]+$/, "") || "avatar";
  return `${baseName}.jpg`;
}

function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() ?? "";
}

function isImageLikeFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;

  return ["heic", "heif", "jpg", "jpeg", "png", "webp", "gif"].includes(
    getFileExtension(file.name),
  );
}

async function normalizeAvatarFile(file: File): Promise<File> {
  if (!isImageLikeFile(file)) {
    throw new Error("Please choose an image file for your profile photo.");
  }

  if (file.type === "image/svg+xml" || getFileExtension(file.name) === "svg") {
    throw new Error("SVG files are not supported for profile photos.");
  }

  const image = await loadImageFile(file);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;

  if (!sourceWidth || !sourceHeight) {
    throw createImageLoadError(file);
  }

  const scale = Math.min(
    1,
    MAX_AVATAR_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const shouldNormalize =
    scale < 1 ||
    !AVATAR_NORMALIZED_TYPES.has(file.type) ||
    file.size > 1_500_000;

  if (!shouldNormalize) {
    return file;
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare avatar image for upload.");
  }

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await canvasToBlob(canvas, "image/jpeg", AVATAR_JPEG_QUALITY);

  return new File([blob], avatarFileName(file.name), {
    type: "image/jpeg",
    lastModified: file.lastModified,
  });
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const userId = getAuthUserId();
  const avatarFile = await normalizeAvatarFile(file);

  const formData = new FormData();
  formData.append("avatar", avatarFile);

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
