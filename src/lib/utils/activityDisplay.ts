export type ActivityDisplayLike = {
  isAllDay: boolean;
  startTime: string;
  endTime: string;
  summary: string;
};

export function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function isAllDayActivity(activity: {
  isAllDay: boolean;
  startTime: string;
  endTime: string;
}): boolean {
  if (activity.isAllDay) return true;
  if (activity.startTime === activity.endTime) return true;
  if (activity.startTime === "00:00" && activity.endTime === "23:59") {
    return true;
  }
  return false;
}

export function compareActivitiesByDisplayOrder(
  a: ActivityDisplayLike,
  b: ActivityDisplayLike,
): number {
  const aIsAllDay = isAllDayActivity(a);
  const bIsAllDay = isAllDayActivity(b);

  if (aIsAllDay && !bIsAllDay) return -1;
  if (!aIsAllDay && bIsAllDay) return 1;

  if (aIsAllDay && bIsAllDay) {
    return a.summary.localeCompare(b.summary);
  }

  const startDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
  if (startDiff !== 0) return startDiff;

  const endDiff = timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  if (endDiff !== 0) return endDiff;

  return a.summary.localeCompare(b.summary);
}

export function sortActivitiesByDisplayOrder<T extends ActivityDisplayLike>(
  activities: T[],
): T[] {
  return [...activities].sort(compareActivitiesByDisplayOrder);
}
