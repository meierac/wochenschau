import { writable } from "svelte/store";
import { imageStorage } from "./imageStorage";
import { notifyDataChanged } from "../services/syncTrigger.js";

export interface ExportSettings {
  // Typography
  headerFontFamily: string;
  bodyFontFamily: string;
  textColor: string;

  // Title/Headline

  title: string;

  titleFontSize: number; // in pixels

  titleOpacity: number; // 0-100 (opacity for headline/title text)

  titleColor: string; // Separate color for main title
  titleDropShadowEnabled: boolean; // Enable drop shadow for title text
  titleDropShadowColor: string; // Color of the drop shadow
  titleDropShadowOffsetX: number; // X offset in pixels
  titleDropShadowOffsetY: number; // Y offset in pixels
  showWeekNumber: boolean; // Show "KW XX" in export header
  weekNumberLayout: "inline" | "separate-line"; // Position week number next to or below title
  syncWeekNumberWithTitle: boolean; // Reuse title font settings for week number
  weekNumberFontFamily: string; // Dedicated week number font when not synced
  weekNumberFontSize: number; // Dedicated week number size when not synced
  weekNumberColor: string; // Dedicated week number color
  weekNumberOpacity: number; // 0-100 opacity for week number
  weekNumberDropShadowEnabled: boolean; // Enable drop shadow for week number text
  weekNumberDropShadowColor: string; // Color of the drop shadow
  weekNumberDropShadowOffsetX: number; // X offset in pixels
  weekNumberDropShadowOffsetY: number; // Y offset in pixels

  // Background
  backgroundMode: "color" | "image"; // Which background to use
  backgroundImage: string | null; // base64 or URL (loaded from IndexedDB)
  backgroundImageUrl: string | null; // Original URL/ID for tracking selection
  backgroundImageType: "default" | "custom" | null; // Track image source
  backgroundColor: string;
  backgroundOpacity: number; // 0-100

  // Styling
  accentColor: string;
  borderRadius: number; // 0-20
  showBorders: boolean;

  // Week container styling
  weekContainerBackgroundColor: string;
  weekContainerBackgroundOpacity: number; // 0-100
}

export const defaultExportSettings: ExportSettings = {
  // Typography
  headerFontFamily: "'Ms Madi'",
  bodyFontFamily: "'Manrope'",
  textColor: "#ffffff",

  // Title/Headline

  title: "Wochenschau",

  titleFontSize: 60,

  titleOpacity: 100,

  titleColor: "#000000",
  titleDropShadowEnabled: false,
  titleDropShadowColor: "#000000",
  titleDropShadowOffsetX: 2,
  titleDropShadowOffsetY: 2,
  showWeekNumber: false,
  weekNumberLayout: "separate-line",
  syncWeekNumberWithTitle: true,
  weekNumberFontFamily: "'Ms Madi'",
  weekNumberFontSize: 24,
  weekNumberColor: "#ffffff",
  weekNumberOpacity: 80,
  weekNumberDropShadowEnabled: false,
  weekNumberDropShadowColor: "#000000",
  weekNumberDropShadowOffsetX: 2,
  weekNumberDropShadowOffsetY: 2,

  // Background
  backgroundMode: "color",
  backgroundImage: null,
  backgroundImageUrl: null,
  backgroundImageType: null,
  backgroundColor: "#ffffff",
  backgroundOpacity: 100,

  // Styling
  accentColor: "#eed349",
  borderRadius: 10,
  showBorders: true,

  // Week container styling
  weekContainerBackgroundColor: "#000000",
  weekContainerBackgroundOpacity: 30,
};

