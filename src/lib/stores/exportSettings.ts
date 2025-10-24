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
  showWeekNumber: boolean; // Show "KW XX" below title

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
  headerFontFamily: "'Playfair Display', serif",
  bodyFontFamily: "'Inter', sans-serif",
  textColor: "#000000",

  // Title/Headline
  title: "Wochenschau",
  titleFontSize: 48,
  showWeekNumber: false,

  // Background
  backgroundMode: "color",
  backgroundImage: null,
  backgroundImageUrl: null,
  backgroundImageType: null,
  backgroundColor: "#ffffff",
  backgroundOpacity: 100,

  // Styling
  accentColor: "#9333ea",
  borderRadius: 8,
  showBorders: true,

  // Week container styling
  weekContainerBackgroundColor: "rgba(255, 255, 255, 0.75)",
  weekContainerBackgroundOpacity: 75,
};

function createExportSettingsStore() {
  const stored = localStorage.getItem("exportSettings");
  let initial: ExportSettings;

  if (stored) {
    const parsed = JSON.parse(stored);
    // Ensure new fields exist for backward compatibility
    initial = {
      ...defaultSettings,
      ...parsed,
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
            console.log("Background image loaded from IndexedDB:", {
              url: metadata.url,
              type: metadata.type,
              hasImage: !!base64,
            });
            return updated;
          });
          return;
        }
      }

      // Migration: Check if old localStorage has image data
      const stored = localStorage.getItem("exportSettings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.backgroundImage) {
          console.log(
            "Migrating background image from localStorage to IndexedDB...",
          );
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
          console.log("Migration complete");
        }
      }
    } catch (error) {
      console.error("Failed to load background image from IndexedDB:", error);
    }
  };

  // Start loading image immediately
  initializeImage();

  // Helper to save settings to localStorage (without backgroundImage)
  const saveToLocalStorage = (settings: ExportSettings) => {
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
          console.log("Image stored in IndexedDB:", { url, type });
        } else {
          // Clear from IndexedDB
          await imageStorage.deleteImage();
          console.log("Image cleared from IndexedDB");
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
          console.log("Store updated with background image:", {
            hasImage: !!imageData,
            url,
            type,
          });
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
        console.log("Background mode set to:", mode);
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
  { name: "Dancing Script (Script)", value: "'Dancing Script', cursive" },
  { name: "Edu QLD Hand (Handwriting)", value: "'Edu QLD Hand', cursive" },
  { name: "Edu SA Hand (Handwriting)", value: "'Edu SA Hand', cursive" },
  { name: "Handlee (Handwriting)", value: "'Handlee', cursive" },
  { name: "Ms Madi (Script)", value: "'Ms Madi', cursive" },

  // Serif Fonts (Local)
  { name: "Lora (Serif)", value: "'Lora', serif" },

  // Sans-Serif Fonts (Local)
  { name: "Archivo (Sans-Serif)", value: "'Archivo', sans-serif" },
  { name: "Manrope (Sans-Serif)", value: "'Manrope', sans-serif" },
  { name: "Noto Sans (Sans-Serif)", value: "'Noto Sans', sans-serif" },

  // Display/Decorative (Local)
  { name: "Pirata One (Display)", value: "'Pirata One', display" },

  // Monospace Fonts (Local)
  { name: "Space Mono (Mono)", value: "'Space Mono', monospace" },

  // System Default (Fallback)
  { name: "System Default", value: "system-ui, -apple-system, sans-serif" },
];
