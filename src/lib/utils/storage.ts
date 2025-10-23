import type {
  CalendarItem,
  ActivityTemplate,
  ICalSubscription,
} from "../types/index.js";

const STORAGE_KEYS = {
  ACTIVITIES: "wochenschau_activities",
  TEMPLATES: "wochenschau_templates",
  ICAL_SUBSCRIPTIONS: "wochenschau_ical_subscriptions",
  ICAL_EVENTS: "wochenschau_ical_events",
} as const;

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Activities (Calendar Items)
export function getActivities(): CalendarItem[] {
  if (typeof window === "undefined") return [];
  const data = safeJsonParse<CalendarItem[]>(
    localStorage.getItem(STORAGE_KEYS.ACTIVITIES),
  );
  return data || [];
}

export function saveActivity(activity: CalendarItem): void {
  if (typeof window === "undefined") return;
  const activities = getActivities();
  const index = activities.findIndex((a) => a.id === activity.id);
  if (index >= 0) {
    activities[index] = activity;
  } else {
    activities.push(activity);
  }
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

export function deleteActivity(id: string): void {
  if (typeof window === "undefined") return;
  const activities = getActivities().filter((a) => a.id !== id);
  localStorage.setItem(STORAGE_KEYS.ACTIVITIES, JSON.stringify(activities));
}

export function clearAllActivities(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.ACTIVITIES);
}

// Templates
export function getTemplates(): ActivityTemplate[] {
  if (typeof window === "undefined") return [];
  const data = safeJsonParse<ActivityTemplate[]>(
    localStorage.getItem(STORAGE_KEYS.TEMPLATES),
  );
  return data || [];
}

export function saveTemplate(template: ActivityTemplate): void {
  if (typeof window === "undefined") return;
  const templates = getTemplates();
  const index = templates.findIndex((t) => t.id === template.id);
  if (index >= 0) {
    templates[index] = template;
  } else {
    templates.push(template);
  }
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

export function deleteTemplate(id: string): void {
  if (typeof window === "undefined") return;
  const templates = getTemplates().filter((t) => t.id !== id);
  localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
}

// iCal Subscriptions
export function getSubscriptions(): ICalSubscription[] {
  if (typeof window === "undefined") return [];
  const data = safeJsonParse<ICalSubscription[]>(
    localStorage.getItem(STORAGE_KEYS.ICAL_SUBSCRIPTIONS),
  );
  return data || [];
}

export function saveSubscription(subscription: ICalSubscription): void {
  if (typeof window === "undefined") return;
  const subscriptions = getSubscriptions();
  const index = subscriptions.findIndex((s) => s.id === subscription.id);
  if (index >= 0) {
    subscriptions[index] = subscription;
  } else {
    subscriptions.push(subscription);
  }
  localStorage.setItem(
    STORAGE_KEYS.ICAL_SUBSCRIPTIONS,
    JSON.stringify(subscriptions),
  );
}

export function deleteSubscription(id: string): void {
  if (typeof window === "undefined") return;
  const subscriptions = getSubscriptions().filter((s) => s.id !== id);
  localStorage.setItem(
    STORAGE_KEYS.ICAL_SUBSCRIPTIONS,
    JSON.stringify(subscriptions),
  );
}
