// iCal-based calendar item structure as the foundation
export interface CalendarItem {
  // Unique identifier
  id: string;

  // Core event information
  summary: string; // Event title
  description?: string; // Event description

  // Date/Time information (stored as iCal format for compatibility)
  dtstart: string; // ISO 8601 or iCal format: YYYYMMDD or YYYYMMDDTHHMMSS
  dtend: string; // ISO 8601 or iCal format: YYYYMMDD or YYYYMMDDTHHMMSS

  // Computed week/day properties for quick access
  startDate: string; // YYYYMMDD
  endDate: string; // YYYYMMDD
  startTime: string; // HH:mm (extracted from dtstart)
  endTime: string; // HH:mm (extracted from dtend)
  day: number; // 0 = Monday, 6 = Sunday (computed from startDate)
  week: number; // ISO week number
  year: number; // Year
  isAllDay: boolean; // Whether this is an all-day event

  // Metadata
  source: "manual" | "ical" | "template"; // Where this item came from
  sourceId?: string; // ID of the source (subscription ID or template ID)
  uid?: string; // Original iCal UID (for tracking sync)

  // Local modifications and display options
  color?: string; // Display color override
  localOverrides?: Partial<CalendarItem>; // Local modifications to synced events

  // Timestamps
  createdAt: number; // When this was created locally (ms)
  lastModified: number; // When this was last modified locally (ms)
}

// Alias for backward compatibility and semantic clarity
export type Activity = CalendarItem;

// Template for creating recurring activities
export interface ActivityTemplate {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  description?: string;
  createdAt: number;
}

// iCal subscription management
export interface ICalSubscription {
  id: string;
  url: string;
  name: string;
  enabled: boolean;
  lastFetched?: number;
  color?: string;
  syncInterval?: number; // Auto-refresh interval in minutes
  // Calendar items are now stored directly in the activities store
}

// For parsing and syncing with iCal sources
export interface ICalEvent {
  uid: string;
  summary: string;
  description?: string;
  dtstart: string;
  dtend: string;
  rrule?: string; // Recurrence rule (not yet implemented)
  organizer?: string;
  attendees?: string[];
}

export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const WEEKDAYS_DE = [
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
  "Sonntag",
] as const;
