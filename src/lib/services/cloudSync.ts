import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import { writable } from "svelte/store";

import {
  applySnapshotToLocalState,
  collectLocalSnapshot,
  normalizeSyncedAppData,
  type SyncedAppData,
} from "./localDataSnapshot.js";
import { emptyUserProfile, profile } from "../stores/profile.js";
import { mapRecordToProfile } from "./profileService.js";
import {
  getLocalDataUpdatedAt,
  onDataChanged,
  setLocalDataUpdatedAt,
} from "./syncTrigger.js";

const DEFAULT_POCKETBASE_URL = "https://pocketbase.144t.org";
const SYNC_DEBOUNCE_MS = 1200;
const INITIAL_TRANSFER_DECISION_KEY_PREFIX =
  "wochenschau_initial_transfer_decision";

export const POCKETBASE_URL =
  import.meta.env.VITE_POCKETBASE_URL?.trim() || DEFAULT_POCKETBASE_URL;

export const POCKETBASE_AUTH_COLLECTION =
  import.meta.env.VITE_POCKETBASE_AUTH_COLLECTION?.trim() || "users";

export const POCKETBASE_DATA_COLLECTION =
  import.meta.env.VITE_POCKETBASE_DATA_COLLECTION?.trim() || "user_sync_states";

export const pocketbase = new PocketBase(POCKETBASE_URL);

interface CloudSyncRecord extends RecordModel {
  user: string;
  payload: unknown;
  clientUpdatedAt: number;
}

export interface CloudAuthState {
  ready: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  syncing: boolean;
  lastSyncAt: number | null;
  error: string | null;
  requiresInitialTransferChoice: boolean;
}

const initialState: CloudAuthState = {
  ready: false,
  isAuthenticated: false,
  userId: null,
  email: null,
  syncing: false,
  lastSyncAt: null,
  error: null,
  requiresInitialTransferChoice: false,
};

export const cloudAuth = writable<CloudAuthState>(initialState);

let initialized = false;
let cloudRecordId: string | null = null;
let syncDebounceTimer: number | null = null;

function setCloudState(partial: Partial<CloudAuthState>): void {
  cloudAuth.update((state) => ({ ...state, ...partial }));
}

function currentUserId(): string | null {
  const record = pocketbase.authStore.record as { id?: string } | null;
  return record?.id || null;
}

function currentUserEmail(): string | null {
  const record = pocketbase.authStore.record as { email?: string } | null;
  return record?.email || null;
}

function isNotFound(error: unknown): boolean {
  return error instanceof ClientResponseError && error.status === 404;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof ClientResponseError) {
    const responseMessage =
      typeof error.response?.message === "string" ? error.response.message : "";
    return responseMessage || error.message || "PocketBase request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function refreshIdentityState(): void {
  setCloudState({
    ready: true,
    isAuthenticated: pocketbase.authStore.isValid,
    userId: currentUserId(),
    email: currentUserEmail(),
  });
}

function hasMeaningfulSnapshotData(snapshot: {
  activities: unknown[];
  templates: unknown[];
  subscriptions: unknown[];
  exportSettings: Record<string, unknown> | Partial<Record<string, unknown>>;
  bibleVerseState: unknown;
  backgroundImage: string | null;
}): boolean {
  if (snapshot.activities.length > 0) return true;
  if (snapshot.templates.length > 0) return true;
  if (snapshot.subscriptions.length > 0) return true;
  if (snapshot.backgroundImage) return true;
  if (snapshot.bibleVerseState) return true;

  return Object.keys(snapshot.exportSettings || {}).length > 0;
}

function getInitialTransferDecisionKey(userId: string): string {
  return `${INITIAL_TRANSFER_DECISION_KEY_PREFIX}_${userId}`;
}

function hasInitialTransferDecision(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(localStorage.getItem(getInitialTransferDecisionKey(userId)));
}

function setInitialTransferDecision(userId: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getInitialTransferDecisionKey(userId), value);
}

