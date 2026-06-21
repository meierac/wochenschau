const LOCAL_DATA_UPDATED_AT_KEY = "wochenschau_data_updated_at";

type DataChangeListener = () => void;

const listeners = new Set<DataChangeListener>();
let notificationsSuppressed = false;

export function getLocalDataUpdatedAt(): number {
  if (typeof window === "undefined") return 0;

  const raw = localStorage.getItem(LOCAL_DATA_UPDATED_AT_KEY);
  if (!raw) return 0;

  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function setLocalDataUpdatedAt(timestamp: number): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_DATA_UPDATED_AT_KEY, String(timestamp));
}

export function notifyDataChanged(): void {
  if (typeof window === "undefined") return;
  if (notificationsSuppressed) return;

  setLocalDataUpdatedAt(Date.now());

  for (const listener of listeners) {
    listener();
  }
}

export function onDataChanged(listener: DataChangeListener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export async function withDataChangeNotificationsSuppressed<T>(
  fn: () => Promise<T> | T,
): Promise<T> {
  notificationsSuppressed = true;
  try {
    return await fn();
  } finally {
    notificationsSuppressed = false;
  }
}
