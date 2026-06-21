import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import { writable } from "svelte/store";

import {
  applySnapshotToLocalState,
  collectLocalSnapshot,
  normalizeSyncedAppData,
  type SyncedAppData,
} from "./localDataSnapshot.js";
import { emptyUserProfile, profile } from "../stores/profile.js";
import { activities } from "../stores/activities.js";
import { templates } from "../stores/templates.js";
import { subscriptions } from "../stores/ical.js";
import { exportSettings } from "../stores/exportSettings.js";
import { bibleVerse } from "../stores/bibleVerse.js";
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
const REGISTERED_ON_DEVICE_KEY_PREFIX = "wochenschau_registered_on_device";
const REALTIME_SYNC_TOPIC = "*";

const EXPORT_SETTINGS_KEY = "exportSettings";
const BIBLE_VERSE_KEY = "bibleVerseState";
const EXPORT_LAYOUT_MODE_KEY = "exportLayoutMode";
const EXPORT_SHOW_PREVIEW_KEY = "exportShowPreview";
const EXPORT_RANGE_MODE_KEY = "exportRangeMode";
const EXPORT_DAY_RANGE_START_KEY = "exportDayRangeStart";
const EXPORT_DAY_RANGE_END_KEY = "exportDayRangeEnd";

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
let realtimeSubscribedUserId: string | null = null;
let realtimeSubscriptionInFlight: Promise<void> | null = null;
let profileRealtimeSubscribedUserId: string | null = null;
let profileRealtimeSubscriptionInFlight: Promise<void> | null = null;
let markNextAuthenticatedUserAsDeviceRegistration = false;

interface CloudSyncRealtimeRecord {
  id: string;
  user: string;
  payload: unknown;
  clientUpdatedAt: number;
}

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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseRealtimeRecord(event: unknown): CloudSyncRealtimeRecord | null {
  if (!isObjectRecord(event)) return null;

  const eventRecord = event.record;
  if (!isObjectRecord(eventRecord)) return null;

  const id = typeof eventRecord.id === "string" ? eventRecord.id : "";
  const user = typeof eventRecord.user === "string" ? eventRecord.user : "";
  const clientUpdatedAtRaw = Number(eventRecord.clientUpdatedAt);

  if (!id || !user || !Number.isFinite(clientUpdatedAtRaw)) {
    return null;
  }

  return {
    id,
    user,
    payload: eventRecord.payload,
    clientUpdatedAt: clientUpdatedAtRaw,
  };
}

function parseRealtimeAction(event: unknown): string {
  if (!isObjectRecord(event)) return "";
  return typeof event.action === "string" ? event.action : "";
}

function clearRealtimeSyncSubscription(): void {
  try {
    pocketbase
      .collection(POCKETBASE_DATA_COLLECTION)
      .unsubscribe(REALTIME_SYNC_TOPIC);
  } catch {
    // No active subscription.
  }

  realtimeSubscribedUserId = null;
}

function clearProfileRealtimeSubscription(): void {
  const userId = profileRealtimeSubscribedUserId ?? currentUserId();

  if (userId) {
    try {
      pocketbase.collection(POCKETBASE_AUTH_COLLECTION).unsubscribe(userId);
    } catch {
      // No active subscription.
    }
  }

  profileRealtimeSubscribedUserId = null;
}

async function handleProfileRealtimeEvent(event: unknown): Promise<void> {
  if (!isObjectRecord(event)) return;

  const action = typeof event.action === "string" ? event.action : "";
  if (action !== "update" && action !== "create") return;

  const eventRecord = event.record;
  if (!isObjectRecord(eventRecord)) return;
  if (!pocketbase.authStore.isValid) return;

  try {
    const mapped = mapRecordToProfile(eventRecord as RecordModel);
    profile.setFromRecord(mapped);
  } catch {
    // Ignore malformed realtime payloads.
  }
}

async function ensureProfileRealtimeSubscription(): Promise<void> {
  if (!pocketbase.authStore.isValid) return;

  const userId = currentUserId();
  if (!userId) return;
  if (profileRealtimeSubscribedUserId === userId) return;

  if (profileRealtimeSubscriptionInFlight) {
    await profileRealtimeSubscriptionInFlight;
    return;
  }

  const requestedUserId = userId;

  profileRealtimeSubscriptionInFlight = (async () => {
    clearProfileRealtimeSubscription();

    await pocketbase
      .collection(POCKETBASE_AUTH_COLLECTION)
      .subscribe(requestedUserId, (event: unknown) => {
        void handleProfileRealtimeEvent(event);
      });

    if (!pocketbase.authStore.isValid || currentUserId() !== requestedUserId) {
      clearProfileRealtimeSubscription();
      return;
    }

    profileRealtimeSubscribedUserId = requestedUserId;
  })()
    .catch((error) => {
      setCloudState({ error: getErrorMessage(error) });
    })
    .finally(() => {
      profileRealtimeSubscriptionInFlight = null;
    });

  await profileRealtimeSubscriptionInFlight;
}