function cloneDefaultExportSettings(): ExportSettings {
  return { ...defaultExportSettings };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function stringOrFallback(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function nullableStringOrFallback(
  value: unknown,
  fallback: string | null,
): string | null {
  if (value === null) return null;
  return typeof value === "string" ? value : fallback;
}

function numberOrFallback(value: unknown, fallback: number): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : fallback;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function booleanOrFallback(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

function backgroundModeOrFallback(
  value: unknown,
  fallback: ExportSettings["backgroundMode"],
): ExportSettings["backgroundMode"] {
  return value === "color" || value === "image" ? value : fallback;
}

function backgroundImageTypeOrFallback(
  value: unknown,
  fallback: ExportSettings["backgroundImageType"],
): ExportSettings["backgroundImageType"] {
  if (value === null) return null;
  return value === "default" || value === "custom" ? value : fallback;
}

function weekNumberLayoutOrFallback(
  value: unknown,
  fallback: ExportSettings["weekNumberLayout"],
): ExportSettings["weekNumberLayout"] {
  return value === "inline" || value === "separate-line" ? value : fallback;
}

export function normalizeExportSettings(
  value: unknown,
  fallback: ExportSettings = defaultExportSettings,
): ExportSettings {
  const source = isRecord(value) ? value : {};

  return {
    headerFontFamily: stringOrFallback(
      source.headerFontFamily,
      fallback.headerFontFamily,
    ),
    bodyFontFamily: stringOrFallback(
      source.bodyFontFamily,
      fallback.bodyFontFamily,
    ),
    textColor: stringOrFallback(source.textColor, fallback.textColor),

    title: stringOrFallback(source.title, fallback.title),
    titleFontSize: numberOrFallback(
      source.titleFontSize,
      fallback.titleFontSize,
    ),
    titleOpacity: numberOrFallback(source.titleOpacity, fallback.titleOpacity),
    titleColor: stringOrFallback(source.titleColor, fallback.titleColor),
    titleDropShadowEnabled: booleanOrFallback(
      source.titleDropShadowEnabled,
      fallback.titleDropShadowEnabled,
    ),
    titleDropShadowColor: stringOrFallback(
      source.titleDropShadowColor,
      fallback.titleDropShadowColor,
    ),
    titleDropShadowOffsetX: numberOrFallback(
      source.titleDropShadowOffsetX,
      fallback.titleDropShadowOffsetX,
    ),
    titleDropShadowOffsetY: numberOrFallback(
      source.titleDropShadowOffsetY,
      fallback.titleDropShadowOffsetY,
    ),
    showWeekNumber: booleanOrFallback(
      source.showWeekNumber,
      fallback.showWeekNumber,
    ),
    weekNumberLayout: weekNumberLayoutOrFallback(
      source.weekNumberLayout,
      fallback.weekNumberLayout,
    ),
    syncWeekNumberWithTitle: booleanOrFallback(
      source.syncWeekNumberWithTitle,
      fallback.syncWeekNumberWithTitle,
    ),
    weekNumberFontFamily: stringOrFallback(
      source.weekNumberFontFamily,
      fallback.weekNumberFontFamily,
    ),
    weekNumberFontSize: numberOrFallback(
      source.weekNumberFontSize,
      fallback.weekNumberFontSize,
    ),
    weekNumberColor: stringOrFallback(
      source.weekNumberColor,
      fallback.weekNumberColor,
    ),
    weekNumberOpacity: numberOrFallback(
      source.weekNumberOpacity,
      fallback.weekNumberOpacity,
    ),
    weekNumberDropShadowEnabled: booleanOrFallback(
      source.weekNumberDropShadowEnabled,
      fallback.weekNumberDropShadowEnabled,
    ),
    weekNumberDropShadowColor: stringOrFallback(
      source.weekNumberDropShadowColor,
      fallback.weekNumberDropShadowColor,
    ),
    weekNumberDropShadowOffsetX: numberOrFallback(
      source.weekNumberDropShadowOffsetX,
      fallback.weekNumberDropShadowOffsetX,
    ),
    weekNumberDropShadowOffsetY: numberOrFallback(
      source.weekNumberDropShadowOffsetY,
      fallback.weekNumberDropShadowOffsetY,
    ),

    backgroundMode: backgroundModeOrFallback(
      source.backgroundMode,
      fallback.backgroundMode,
    ),
    backgroundImage: nullableStringOrFallback(
      source.backgroundImage,
      fallback.backgroundImage,
    ),
    backgroundImageUrl: nullableStringOrFallback(
      source.backgroundImageUrl,
      fallback.backgroundImageUrl,
    ),
    backgroundImageType: backgroundImageTypeOrFallback(
      source.backgroundImageType,
      fallback.backgroundImageType,
    ),
    backgroundColor: stringOrFallback(
      source.backgroundColor,
      fallback.backgroundColor,
    ),
    backgroundOpacity: numberOrFallback(
      source.backgroundOpacity,
      fallback.backgroundOpacity,
    ),

    accentColor: stringOrFallback(source.accentColor, fallback.accentColor),
    borderRadius: numberOrFallback(source.borderRadius, fallback.borderRadius),
    showBorders: booleanOrFallback(source.showBorders, fallback.showBorders),

    weekContainerBackgroundColor: stringOrFallback(
      source.weekContainerBackgroundColor,
      fallback.weekContainerBackgroundColor,
    ),
    weekContainerBackgroundOpacity: numberOrFallback(
      source.weekContainerBackgroundOpacity,
      fallback.weekContainerBackgroundOpacity,
    ),
  };
}

function createExportSettingsStore() {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("exportSettings")
      : null;
  const parsed = safeJsonParse<Partial<ExportSettings>>(stored);
  const initial: ExportSettings = parsed
    ? normalizeExportSettings({ ...parsed, backgroundImage: null })
    : cloneDefaultExportSettings();

  const { subscribe, set, update } = writable<ExportSettings>(initial);

  // Initialize and load background image from IndexedDB
  const initializeImage = async () => {
    try {
      const metadata = await imageStorage.getImageMetadata();
      if (metadata) {
        const base64 = await imageStorage.getImageAsBase64();
        if (base64) {
          // Update with current settings merged with image
          update((current) => {
            const updated = normalizeExportSettings({
              ...current,
              backgroundImage: base64,
              backgroundImageUrl: metadata.url,
              backgroundImageType: metadata.type,
              backgroundMode: "image" as const, // Set mode to image when loading from IndexedDB
            });
            return updated;
          });
          return;
        }
      }

      // Migration: Check if old localStorage has image data
      const stored =
        typeof window !== "undefined"
          ? localStorage.getItem("exportSettings")
          : null;
      const parsed = safeJsonParse<Partial<ExportSettings>>(stored);
      if (parsed && parsed.backgroundImage) {
        // Migrate to IndexedDB
        await imageStorage.migrateFromLocalStorage(parsed.backgroundImage);
        // Load it back
        const base64 = await imageStorage.getImageAsBase64();
        if (base64) {
          // Update with current settings merged with image
          update((current) => {
            const updated = normalizeExportSettings({
              ...current,
              backgroundImage: base64,
              backgroundImageUrl: parsed.backgroundImageUrl ?? null,
              backgroundImageType: parsed.backgroundImageType ?? null,
              backgroundMode: "image" as const, // Set mode to image when migrating
            });
            return updated;
          });
        }
        // Clean up localStorage - remove the large base64 string
        delete parsed.backgroundImage;
        localStorage.setItem("exportSettings", JSON.stringify(parsed));
      }
    } catch (error) {
      console.error("Failed to load background image from IndexedDB:", error);
    }
  };

  // Start loading image immediately in the browser
  if (typeof window !== "undefined") {
    initializeImage();
  }

  // Helper to save settings to localStorage (without backgroundImage)
  const saveToLocalStorage = (settings: ExportSettings) => {
    if (typeof window === "undefined") return;
    const normalized = normalizeExportSettings(settings);
    const { backgroundImage, ...settingsWithoutImage } = normalized;
    localStorage.setItem(
      "exportSettings",
      JSON.stringify(settingsWithoutImage),
    );
  };

  return {
    subscribe,
    set: (value: ExportSettings) => {
      const normalized = normalizeExportSettings(value);
      saveToLocalStorage(normalized);
      set(normalized);
      notifyDataChanged();
    },
    update: (updater: (value: ExportSettings) => ExportSettings) => {
      update((current) => {
        const normalizedCurrent = normalizeExportSettings(current);
        const updated = normalizeExportSettings(
          updater(normalizedCurrent),
          normalizedCurrent,
        );
        saveToLocalStorage(updated);
        return updated;
      });
      notifyDataChanged();
    },
    reset: async () => {
      // Clear IndexedDB image
      try {
        await imageStorage.deleteImage();
      } catch (error) {
        console.error("Failed to delete image from IndexedDB:", error);
      }
      const defaults = cloneDefaultExportSettings();
      saveToLocalStorage(defaults);
      set(defaults);
      notifyDataChanged();
    },
    setBackgroundImage: async (
      imageData: string | null,
      url: string | null = null,
      type: "default" | "custom" | null = null,
    ) => {
      try {
        if (imageData) {
          // Store in IndexedDB
          await imageStorage.setImageFromBase64(imageData, url, type);
        } else {
          // Clear from IndexedDB
          await imageStorage.deleteImage();
        }

        // Update store with the image data and metadata
        update((current) => {
          const updated = normalizeExportSettings({
            ...current,
            backgroundImage: imageData,
            backgroundImageUrl: url,
            backgroundImageType: type,
          });
          saveToLocalStorage(updated);
          return updated;
        });

        notifyDataChanged();
      } catch (error) {
        console.error("Failed to save background image:", error);
        throw error;
      }
    },
    // Expose initialize function for manual refresh if needed
    refreshImage: initializeImage,
    setBackgroundMode: (mode: "color" | "image") => {
      update((current) => {
        const updated = normalizeExportSettings({
          ...current,
          backgroundMode: mode,
        });
        saveToLocalStorage(updated);
        return updated;
      });
      notifyDataChanged();
    },
  };
}

export const exportSettings = createExportSettingsStore();

// Font family options - LOCAL FONTS ONLY
// Only fonts that are available in /static/fonts/
export const FONT_FAMILIES = [
  // Handwriting & Script (Local)
  { name: "Dancing Script (Script)", value: "'Dancing Script'" },
  { name: "Edu QLD Hand (Handwriting)", value: "'Edu QLD Hand'" },
  { name: "Edu SA Hand (Handwriting)", value: "'Edu SA Hand'" },
  { name: "Handlee (Handwriting)", value: "'Handlee'" },
  { name: "Kavivanar (Handwriting)", value: "'Kavivanar'" },
  { name: "Sedgwick Ave (Handwriting)", value: "'Sedgwick Ave'" },
  { name: "Ms Madi (Script)", value: "'Ms Madi'" },
  { name: "Yesteryear (Script)", value: "'Yesteryear'" },

  // Serif Fonts (Local)
  { name: "Lora (Serif)", value: "'Lora'" },

  // Sans-Serif Fonts (Local)
  { name: "Archivo (Sans-Serif)", value: "'Archivo'" },
  { name: "Manrope (Sans-Serif)", value: "'Manrope'" },
  { name: "Noto Sans (Sans-Serif)", value: "'Noto Sans'" },

  // Display/Decorative (Local)
  { name: "Pirata One (Display)", value: "'Pirata One'" },
  { name: "Chango (Display)", value: "'Chango'" },
  { name: "Climate Crisis (Display)", value: "'Climate Crisis'" },

  // Monospace Fonts (Local)
  { name: "Space Mono (Mono)", value: "'Space Mono'" },

  // System Default (Fallback)
  { name: "System Default", value: "system-ui, -apple-system, sans-serif" },
];
