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
  titleFontWeight: "light" | "medium" | "bold"; // Font weight of title
  showWeekNumber: boolean; // Show "KW XX" below title

  // Background
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
  titleFontWeight: "bold",
  showWeekNumber: false,

  // Background
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
            const updated = {
              ...current,
              backgroundImage: base64,
              backgroundImageUrl: metadata.url,
              backgroundImageType: metadata.type,
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
              const updated = {
                ...current,
                backgroundImage: base64,
                backgroundImageUrl: parsed.backgroundImageUrl ?? null,
                backgroundImageType: parsed.backgroundImageType ?? null,
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
  };
}

export const exportSettings = createExportSettingsStore();

// Font family options - organized by category
export const FONT_FAMILIES = [
  // Handwriting & Calligraphy
  { name: "Great Vibes (Calligraphy)", value: "'Great Vibes', cursive" },
  { name: "Pacifico (Handwriting)", value: "'Pacifico', cursive" },
  { name: "Dancing Script (Script)", value: "'Dancing Script', cursive" },
  { name: "Satisfy (Handwriting)", value: "'Satisfy', cursive" },
  { name: "Caveat (Handwriting)", value: "'Caveat', cursive" },
  { name: "Allura (Calligraphy)", value: "'Allura', cursive" },
  { name: "Pinyon Script (Formal)", value: "'Pinyon Script', cursive" },
  { name: "Alex Brush (Elegant)", value: "'Alex Brush', cursive" },
  { name: "Parisienne (Elegant)", value: "'Parisienne', cursive" },
  { name: "Bad Script (Casual)", value: "'Bad Script', cursive" },

  // Serif Fonts
  { name: "Playfair Display (Serif)", value: "'Playfair Display', serif" },
  { name: "Merriweather (Serif)", value: "'Merriweather', serif" },
  { name: "Lora (Serif)", value: "'Lora', serif" },
  { name: "Noto Serif (Serif)", value: "'Noto Serif', serif" },
  { name: "PT Serif (Serif)", value: "'PT Serif', serif" },
  { name: "Alegreya (Serif)", value: "'Alegreya', serif" },
  { name: "Spectral (Serif)", value: "'Spectral', serif" },
  { name: "Rokkitt (Serif)", value: "'Rokkitt', serif" },
  { name: "Old Standard TT (Classic)", value: "'Old Standard TT', serif" },
  { name: "Aleo (Modern Serif)", value: "'Aleo', serif" },

  // Sans-Serif Fonts
  { name: "Roboto (Sans-Serif)", value: "'Roboto', sans-serif" },
  { name: "Open Sans (Sans-Serif)", value: "'Open Sans', sans-serif" },
  { name: "Lato (Sans-Serif)", value: "'Lato', sans-serif" },
  { name: "Montserrat (Sans-Serif)", value: "'Montserrat', sans-serif" },
  { name: "Poppins (Sans-Serif)", value: "'Poppins', sans-serif" },
  { name: "Inter (Sans-Serif)", value: "'Inter', sans-serif" },
  { name: "Nunito (Sans-Serif)", value: "'Nunito', sans-serif" },
  { name: "Raleway (Sans-Serif)", value: "'Raleway', sans-serif" },
  { name: "Rubik (Sans-Serif)", value: "'Rubik', sans-serif" },
  { name: "Manrope (Sans-Serif)", value: "'Manrope', sans-serif" },
  { name: "Fira Sans (Sans-Serif)", value: "'Fira Sans', sans-serif" },
  { name: "Noto Sans (Sans-Serif)", value: "'Noto Sans', sans-serif" },
  { name: "Public Sans (Sans-Serif)", value: "'Public Sans', sans-serif" },
  { name: "Barlow (Sans-Serif)", value: "'Barlow', sans-serif" },

  // Monospace Fonts
  { name: "Fira Code (Mono)", value: "'Fira Code', monospace" },
  { name: "Inconsolata (Mono)", value: "'Inconsolata', monospace" },
  { name: "Space Mono (Mono)", value: "'Space Mono', monospace" },
  { name: "Victor Mono (Mono)", value: "'Victor Mono', monospace" },
  { name: "M PLUS Code Latin (Mono)", value: "'M PLUS Code Latin', monospace" },

  // System Default (Fallback)
  { name: "System Default", value: "system-ui, -apple-system, sans-serif" },
];