function clearAppLocalStorage(): void {
  if (typeof window === "undefined") return;

  const directKeys = [
    EXPORT_SETTINGS_KEY,
    BIBLE_VERSE_KEY,
    EXPORT_LAYOUT_MODE_KEY,
    EXPORT_SHOW_PREVIEW_KEY,
    EXPORT_RANGE_MODE_KEY,
    EXPORT_DAY_RANGE_START_KEY,
    EXPORT_DAY_RANGE_END_KEY,
  ];

  for (const key of directKeys) {
    localStorage.removeItem(key);
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (!key) continue;

    if (key.startsWith("wochenschau_")) {
      localStorage.removeItem(key);
    }
  }
}

async function clearLocalDataOnSignOut(): Promise<void> {
  try {
    activities.clearAll();
    templates.replaceAll([]);
    subscriptions.replaceAll([]);
    profile.setFromRecord(emptyUserProfile);
    bibleVerse.reset();
    await exportSettings.reset();
  } catch {
    // Best-effort cleanup.
  }

  clearAppLocalStorage();
}

async function applyRealtimeRecord(
  record: CloudSyncRealtimeRecord,
): Promise<void> {
  if (!pocketbase.authStore.isValid) return;

  const userId = currentUserId();
  if (!userId || record.user !== userId) return;

  cloudRecordId = record.id;

  const remoteUpdatedAt = Number(record.clientUpdatedAt) || 0;
  if (remoteUpdatedAt <= 0) return;

  const localUpdatedAt = getLocalDataUpdatedAt();
  if (remoteUpdatedAt <= localUpdatedAt) return;

  const remoteSnapshot = normalizeSyncedAppData(record.payload);
  if (!remoteSnapshot) return;

  setCloudState({ syncing: true, error: null });

  try {
    await applySnapshotToLocalState({
      ...remoteSnapshot,
      updatedAt: remoteUpdatedAt,
    });

    setCloudState({ lastSyncAt: Date.now() });
  } catch (error) {
    setCloudState({ error: getErrorMessage(error) });
  } finally {
    setCloudState({ syncing: false });
  }
}

async function handleRealtimeEvent(event: unknown): Promise<void> {
  const action = parseRealtimeAction(event);
  const record = parseRealtimeRecord(event);

  if (!record) return;

  if (action === "delete") {
    if (record.user === currentUserId()) {
      cloudRecordId = null;
    }
    return;
  }

  await applyRealtimeRecord(record);
}

async function ensureRealtimeSyncSubscription(): Promise<void> {
  if (!pocketbase.authStore.isValid) return;

  const userId = currentUserId();
  if (!userId) return;
  if (realtimeSubscribedUserId === userId) return;

  if (realtimeSubscriptionInFlight) {
    await realtimeSubscriptionInFlight;
    return;
  }

  const requestedUserId = userId;

  realtimeSubscriptionInFlight = (async () => {
    clearRealtimeSyncSubscription();

    await pocketbase
      .collection(POCKETBASE_DATA_COLLECTION)
      .subscribe(REALTIME_SYNC_TOPIC, (event: unknown) => {
        void handleRealtimeEvent(event);
      });

    if (!pocketbase.authStore.isValid || currentUserId() !== requestedUserId) {
      clearRealtimeSyncSubscription();
      return;
    }

    realtimeSubscribedUserId = requestedUserId;
  })()
    .catch((error) => {
      setCloudState({ error: getErrorMessage(error) });
    })
    .finally(() => {
      realtimeSubscriptionInFlight = null;
    });

  await realtimeSubscriptionInFlight;
}

