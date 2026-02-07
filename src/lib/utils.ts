/** Format milliseconds to a human-readable duration */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

/** Format a date string (YYYY-MM-DD) to a display format */
export function formatDate(dateStr: string, lang: 'ko' | 'en' = 'ko'): string {
  const date = new Date(dateStr);
  if (lang === 'ko') {
    return `${date.getMonth() + 1}월 ${date.getDate()}일`;
  }
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Get today's date as YYYY-MM-DD */
export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Delay for a given number of milliseconds */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Clamp a number between min and max */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
