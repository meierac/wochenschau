/**
 * IndexedDB storage for large background images
 * Handles up to 10MB+ images efficiently using Blobs
 */

const DB_NAME = "wochenschau-images";
const DB_VERSION = 1;
const STORE_NAME = "backgrounds";
const BACKGROUND_KEY = "current-background";

interface ImageData {
  key: string;
  blob: Blob;
  url: string | null; // Original URL/ID for tracking
  type: "default" | "custom" | null;
  timestamp: number;
}

class ImageStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  private async init(): Promise<void> {
    if (this.db) return;

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(new Error("Failed to open IndexedDB"));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Store a background image from a base64 data URL
   */
  async setImageFromBase64(
    base64: string,
    url: string | null = null,
    type: "default" | "custom" | null = null,
  ): Promise<void> {
    console.log("[ImageStorage] setImageFromBase64 called", {
      url,
      type,
      base64Length: base64?.length,
    });
    await this.init();

    // Convert base64 to Blob
    const response = await fetch(base64);
    const blob = await response.blob();
    console.log("[ImageStorage] Blob created", {
      size: blob.size,
      type: blob.type,
    });

    const imageData: ImageData = {
      key: BACKGROUND_KEY,
      blob,
      url,
      type,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(imageData);

      request.onsuccess = () => {
        console.log("[ImageStorage] Image stored successfully in IndexedDB");
        resolve();
      };
      request.onerror = () => {
        console.error("[ImageStorage] Failed to store image");
        reject(new Error("Failed to store image"));
      };
    });
  }

  /**
   * Store a background image from a File object
   */
  async setImageFromFile(
    file: File,
    url: string | null = null,
    type: "default" | "custom" | null = null,
  ): Promise<void> {
    await this.init();

    const imageData: ImageData = {
      key: BACKGROUND_KEY,
      blob: file,
      url,
      type,
      timestamp: Date.now(),
    };

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(imageData);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to store image"));
    });
  }

  /**
   * Get the current background image as a base64 data URL
   */
  async getImageAsBase64(): Promise<string | null> {
    console.log("[ImageStorage] getImageAsBase64 called");
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(BACKGROUND_KEY);

      request.onsuccess = () => {
        const result = request.result as ImageData | undefined;
        console.log("[ImageStorage] Retrieved from IndexedDB", {
          hasResult: !!result,
          hasBlob: !!result?.blob,
          url: result?.url,
          type: result?.type,
        });
        if (!result || !result.blob) {
          resolve(null);
          return;
        }

        // Convert Blob to base64
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          console.log("[ImageStorage] Converted to base64", {
            length: base64?.length,
          });
          resolve(base64);
        };
        reader.onerror = () => {
          console.error("[ImageStorage] Failed to read blob");
          reject(new Error("Failed to read blob"));
        };
        reader.readAsDataURL(result.blob);
      };

      request.onerror = () => {
        console.error("[ImageStorage] Failed to retrieve image from IndexedDB");
        reject(new Error("Failed to retrieve image"));
      };
    });
  }

  /**
   * Get the current background image metadata
   */
  async getImageMetadata(): Promise<{
    url: string | null;
    type: "default" | "custom" | null;
  } | null> {
    console.log("[ImageStorage] getImageMetadata called");
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(BACKGROUND_KEY);

      request.onsuccess = () => {
        const result = request.result as ImageData | undefined;
        console.log("[ImageStorage] Metadata retrieved", {
          hasResult: !!result,
          url: result?.url,
          type: result?.type,
        });
        if (!result) {
          resolve(null);
          return;
        }

        resolve({
          url: result.url,
          type: result.type,
        });
      };

      request.onerror = () => {
        console.error("[ImageStorage] Failed to retrieve metadata");
        reject(new Error("Failed to retrieve metadata"));
      };
    });
  }

  /**
   * Check if a background image exists
   */
  async hasImage(): Promise<boolean> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(BACKGROUND_KEY);

      request.onsuccess = () => {
        resolve(!!request.result);
      };

      request.onerror = () => reject(new Error("Failed to check image"));
    });
  }

  /**
   * Delete the current background image
   */
  async deleteImage(): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const transaction = this.db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(BACKGROUND_KEY);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error("Failed to delete image"));
    });
  }

  /**
   * Migrate image from localStorage base64 to IndexedDB
   */
  async migrateFromLocalStorage(base64: string | null): Promise<void> {
    if (!base64) return;

    try {
      await this.setImageFromBase64(base64, null, null);
    } catch (error) {
      console.error("Failed to migrate image from localStorage:", error);
    }
  }

  /**
   * Get storage size estimate
   */
  async getStorageEstimate(): Promise<{
    usage: number;
    quota: number;
  } | null> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        usage: estimate.usage || 0,
        quota: estimate.quota || 0,
      };
    }
    return null;
  }
}

// Export singleton instance
export const imageStorage = new ImageStorage();
