import { writable } from "svelte/store";
import { BIBLE_VERSES } from "../data/bibleVerses";

export interface BibleVerseState {
  enabled: boolean;
  currentVerse: (typeof BIBLE_VERSES)[0];
  usedIndices: number[];
  selectedThemes: ("faith" | "hope" | "love")[];
}

function createBibleVerseStore() {
  const stored = localStorage.getItem("bibleVerseState");

  const getRandomVerse = (
    usedIndices: number[] = [],
    selectedThemes: ("faith" | "hope" | "love")[] = ["faith", "hope", "love"],
  ) => {
    const availableIndices = BIBLE_VERSES.map((_, i) => i).filter(
      (i) =>
        !usedIndices.includes(i) &&
        selectedThemes.includes(BIBLE_VERSES[i].theme),
    );

    if (availableIndices.length === 0) {
      // Reset if all verses have been used
      const filteredVerses = BIBLE_VERSES.filter((v) =>
        selectedThemes.includes(v.theme),
      );
      return {
        verse:
          filteredVerses[Math.floor(Math.random() * filteredVerses.length)],
        usedIndices: [],
      };
    }

    const randomIndex =
      availableIndices[Math.floor(Math.random() * availableIndices.length)];
    return {
      verse: BIBLE_VERSES[randomIndex],
      usedIndices: [...usedIndices, randomIndex],
    };
  };

  const initialState: BibleVerseState = stored
    ? JSON.parse(stored)
    : {
        enabled: true,
        currentVerse: BIBLE_VERSES[0],
        usedIndices: [0],
        selectedThemes: ["faith", "hope", "love"],
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
        const { verse, usedIndices } = getRandomVerse(
          state.usedIndices,
          state.selectedThemes,
        );
        const updated = { ...state, currentVerse: verse, usedIndices };
        localStorage.setItem("bibleVerseState", JSON.stringify(updated));
        return updated;
      });
    },
    setSelectedThemes: (themes: ("faith" | "hope" | "love")[]) => {
      update((state) => {
        const updated = { ...state, selectedThemes: themes };
        localStorage.setItem("bibleVerseState", JSON.stringify(updated));
        return updated;
      });
    },
    reset: () => {
      const { verse, usedIndices } = getRandomVerse(
        [],
        ["faith", "hope", "love"],
      );
      const initialState: BibleVerseState = {
        enabled: true,
        currentVerse: verse,
        usedIndices,
        selectedThemes: ["faith", "hope", "love"],
      };
      localStorage.setItem("bibleVerseState", JSON.stringify(initialState));
      set(initialState);
    },
  };
}

export const bibleVerse = createBibleVerseStore();
