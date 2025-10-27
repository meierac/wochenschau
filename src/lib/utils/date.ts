export function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getMondayOfWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  return ISOweekStart;
}

export function getDaysOfWeek(week: number, year: number): Date[] {
  const monday = getMondayOfWeek(week, year);
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    days.push(date);
  }
  return days;
}

export function formatTime(time: string): string {
  return time;
}

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Determine the user's timezone. Falls back to Europe/Berlin (which observes
 * Central European Time and DST) if the runtime cannot provide a valid one.
 */
export function getUserTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && tz.includes("/")) return tz;
  } catch (_e) {
    // ignore and fallback
  }
  return "Europe/Berlin";
}

/**
 * Create a Date object representing the same absolute instant but expressed
 * in the provided IANA timezone's calendar fields. This lets us derive week/year
 * based on the intended timezone (including DST impact on date boundaries).
 */
export function getDateInTimeZone(base: Date, timeZone: string): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(base);

  const lookup: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") {
      lookup[p.type] = p.value;
    }
  }

  const year = Number(lookup.year);
  const month = Number(lookup.month) - 1; // JS Date month is 0-based
  const day = Number(lookup.day);
  const hour = Number(lookup.hour);
  const minute = Number(lookup.minute);
  const second = Number(lookup.second);

  return new Date(year, month, day, hour, minute, second);
}

/**
 * Get "today" localized to the user's timezone or Berlin if unavailable.
 * If the environment already uses the user's timezone, we can return new Date()
 * directly; otherwise we synthesize a Date based on Berlin calendar fields.
 */
export function getCalendarToday(): Date {
  const userTz = getUserTimeZone();
  // If runtime timezone matches detected user timezone, native Date is fine.
  try {
    const runtimeTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (runtimeTz === userTz) {
      return new Date();
    }
  } catch (_e) {
    // ignore and use fallback path
  }
  return getDateInTimeZone(new Date(), userTz);
}

export function getCurrentWeek(): { week: number; year: number } {
  const today = getCalendarToday();
  return { week: getWeekNumber(today), year: today.getFullYear() };
}

export function getNextWeek(
  week: number,
  year: number,
): { week: number; year: number } {
  if (week === 52) {
    return { week: 1, year: year + 1 };
  }
  return { week: week + 1, year };
}

export function getPreviousWeek(
  week: number,
  year: number,
): { week: number; year: number } {
  if (week === 1) {
    return { week: 52, year: year - 1 };
  }
  return { week: week - 1, year };
}

export function formatDateRange(week: number, year: number): string {
  const days = getDaysOfWeek(week, year);
  const start = days[0];
  const end = days[6];

  const startStr = start.toLocaleDateString("de-DE", {
    month: "short",
    day: "numeric",
  });
  const endStr = end.toLocaleDateString("de-DE", {
    month: "short",
    day: "numeric",
  });

  return `${startStr} - ${endStr}`;
}
