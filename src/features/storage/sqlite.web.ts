import type { GameResult, SessionData, DailySummary, GameMode, ConditionReport } from '@/games/types'

// Web fallback: in-memory storage since expo-sqlite is native-only
let sessions: SessionData[] = []
let dailySummaries: DailySummary[] = []

export async function initDatabase(): Promise<void> {
  // No-op on web
}

export async function insertSession(session: SessionData): Promise<void> {
  sessions.unshift(session)
}

export async function getRecentSessions(limit: number = 10): Promise<SessionData[]> {
  return sessions.slice(0, limit)
}

export async function upsertDailySummary(summary: DailySummary): Promise<void> {
  const idx = dailySummaries.findIndex((s) => s.date === summary.date)
  if (idx >= 0) {
    dailySummaries[idx] = summary
  } else {
    dailySummaries.unshift(summary)
  }
}

export async function getDailySummaries(days: number = 30): Promise<DailySummary[]> {
  return dailySummaries.slice(0, days)
}

export async function getSessionsForMonth(
  year: number,
  month: number,
): Promise<SessionData[]> {
  const prefix = `${year}-${String(month).padStart(2, '0')}`
  return sessions.filter((s) => s.startedAt.startsWith(prefix))
}

export async function clearAllSessions(): Promise<void> {
  sessions = []
  dailySummaries = []
}

export async function getSessionCountForDate(date: string): Promise<number> {
  return sessions.filter((s) => s.startedAt.startsWith(date)).length
}
