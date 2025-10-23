export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export function getMondayOfWeek(week: number, year: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4)
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
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
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function getCurrentWeek(): { week: number; year: number } {
  const today = new Date();
  return { week: getWeekNumber(today), year: today.getFullYear() };
}

export function getNextWeek(week: number, year: number): { week: number; year: number } {
  if (week === 52) {
    return { week: 1, year: year + 1 };
  }
  return { week: week + 1, year };
}

export function getPreviousWeek(week: number, year: number): { week: number; year: number } {
  if (week === 1) {
    return { week: 52, year: year - 1 };
  }
  return { week: week - 1, year };
}

export function formatDateRange(week: number, year: number): string {
  const days = getDaysOfWeek(week, year);
  const start = days[0];
  const end = days[6];
  
  const startStr = start.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('de-DE', { month: 'short', day: 'numeric' });
  
  return `${startStr} - ${endStr}`;
}