function refreshIdentityState(): void {
  const userId = currentUserId();

  if (
    markNextAuthenticatedUserAsDeviceRegistration &&
    pocketbase.authStore.isValid &&
    userId
  ) {
    markRegisteredOnDevice(userId);
    markNextAuthenticatedUserAsDeviceRegistration = false;
  }

  setCloudState({
    ready: true,
    isAuthenticated: pocketbase.authStore.isValid,
    userId,
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

function getRegisteredOnDeviceKey(userId: string): string {
  return `${REGISTERED_ON_DEVICE_KEY_PREFIX}_${userId}`;
}

function hasInitialTransferDecision(userId: string): boolean {
  if (typeof window === "undefined") return true;
  return Boolean(localStorage.getItem(getInitialTransferDecisionKey(userId)));
}

function setInitialTransferDecision(userId: string, value: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getInitialTransferDecisionKey(userId), value);
}

function markRegisteredOnDevice(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(getRegisteredOnDeviceKey(userId), "1");
}

function wasRegisteredOnDevice(userId: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(getRegisteredOnDeviceKey(userId)) === "1";
}

function clearRegisteredOnDeviceMark(userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getRegisteredOnDeviceKey(userId));
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

function resolveNextClientUpdatedAt(
  localUpdatedAt: number,
  remoteUpdatedAt: number,
): number {
  const local = Number.isFinite(localUpdatedAt) ? localUpdatedAt : 0;
  const remote = Number.isFinite(remoteUpdatedAt) ? remoteUpdatedAt : 0;

  return local > remote ? local : remote + 1;
}

async function writeLocalSnapshotToCloudRecord(
  recordId: string,
  userId: string,
  localSnapshot: SyncedAppData,
  remoteUpdatedAt: number,
): Promise<number> {
  const nextClientUpdatedAt = resolveNextClientUpdatedAt(
    localSnapshot.updatedAt,
    remoteUpdatedAt,
  );

  await updateCloudRecord(
    recordId,
    userId,
    {
      ...localSnapshot,
      updatedAt: nextClientUpdatedAt,
    },
    nextClientUpdatedAt,
  );

  if (nextClientUpdatedAt !== localSnapshot.updatedAt) {
    setLocalDataUpdatedAt(nextClientUpdatedAt);
  }

  return nextClientUpdatedAt;
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
        await writeLocalSnapshotToCloudRecord(
          cloudRecord.id,
          userId,
          localSnapshot,
          remoteUpdatedAt,
        );
      } else if (remoteHasData) {
        await applySnapshotToLocalState({
          ...remoteSnapshot,
          updatedAt: remoteUpdatedAt > 0 ? remoteUpdatedAt : Date.now(),
        });
      } else {
        await writeLocalSnapshotToCloudRecord(
          cloudRecord.id,
          userId,
          localSnapshot,
          remoteUpdatedAt,
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
      await writeLocalSnapshotToCloudRecord(
        cloudRecord.id,
        userId,
        localSnapshot,
        remoteUpdatedAt,
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

    await writeLocalSnapshotToCloudRecord(
      cloudRecord.id,
      userId,
      localSnapshot,
      remoteUpdatedAt,
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
  if (!wasRegisteredOnDevice(userId)) {
    setInitialTransferDecision(userId, "not-device-registration");
    return false;
  }

  const localSnapshot = await collectLocalSnapshot();
  const localHasData = hasMeaningfulSnapshotData(localSnapshot);

  if (!localHasData) {
    setInitialTransferDecision(userId, "no-local-data");
    clearRegisteredOnDeviceMark(userId);
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

  const remoteUpdatedAt = Number(cloudRecord.clientUpdatedAt) || 0;
  await writeLocalSnapshotToCloudRecord(
    cloudRecord.id,
    userId,
    localSnapshot,
    remoteUpdatedAt,
  );
}

async function startAuthenticatedSessionFlow(): Promise<void> {
  const userId = currentUserId();
  if (!userId || !pocketbase.authStore.isValid) return;

  await ensureProfileRealtimeSubscription();

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
  await ensureRealtimeSyncSubscription();

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
      clearRealtimeSyncSubscription();
      clearProfileRealtimeSubscription();
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

  markNextAuthenticatedUserAsDeviceRegistration = true;

  const trimmedEmail = email.trim();
  const authCollection = pocketbase.collection(POCKETBASE_AUTH_COLLECTION);

  try {
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

    const userId = currentUserId();
    if (userId) {
      markRegisteredOnDevice(userId);
    }

    markNextAuthenticatedUserAsDeviceRegistration = false;
  } catch (error) {
    markNextAuthenticatedUserAsDeviceRegistration = false;
    throw error;
  }
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

    clearRegisteredOnDeviceMark(userId);
    await ensureRealtimeSyncSubscription();

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

  markNextAuthenticatedUserAsDeviceRegistration = false;
  cloudRecordId = null;
  clearRealtimeSyncSubscription();
  clearProfileRealtimeSubscription();
  pocketbase.authStore.clear();
  void clearLocalDataOnSignOut();
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
