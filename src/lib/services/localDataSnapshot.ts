import { get } from "svelte/store";

import type {
  ActivityTemplate,
  CalendarItem,
  ICalSubscription,
  UserProfile,
} from "../types/index.js";
import type { BibleVerseState } from "../stores/bibleVerse";
import {
  exportSettings,
  normalizeExportSettings,
  type ExportSettings,
} from "../stores/exportSettings";

import { activities } from "../stores/activities";
import { templates } from "../stores/templates";
import { subscriptions } from "../stores/ical";
import { profile, emptyUserProfile } from "../stores/profile";
import { bibleVerse } from "../stores/bibleVerse";
import { imageStorage } from "../stores/imageStorage";

import {
  getActivities,
  getTemplates,
  getSubscriptions,
} from "../utils/storage.js";

import {
  getLocalDataUpdatedAt,
  setLocalDataUpdatedAt,
  withDataChangeNotificationsSuppressed,
} from "./syncTrigger.js";

const EXPORT_SETTINGS_KEY = "exportSettings";
const BIBLE_VERSE_KEY = "bibleVerseState";

export interface SyncedAppData {
  schemaVersion: 1;
  updatedAt: number;
  activities: CalendarItem[];
  templates: ActivityTemplate[];
  subscriptions: ICalSubscription[];
  profile: UserProfile;
  exportSettings: Partial<ExportSettings>;
  bibleVerseState: BibleVerseState | null;
  backgroundImage: string | null;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeUpdatedAt(value: unknown, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeProfile(value: unknown): UserProfile {
  if (!isRecord(value)) return emptyUserProfile;

  return {
    ...emptyUserProfile,
    ...value,
  };
}

function normalizeExportSettingsPayload(
  value: unknown,
): Partial<ExportSettings> {
  if (!isRecord(value)) return {};
  return value as Partial<ExportSettings>;
}

function normalizeBibleVerseState(value: unknown): BibleVerseState | null {
  if (!isRecord(value)) return null;

  if (typeof value.enabled !== "boolean") return null;
  if (!Array.isArray(value.usedIndices)) return null;
  if (!Array.isArray(value.selectedThemes)) return null;
  if (!isRecord(value.currentVerse)) return null;

  return value as unknown as BibleVerseState;
}

export async function collectLocalSnapshot(): Promise<SyncedAppData> {
  const timestamp = getLocalDataUpdatedAt();
  const updatedAt = timestamp > 0 ? timestamp : Date.now();

  if (timestamp === 0) {
    setLocalDataUpdatedAt(updatedAt);
  }

  const exportSettingsRaw =
    typeof window !== "undefined"
      ? safeJsonParse<Partial<ExportSettings>>(
          localStorage.getItem(EXPORT_SETTINGS_KEY),
        )
      : null;

  const bibleVerseRaw =
    typeof window !== "undefined"
      ? safeJsonParse<BibleVerseState>(localStorage.getItem(BIBLE_VERSE_KEY))
      : null;

  let backgroundImage: string | null = null;
  try {
    backgroundImage = await imageStorage.getImageAsBase64();
  } catch {
    backgroundImage = null;
  }

  return {
    schemaVersion: 1,
    updatedAt,
    activities: getActivities(),
    templates: getTemplates(),
    subscriptions: getSubscriptions(),
    profile: get(profile),
    exportSettings: exportSettingsRaw || {},
    bibleVerseState: bibleVerseRaw,
    backgroundImage,
  };
}

export function normalizeSyncedAppData(value: unknown): SyncedAppData | null {
  if (!isRecord(value)) return null;

  const fallbackUpdatedAt = Date.now();

  return {
    schemaVersion: 1,
    updatedAt: normalizeUpdatedAt(value.updatedAt, fallbackUpdatedAt),
    activities: Array.isArray(value.activities)
      ? (value.activities as CalendarItem[])
      : [],
    templates: Array.isArray(value.templates)
      ? (value.templates as ActivityTemplate[])
      : [],
    subscriptions: Array.isArray(value.subscriptions)
      ? (value.subscriptions as ICalSubscription[])
      : [],
    profile: normalizeProfile(value.profile),
    exportSettings: normalizeExportSettingsPayload(value.exportSettings),
    bibleVerseState: normalizeBibleVerseState(value.bibleVerseState),
    backgroundImage:
      typeof value.backgroundImage === "string" ? value.backgroundImage : null,
  };
}

export async function applySnapshotToLocalState(
  snapshot: SyncedAppData,
): Promise<void> {
  await withDataChangeNotificationsSuppressed(async () => {
    activities.replaceAll(snapshot.activities);
    templates.replaceAll(snapshot.templates);
    subscriptions.replaceAll(snapshot.subscriptions);

    const currentExportSettings = get(exportSettings);
    const mergedExportSettings = normalizeExportSettings({
      ...currentExportSettings,
      ...snapshot.exportSettings,
      backgroundImage: snapshot.backgroundImage,
    });

    exportSettings.set(mergedExportSettings);
    await exportSettings.setBackgroundImage(
      snapshot.backgroundImage,
      mergedExportSettings.backgroundImageUrl ?? null,
      mergedExportSettings.backgroundImageType ?? null,
    );

    if (snapshot.bibleVerseState) {
      bibleVerse.setState(snapshot.bibleVerseState);
    }

    setLocalDataUpdatedAt(snapshot.updatedAt);
  });
}
