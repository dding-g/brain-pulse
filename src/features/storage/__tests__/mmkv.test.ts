// The jest-expo/node preset resolves .web.ts, which uses localStorage.
// We mock localStorage to test the web storage implementation.

const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: jest.fn((key: string) => mockStorage[key] ?? null),
  setItem: jest.fn((key: string, value: string) => { mockStorage[key] = value; }),
  removeItem: jest.fn((key: string) => { delete mockStorage[key]; }),
  clear: jest.fn(() => { for (const k of Object.keys(mockStorage)) delete mockStorage[k]; }),
  get length() { return Object.keys(mockStorage).length; },
  key: jest.fn((i: number) => Object.keys(mockStorage)[i] ?? null),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock, writable: true });

import {
  setCurrentSessionId, getCurrentSessionId, clearCurrentSession,
  setCurrentMode, getCurrentMode,
  setConditionReport, getConditionReport,
  updateStreak, getStreakCount,
  getDifficultyProfile, setDifficultyProfile,
  isOnboardingComplete, setOnboardingComplete,
  getPreferredLanguage, setPreferredLanguage,
  clearAllData,
} from '../mmkv';

function resetStore() {
  for (const k of Object.keys(mockStorage)) delete mockStorage[k];
  jest.clearAllMocks();
}

describe('Session functions', () => {
  beforeEach(() => { resetStore(); });
  it('set/get currentSessionId', () => {
    expect(getCurrentSessionId()).toBeUndefined();
    setCurrentSessionId('sess-123');
    expect(getCurrentSessionId()).toBe('sess-123');
  });
  it('set/get currentMode', () => {
    expect(getCurrentMode()).toBeUndefined();
    setCurrentMode('activation');
    expect(getCurrentMode()).toBe('activation');
  });
  it('set/get conditionReport', () => {
    expect(getConditionReport()).toBeUndefined();
    const report = { sleepQuality: 3 as const, energyLevel: 4 as const, stressLevel: 2 as const };
    setConditionReport(report);
    expect(getConditionReport()).toEqual(report);
  });
  it('clearCurrentSession removes session data', () => {
    setCurrentSessionId('sess-1');
    setCurrentMode('rest');
    setConditionReport({ sleepQuality: 3 as const, energyLevel: 3 as const, stressLevel: 3 as const });
    clearCurrentSession();
    expect(getCurrentSessionId()).toBeUndefined();
    expect(getCurrentMode()).toBeUndefined();
    expect(getConditionReport()).toBeUndefined();
  });
});

describe('updateStreak', () => {
  beforeEach(() => { resetStore(); });
  it('first play sets streak to 1', () => {
    expect(updateStreak()).toBe(1);
  });
  it('consecutive day increments streak', () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    mockStorage['brainpulse:stats.streakCount'] = '3';
    mockStorage['brainpulse:stats.lastSessionDate'] = yesterday;
    expect(updateStreak()).toBe(4);
  });
  it('skip day resets streak to 1', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000).toISOString().slice(0, 10);
    mockStorage['brainpulse:stats.streakCount'] = '5';
    mockStorage['brainpulse:stats.lastSessionDate'] = twoDaysAgo;
    expect(updateStreak()).toBe(1);
  });
  it('same day no change', () => {
    const today = new Date().toISOString().slice(0, 10);
    mockStorage['brainpulse:stats.streakCount'] = '3';
    mockStorage['brainpulse:stats.lastSessionDate'] = today;
    expect(updateStreak()).toBe(3);
  });
});

describe('getDifficultyProfile', () => {
  beforeEach(() => { resetStore(); });
  it('returns default value when nothing stored', () => {
    const profile = getDifficultyProfile();
    expect(profile.gameLevels).toEqual({});
    expect(profile.updatedAt).toBeDefined();
  });
  it('returns stored value', () => {
    const stored = { gameLevels: { 'speed-match': 4 }, updatedAt: '2024-01-01T00:00:00Z' };
    setDifficultyProfile(stored as any);
    expect(getDifficultyProfile()).toEqual(stored);
  });
});

describe('Onboarding', () => {
  beforeEach(() => { resetStore(); });
  it('default is false', () => { expect(isOnboardingComplete()).toBe(false); });
  it('setOnboardingComplete makes it true', () => {
    setOnboardingComplete();
    expect(isOnboardingComplete()).toBe(true);
  });
});

describe('Language preference', () => {
  beforeEach(() => { resetStore(); });
  it('default is ko', () => { expect(getPreferredLanguage()).toBe('ko'); });
  it('set/get language', () => {
    setPreferredLanguage('en');
    expect(getPreferredLanguage()).toBe('en');
  });
});

describe('clearAllData', () => {
  beforeEach(() => { resetStore(); });
  it('clears everything', () => {
    setCurrentSessionId('s');
    setOnboardingComplete();
    setPreferredLanguage('en');
    clearAllData();
    expect(getCurrentSessionId()).toBeUndefined();
    expect(isOnboardingComplete()).toBe(false);
    expect(getPreferredLanguage()).toBe('ko');
  });
});