import { writable } from "svelte/store";
import { BIBLE_VERSES } from "../data/bibleVerses";

export interface BibleVerseState {
  enabled: boolean;
  currentVerse: (typeof BIBLE_VERSES)[0];
  usedIndices: number[];
}

function createBibleVerseStore() {
  const stored = localStorage.getItem("bibleVerseState");

  const getRandomVerse = (usedIndices: number[] = []) => {
    const availableIndices = BIBLE_VERSES.map((_, i) => i).filter(
      (i) => !usedIndices.includes(i)
    );

    if (availableIndices.length === 0) {
      // Reset if all verses have been used
      return { verse: BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)], usedIndices: [] };
    }

    const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return {
      verse: BIBLE_VERSES[randomIndex],
      usedIndices: [...usedIndices, randomIndex]
    };
  };

  const initialState: BibleVerseState = stored
    ? JSON.parse(stored)
    : {
        enabled: true,
        currentVerse: BIBLE_VERSES[0],
        usedIndices: [0],
      };

  const { subscribe, set, update } = writable<BibleVerseState>(initialState);

  return {
    subscribe,
    toggleEnabled: (enabled: boolean) => {
      update((state) => {
        const updated = { ...state, enabled };
        localStorage.setItem("bibleVerseState", JSON.stringify(updated));
        return updated;
      });
    },
    refreshVerse: () => {
      update((state) => {
        const { verse, usedIndices } = getRandomVerse(state.usedIndices);
        const updated = { ...state, currentVerse: verse, usedIndices };
        localStorage.setItem("bibleVerseState", JSON.stringify(updated));
        return updated;
      });
    },
    reset: () => {
      const { verse, usedIndices } = getRandomVerse([]);
      const initialState: BibleVerseState = {
        enabled: true,
        currentVerse: verse,
        usedIndices,
      };
      localStorage.setItem("bibleVerseState", JSON.stringify(initialState));
      set(initialState);
    },
  };
}

export const bibleVerse = createBibleVerseStore();
