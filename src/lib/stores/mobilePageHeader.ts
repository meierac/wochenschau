import { writable } from "svelte/store";

export interface MobileHeaderAction {
    label: string;
    onClick: () => void;
    variant?: "default" | "ghost";
}

export const mobileHeaderActions = writable<MobileHeaderAction[]>([]);