function createEmptySnapshot(): SyncedAppData {
  return {
    schemaVersion: 1,
    updatedAt: Date.now(),
    activities: [],
    templates: [],
    subscriptions: [],
    profile: emptyUserProfile,
    exportSettings: {},
    bibleVerseState: null,
    backgroundImage: null,
  };
}

async function getCloudRecord(userId: string): Promise<CloudSyncRecord | null> {
  if (cloudRecordId) {
    try {
      const byId = await pocketbase
        .collection(POCKETBASE_DATA_COLLECTION)
        .getOne<CloudSyncRecord>(cloudRecordId);
      if (byId.user === userId) {
        return byId;
      }
      cloudRecordId = null;
    } catch (error) {
      if (!isNotFound(error)) {
        throw error;
      }
      cloudRecordId = null;
    }
  }

  try {
    const record = await pocketbase
      .collection(POCKETBASE_DATA_COLLECTION)
      .getFirstListItem<CloudSyncRecord>(`user = \"${userId}\"`);

    cloudRecordId = record.id;
    return record;
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

async function createCloudRecord(
  userId: string,
  payload: unknown,
  clientUpdatedAt: number,
): Promise<void> {
  const created = await pocketbase
    .collection(POCKETBASE_DATA_COLLECTION)
    .create<CloudSyncRecord>({
      user: userId,
      payload,
      clientUpdatedAt,
    });

  cloudRecordId = created.id;
}

async function updateCloudRecord(
  recordId: string,
  userId: string,
  payload: unknown,
  clientUpdatedAt: number,
): Promise<void> {
  await pocketbase
    .collection(POCKETBASE_DATA_COLLECTION)
    .update<CloudSyncRecord>(recordId, {
      user: userId,
      payload,
      clientUpdatedAt,
    });
}

async function reconcileLocalAndCloud(): Promise<void> {
  const userId = currentUserId();
  if (!userId || !pocketbase.authStore.isValid) return;

  setCloudState({ syncing: true, error: null });

  try {
    const localTimestampBeforeSnapshot = getLocalDataUpdatedAt();
    const hadLocalTimestamp = localTimestampBeforeSnapshot > 0;

    const localSnapshot = await collectLocalSnapshot();
    const cloudRecord = await getCloudRecord(userId);

    if (!cloudRecord) {
      await createCloudRecord(userId, localSnapshot, localSnapshot.updatedAt);
      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    const remoteSnapshot = normalizeSyncedAppData(cloudRecord.payload);
    const remoteUpdatedAt = Number(cloudRecord.clientUpdatedAt) || 0;

    if (remoteSnapshot && !hadLocalTimestamp) {
      const localHasData = hasMeaningfulSnapshotData(localSnapshot);
      const remoteHasData = hasMeaningfulSnapshotData(remoteSnapshot);

      if (remoteHasData && !localHasData) {
        await applySnapshotToLocalState({
          ...remoteSnapshot,
          updatedAt: remoteUpdatedAt > 0 ? remoteUpdatedAt : Date.now(),
        });
      } else if (localHasData && !remoteHasData) {
        await updateCloudRecord(
          cloudRecord.id,
          userId,
          localSnapshot,
          localSnapshot.updatedAt,
        );
      } else if (remoteHasData) {
        await applySnapshotToLocalState({
          ...remoteSnapshot,
          updatedAt: remoteUpdatedAt > 0 ? remoteUpdatedAt : Date.now(),
        });
      } else {
        await updateCloudRecord(
          cloudRecord.id,
          userId,
          localSnapshot,
          localSnapshot.updatedAt,
        );
      }

      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    if (remoteSnapshot && remoteUpdatedAt > localSnapshot.updatedAt) {
      await applySnapshotToLocalState({
        ...remoteSnapshot,
        updatedAt: remoteUpdatedAt,
      });
      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    if (!remoteSnapshot || localSnapshot.updatedAt > remoteUpdatedAt) {
      await updateCloudRecord(
        cloudRecord.id,
        userId,
        localSnapshot,
        localSnapshot.updatedAt,
      );
      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    setCloudState({ lastSyncAt: Date.now() });
  } catch (error) {
    setCloudState({ error: getErrorMessage(error) });
    throw error;
  } finally {
    setCloudState({ syncing: false });
  }
}

async function pushLocalChanges(): Promise<void> {
  const userId = currentUserId();
  if (!userId || !pocketbase.authStore.isValid) return;

  setCloudState({ syncing: true, error: null });

  try {
    const localSnapshot = await collectLocalSnapshot();
    const cloudRecord = await getCloudRecord(userId);

    if (!cloudRecord) {
      await createCloudRecord(userId, localSnapshot, localSnapshot.updatedAt);
      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    const remoteUpdatedAt = Number(cloudRecord.clientUpdatedAt) || 0;

    // Avoid overwriting newer cloud data from another device.
    if (remoteUpdatedAt > localSnapshot.updatedAt) {
      const remoteSnapshot = normalizeSyncedAppData(cloudRecord.payload);
      if (remoteSnapshot) {
        await applySnapshotToLocalState({
          ...remoteSnapshot,
          updatedAt: remoteUpdatedAt,
        });
      }
      setCloudState({ lastSyncAt: Date.now() });
      return;
    }

    await updateCloudRecord(
      cloudRecord.id,
      userId,
      localSnapshot,
      localSnapshot.updatedAt,
    );
    setCloudState({ lastSyncAt: Date.now() });
  } catch (error) {
    setCloudState({ error: getErrorMessage(error) });
  } finally {
    setCloudState({ syncing: false });
  }
}

async function shouldPromptForInitialTransferChoice(
  userId: string,
): Promise<boolean> {
  if (hasInitialTransferDecision(userId)) return false;

  const localSnapshot = await collectLocalSnapshot();
  const localHasData = hasMeaningfulSnapshotData(localSnapshot);

  if (!localHasData) {
    setInitialTransferDecision(userId, "no-local-data");
    return false;
  }

  return true;
}

async function pullCloudToLocalOrReset(userId: string): Promise<void> {
  const cloudRecord = await getCloudRecord(userId);
  if (!cloudRecord) {
    await applySnapshotToLocalState(createEmptySnapshot());
    return;
  }

  const remoteSnapshot = normalizeSyncedAppData(cloudRecord.payload);
  const remoteUpdatedAt = Number(cloudRecord.clientUpdatedAt) || Date.now();

  if (!remoteSnapshot) {
    await applySnapshotToLocalState(createEmptySnapshot());
    return;
  }

  await applySnapshotToLocalState({
    ...remoteSnapshot,
    updatedAt: remoteUpdatedAt,
  });
}

async function forceTransferLocalDataToCloud(userId: string): Promise<void> {
  const localSnapshot = await collectLocalSnapshot();
  const cloudRecord = await getCloudRecord(userId);

  if (!cloudRecord) {
    await createCloudRecord(userId, localSnapshot, localSnapshot.updatedAt);
    return;
  }

  await updateCloudRecord(
    cloudRecord.id,
    userId,
    localSnapshot,
    localSnapshot.updatedAt,
  );
}

async function startAuthenticatedSessionFlow(): Promise<void> {
  const userId = currentUserId();
  if (!userId || !pocketbase.authStore.isValid) return;

  const needsChoice = await shouldPromptForInitialTransferChoice(userId);
  if (needsChoice) {
    setCloudState({
      requiresInitialTransferChoice: true,
      syncing: false,
      error: null,
    });
    return;
  }

  setCloudState({ requiresInitialTransferChoice: false });
  await reconcileLocalAndCloud();

  // Load fresh profile from PocketBase after sync
  try {
    await profile.loadFromPocketBase();
  } catch {
    // Non-critical — profile is already populated from auth store record
  }
}

function schedulePushAfterLocalChange(): void {
  if (!pocketbase.authStore.isValid) return;

  if (syncDebounceTimer !== null) {
    window.clearTimeout(syncDebounceTimer);
  }

  syncDebounceTimer = window.setTimeout(() => {
    syncDebounceTimer = null;
    void pushLocalChanges();
  }, SYNC_DEBOUNCE_MS);
}

export async function initializeCloudSync(): Promise<void> {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  onDataChanged(() => {
    schedulePushAfterLocalChange();
  });

  pocketbase.authStore.onChange(() => {
    if (!pocketbase.authStore.isValid) {
      cloudRecordId = null;
      setCloudState({
        syncing: false,
        error: null,
        lastSyncAt: null,
        requiresInitialTransferChoice: false,
      });
    }

    refreshIdentityState();

    if (pocketbase.authStore.isValid) {
      // Immediately populate profile from the auth store record
      if (pocketbase.authStore.record) {
        try {
          const mapped = mapRecordToProfile(pocketbase.authStore.record as any);
          profile.setFromRecord(mapped);
        } catch {
          // Non-critical — profile will load from fetchProfile later
        }
      }

      void startAuthenticatedSessionFlow().catch((error) => {
        setCloudState({ error: getErrorMessage(error), syncing: false });
      });
    } else {
      profile.setFromRecord(emptyUserProfile);
    }
  }, true);
}

export async function signInWithPocketBase(
  email: string,
  password: string,
): Promise<void> {
  setCloudState({ error: null });

  await pocketbase
    .collection(POCKETBASE_AUTH_COLLECTION)
    .authWithPassword(email.trim(), password);
}

function deriveUsernameFromEmail(email: string): string {
  const [namePart] = email.toLowerCase().split("@");
  const sanitized = namePart.replace(/[^a-z0-9._-]/g, "");
  const fallback = sanitized.length > 0 ? sanitized : "wochenschau_user";
  return `${fallback}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function createPocketBaseAccount(
  email: string,
  password: string,
  passwordConfirm: string,
): Promise<void> {
  setCloudState({ error: null });

  const trimmedEmail = email.trim();
  const authCollection = pocketbase.collection(POCKETBASE_AUTH_COLLECTION);

  try {
    await authCollection.create({
      email: trimmedEmail,
      password,
      passwordConfirm,
      emailVisibility: true,
    });
  } catch (error) {
    const maybeResponse =
      error instanceof ClientResponseError ? error.response : null;

    const usernameFieldError = Boolean(
      maybeResponse &&
      typeof maybeResponse === "object" &&
      "data" in maybeResponse &&
      (maybeResponse.data as Record<string, unknown>)?.username,
    );

    if (!usernameFieldError) {
      throw error;
    }

    await authCollection.create({
      email: trimmedEmail,
      password,
      passwordConfirm,
      emailVisibility: true,
      username: deriveUsernameFromEmail(trimmedEmail),
    });
  }

  await authCollection.authWithPassword(trimmedEmail, password);
}

export async function resolveInitialTransferChoice(
  transferLocalData: boolean,
): Promise<void> {
  const userId = currentUserId();
  if (!userId || !pocketbase.authStore.isValid) {
    throw new Error("You need to be logged in.");
  }

  setCloudState({ syncing: true, error: null });

  try {
    if (transferLocalData) {
      await forceTransferLocalDataToCloud(userId);
      setInitialTransferDecision(userId, "transfer");
    } else {
      await pullCloudToLocalOrReset(userId);
      setInitialTransferDecision(userId, "skip-transfer");
    }

    setCloudState({
      requiresInitialTransferChoice: false,
      lastSyncAt: Date.now(),
    });
  } catch (error) {
    setCloudState({ error: getErrorMessage(error) });
    throw error;
  } finally {
    setCloudState({ syncing: false });
  }
}

export function signOutFromPocketBase(): void {
  if (syncDebounceTimer !== null) {
    window.clearTimeout(syncDebounceTimer);
    syncDebounceTimer = null;
  }

  cloudRecordId = null;
  pocketbase.authStore.clear();
  setLocalDataUpdatedAt(Date.now());
  setCloudState({ requiresInitialTransferChoice: false });
}

export async function syncNow(): Promise<void> {
  if (pocketbase.authStore.isValid) {
    const userId = currentUserId();
    if (userId && hasInitialTransferDecision(userId) === false) {
      throw new Error(
        "Please choose whether to transfer local data before syncing.",
      );
    }
  }

  await reconcileLocalAndCloud();
}
