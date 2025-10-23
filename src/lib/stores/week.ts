import { writable } from 'svelte/store';
import { getCurrentWeek } from '../utils/date.js';

const { week, year } = getCurrentWeek();

export const currentWeek = writable(week);
export const currentYear = writable(year);
