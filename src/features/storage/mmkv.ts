import { MMKV } from 'react-native-mmkv';
import type { ConditionReport, DifficultyProfile, GameMode } from '@/games/types';

export const storage = new MMKV({ id: 'brainpulse' });

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
} as const;

// ── Session ─────────────────────────────────────────────────────────

export function setCurrentSessionId(id: string): void {
  storage.set(KEYS.CURRENT_SESSION_ID, id);
}

export function getCurrentSessionId(): string | undefined {
  return storage.getString(KEYS.CURRENT_SESSION_ID);
}

export function clearCurrentSession(): void {
  storage.delete(KEYS.CURRENT_SESSION_ID);
  storage.delete(KEYS.CURRENT_MODE);
  storage.delete(KEYS.CONDITION_REPORT);
}

export function setCurrentMode(mode: GameMode): void {
  storage.set(KEYS.CURRENT_MODE, mode);
}

export function getCurrentMode(): GameMode | undefined {
  return storage.getString(KEYS.CURRENT_MODE) as GameMode | undefined;
}

export function setConditionReport(report: ConditionReport): void {
  storage.set(KEYS.CONDITION_REPORT, JSON.stringify(report));
}

export function getConditionReport(): ConditionReport | undefined {
  const raw = storage.getString(KEYS.CONDITION_REPORT);
  return raw ? (JSON.parse(raw) as ConditionReport) : undefined;
}

// ── Adaptive difficulty ─────────────────────────────────────────────

export function getDifficultyProfile(): DifficultyProfile {
  const raw = storage.getString(KEYS.DIFFICULTY_PROFILE);
  if (raw) return JSON.parse(raw) as DifficultyProfile;
  return { gameLevels: {}, updatedAt: new Date().toISOString() };
}

export function setDifficultyProfile(profile: DifficultyProfile): void {
  storage.set(KEYS.DIFFICULTY_PROFILE, JSON.stringify(profile));
}

// ── Streak ──────────────────────────────────────────────────────────

export function getStreakCount(): number {
  return storage.getNumber(KEYS.STREAK_COUNT) ?? 0;
}

export function updateStreak(): number {
  const today = new Date().toISOString().slice(0, 10);
  const lastDate = storage.getString(KEYS.LAST_SESSION_DATE);

  let streak = getStreakCount();

  if (lastDate === today) {
    // Already played today, no change
    return streak;
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  if (lastDate === yesterday) {
    streak += 1;
  } else {
    streak = 1; // Reset streak
  }

  storage.set(KEYS.STREAK_COUNT, streak);
  storage.set(KEYS.LAST_SESSION_DATE, today);
  return streak;
}

// ── Stats ───────────────────────────────────────────────────────────

export function getTotalSessions(): number {
  return storage.getNumber(KEYS.TOTAL_SESSIONS) ?? 0;
}

export function incrementTotalSessions(): void {
  storage.set(KEYS.TOTAL_SESSIONS, getTotalSessions() + 1);
}

// ── App preferences ─────────────────────────────────────────────────

export function isOnboardingComplete(): boolean {
  return storage.getBoolean(KEYS.ONBOARDING_COMPLETE) ?? false;
}

export function setOnboardingComplete(): void {
  storage.set(KEYS.ONBOARDING_COMPLETE, true);
}

export function getPreferredLanguage(): 'ko' | 'en' {
  return (storage.getString(KEYS.PREFERRED_LANGUAGE) as 'ko' | 'en') ?? 'ko';
}

export function setPreferredLanguage(lang: 'ko' | 'en'): void {
  storage.set(KEYS.PREFERRED_LANGUAGE, lang);
}

// ── Data management ─────────────────────────────────────────────────

/** Clear all MMKV stored data */
export function clearAllData(): void {
  storage.clearAll();
}
