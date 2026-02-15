import type { DailySummary, SessionData } from '@/games/types';

const SESSIONS_KEY = 'bp_sessions';
const SUMMARIES_KEY = 'bp_daily_summaries';

let initialized = false;
const sessions = new Map<string, SessionData>();
const dailySummaries = new Map<string, DailySummary>();

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJsonArray<T>(key: string): T[] {
  if (!canUseLocalStorage()) return [];
  const raw = window.localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function persistState(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(SESSIONS_KEY, JSON.stringify(Array.from(sessions.values())));
  window.localStorage.setItem(SUMMARIES_KEY, JSON.stringify(Array.from(dailySummaries.values())));
}

function ensureInitialized(): void {
  if (!initialized) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
}

export async function initDatabase(): Promise<void> {
  sessions.clear();
  dailySummaries.clear();

  const storedSessions = readJsonArray<SessionData>(SESSIONS_KEY);
  for (const session of storedSessions) {
    sessions.set(session.id, session);
  }

  const storedSummaries = readJsonArray<DailySummary>(SUMMARIES_KEY);
  for (const summary of storedSummaries) {
    dailySummaries.set(summary.date, summary);
  }

  initialized = true;
}

export async function insertSession(session: SessionData): Promise<void> {
  ensureInitialized();
  if (sessions.has(session.id)) {
    throw new Error(`Session with id '${session.id}' already exists.`);
  }

  sessions.set(session.id, session);
  persistState();
}

export async function getRecentSessions(limit: number = 10): Promise<SessionData[]> {
  ensureInitialized();
  return Array.from(sessions.values())
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
    .slice(0, limit);
}

export async function upsertDailySummary(summary: DailySummary): Promise<void> {
  ensureInitialized();
  dailySummaries.set(summary.date, summary);
  persistState();
}

export async function getDailySummaries(days: number = 30): Promise<DailySummary[]> {
  ensureInitialized();
  return Array.from(dailySummaries.values())
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);
}

export async function getSessionsForMonth(year: number, month: number): Promise<SessionData[]> {
  ensureInitialized();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  return Array.from(sessions.values())
    .filter((session) => session.startedAt >= startDate && session.startedAt < endDate)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

export async function clearAllSessions(): Promise<void> {
  ensureInitialized();
  sessions.clear();
  dailySummaries.clear();
  persistState();
}

export async function getSessionCountForDate(date: string): Promise<number> {
  ensureInitialized();
  let count = 0;

  for (const session of sessions.values()) {
    if (session.startedAt.slice(0, 10) === date) {
      count += 1;
    }
  }

  return count;
}
