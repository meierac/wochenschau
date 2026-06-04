import { writable } from "svelte/store";
import { imageStorage } from "./imageStorage";

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

const defaultSettings: ExportSettings = {
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

function createExportSettingsStore() {
  const stored =
    typeof window !== "undefined"
      ? localStorage.getItem("exportSettings")
      : null;
  let initial: ExportSettings;

  if (stored) {
    const parsed = JSON.parse(stored);
    // Ensure new fields exist for backward compatibility
    initial = {
      ...defaultSettings,

      ...parsed,

      titleColor: parsed.titleColor ?? defaultSettings.titleColor,
      titleDropShadowEnabled:
        parsed.titleDropShadowEnabled ?? defaultSettings.titleDropShadowEnabled,
      titleDropShadowColor:
        parsed.titleDropShadowColor ?? defaultSettings.titleDropShadowColor,
      titleDropShadowOffsetX:
        parsed.titleDropShadowOffsetX ?? defaultSettings.titleDropShadowOffsetX,
      titleDropShadowOffsetY:
        parsed.titleDropShadowOffsetY ?? defaultSettings.titleDropShadowOffsetY,
      weekNumberLayout:
        parsed.weekNumberLayout ?? defaultSettings.weekNumberLayout,
      syncWeekNumberWithTitle:
        parsed.syncWeekNumberWithTitle ??
        defaultSettings.syncWeekNumberWithTitle,
      weekNumberFontFamily:
        parsed.weekNumberFontFamily ?? defaultSettings.weekNumberFontFamily,
      weekNumberFontSize:
        parsed.weekNumberFontSize ?? defaultSettings.weekNumberFontSize,
      weekNumberColor:
        parsed.weekNumberColor ?? defaultSettings.weekNumberColor,
      weekNumberOpacity:
        parsed.weekNumberOpacity ?? defaultSettings.weekNumberOpacity,
      backgroundMode: parsed.backgroundMode ?? "color",

      backgroundImageUrl: parsed.backgroundImageUrl ?? null,

      backgroundImageType: parsed.backgroundImageType ?? null,

      // Don't load backgroundImage from localStorage - will load from IndexedDB

      backgroundImage: null,
    };
  } else {
    initial = defaultSettings;
  }

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
            const updated: ExportSettings = {
              ...current,
              backgroundImage: base64,
              backgroundImageUrl: metadata.url,
              backgroundImageType: metadata.type,
              backgroundMode: "image" as const, // Set mode to image when loading from IndexedDB
            };
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
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.backgroundImage) {
          // Migrate to IndexedDB
          await imageStorage.migrateFromLocalStorage(parsed.backgroundImage);
          // Load it back
          const base64 = await imageStorage.getImageAsBase64();
          if (base64) {
            // Update with current settings merged with image
            update((current) => {
              const updated: ExportSettings = {
                ...current,
                backgroundImage: base64,
                backgroundImageUrl: parsed.backgroundImageUrl ?? null,
                backgroundImageType: parsed.backgroundImageType ?? null,
                backgroundMode: "image" as const, // Set mode to image when migrating
              };
              return updated;
            });
          }
          // Clean up localStorage - remove the large base64 string
          delete parsed.backgroundImage;
          localStorage.setItem("exportSettings", JSON.stringify(parsed));
        }
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
    const { backgroundImage, ...settingsWithoutImage } = settings;
    localStorage.setItem(
      "exportSettings",
      JSON.stringify(settingsWithoutImage),
    );
  };

  return {
    subscribe,
    set: (value: ExportSettings) => {
      saveToLocalStorage(value);
      set(value);
    },
    update: (updater: (value: ExportSettings) => ExportSettings) => {
      update((current) => {
        const updated = updater(current);
        saveToLocalStorage(updated);
        return updated;
      });
    },
    reset: async () => {
      // Clear IndexedDB image
      try {
        await imageStorage.deleteImage();
      } catch (error) {
        console.error("Failed to delete image from IndexedDB:", error);
      }
      saveToLocalStorage(defaultSettings);
      set(defaultSettings);
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
          const updated = {
            ...current,
            backgroundImage: imageData,
            backgroundImageUrl: url,
            backgroundImageType: type,
          };
          saveToLocalStorage(updated);
          return updated;
        });
      } catch (error) {
        console.error("Failed to save background image:", error);
        throw error;
      }
    },
    // Expose initialize function for manual refresh if needed
    refreshImage: initializeImage,
    setBackgroundMode: (mode: "color" | "image") => {
      update((current) => {
        const updated = {
          ...current,
          backgroundMode: mode,
        };
        saveToLocalStorage(updated);
        return updated;
      });
    },
  };
}

export const exportSettings = createExportSettingsStore();

// Font family options - LOCAL FONTS ONLY
// Only fonts that are available in /public/fonts/
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
