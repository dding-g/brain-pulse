import type { ConditionReport, DifficultyProfile, GameMode } from '@/games/types'

// Web fallback: localStorage-based storage since react-native-mmkv is native-only
const PREFIX = 'brainpulse:'

const webStorage = {
  getString(key: string): string | undefined {
    return localStorage.getItem(PREFIX + key) ?? undefined
  },
  set(key: string, value: string | number | boolean): void {
    localStorage.setItem(PREFIX + key, String(value))
  },
  getNumber(key: string): number | undefined {
    const v = localStorage.getItem(PREFIX + key)
    return v !== null ? Number(v) : undefined
  },
  getBoolean(key: string): boolean | undefined {
    const v = localStorage.getItem(PREFIX + key)
    if (v === null) return undefined
    return v === 'true'
  },
  delete(key: string): void {
    localStorage.removeItem(PREFIX + key)
  },
  clearAll(): void {
    const keysToRemove: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k?.startsWith(PREFIX)) keysToRemove.push(k)
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k))
  },
}

export const storage = webStorage

// ── Typed storage keys ──────────────────────────────────────────────

const KEYS = {
  CURRENT_SESSION_ID: 'session.currentId',
  CURRENT_MODE: 'session.currentMode',
  CONDITION_REPORT: 'session.conditionReport',
  DIFFICULTY_PROFILE: 'adaptive.difficultyProfile',
  STREAK_COUNT: 'stats.streakCount',
  LAST_SESSION_DATE: 'stats.lastSessionDate',
  TOTAL_SESSIONS: 'stats.totalSessions',
  ONBOARDING_COMPLETE: 'app.onboardingComplete',
  PREFERRED_LANGUAGE: 'app.preferredLanguage',
} as const

// ── Session ─────────────────────────────────────────────────────────

export function setCurrentSessionId(id: string): void {
  webStorage.set(KEYS.CURRENT_SESSION_ID, id)
}

export function getCurrentSessionId(): string | undefined {
  return webStorage.getString(KEYS.CURRENT_SESSION_ID)
}

export function clearCurrentSession(): void {
  webStorage.delete(KEYS.CURRENT_SESSION_ID)
  webStorage.delete(KEYS.CURRENT_MODE)
  webStorage.delete(KEYS.CONDITION_REPORT)
}

export function setCurrentMode(mode: GameMode): void {
  webStorage.set(KEYS.CURRENT_MODE, mode)
}

export function getCurrentMode(): GameMode | undefined {
  return webStorage.getString(KEYS.CURRENT_MODE) as GameMode | undefined
}

export function setConditionReport(report: ConditionReport): void {
  webStorage.set(KEYS.CONDITION_REPORT, JSON.stringify(report))
}

export function getConditionReport(): ConditionReport | undefined {
  const raw = webStorage.getString(KEYS.CONDITION_REPORT)
  return raw ? (JSON.parse(raw) as ConditionReport) : undefined
}

// ── Adaptive difficulty ─────────────────────────────────────────────

export function getDifficultyProfile(): DifficultyProfile {
  const raw = webStorage.getString(KEYS.DIFFICULTY_PROFILE)
  if (raw) return JSON.parse(raw) as DifficultyProfile
  return { gameLevels: {}, updatedAt: new Date().toISOString() }
}

export function setDifficultyProfile(profile: DifficultyProfile): void {
  webStorage.set(KEYS.DIFFICULTY_PROFILE, JSON.stringify(profile))
}

// ── Streak ──────────────────────────────────────────────────────────

export function getStreakCount(): number {
  return webStorage.getNumber(KEYS.STREAK_COUNT) ?? 0
}

export function updateStreak(): number {
  const today = new Date().toISOString().slice(0, 10)
  const lastDate = webStorage.getString(KEYS.LAST_SESSION_DATE)

  let streak = getStreakCount()

  if (lastDate === today) {
    return streak
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
  if (lastDate === yesterday) {
    streak += 1
  } else {
    streak = 1
  }

  webStorage.set(KEYS.STREAK_COUNT, streak)
  webStorage.set(KEYS.LAST_SESSION_DATE, today)
  return streak
}

// ── Stats ───────────────────────────────────────────────────────────

export function getTotalSessions(): number {
  return webStorage.getNumber(KEYS.TOTAL_SESSIONS) ?? 0
}

export function incrementTotalSessions(): void {
  webStorage.set(KEYS.TOTAL_SESSIONS, getTotalSessions() + 1)
}

// ── App preferences ─────────────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  return webStorage.getBoolean(KEYS.ONBOARDING_COMPLETE) ?? false
}

export function setOnboardingComplete(): void {
  webStorage.set(KEYS.ONBOARDING_COMPLETE, true)
}

export function getPreferredLanguage(): 'ko' | 'en' {
  return (webStorage.getString(KEYS.PREFERRED_LANGUAGE) as 'ko' | 'en') ?? 'ko'
}

export function setPreferredLanguage(lang: 'ko' | 'en'): void {
  webStorage.set(KEYS.PREFERRED_LANGUAGE, lang)
}

// ── Data management ─────────────────────────────────────────────────

export function clearAllData(): void {
  webStorage.clearAll()
}
