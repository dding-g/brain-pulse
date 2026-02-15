import { storage } from '@/features/storage/mmkv';
import type { GameMode } from '@/games/types';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? '';

function isApiConfigured(): boolean {
  return Boolean(API_BASE_URL) && !API_BASE_URL.includes('YOURNAME');
}

// ── Types matching backend Zod schemas ─────────────────────────────

export interface ScoreSubmission {
  device_id: string;
  game_id: string;
  mode: 'rest' | 'activation' | 'development';
  score: number;
  level: number;
  accuracy: number;
  avg_response_time?: number;
}

export interface LeaderboardQuery {
  period?: 'daily' | 'weekly' | 'all';
  limit?: number;
  game_id?: string;
}

export interface LeaderboardEntry {
  device_id: string;
  game_id: string;
  score: number;
  level: number;
  accuracy: number;
  created_at: string;
}

export interface HealthData {
  status: string;
  timestamp: string;
  version: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// ── Device ID ──────────────────────────────────────────────────────

const DEVICE_ID_KEY = 'app.deviceId';

/** Get or create a persistent device ID */
export function getDeviceId(): string {
  let deviceId = storage.getString(DEVICE_ID_KEY);
  if (!deviceId) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    deviceId = `bp_${timestamp}_${random}`;
    storage.set(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ── Base request ───────────────────────────────────────────────────

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Request timeout in ms (default: 10000) */
  timeoutMs?: number;
}

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<ApiResponse<T>> {
  if (!isApiConfigured()) {
    return { success: false, error: 'API not configured' };
  }

  const { method = 'GET', body, headers = {}, timeoutMs = 10_000 } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const json = (await response.json()) as ApiResponse<T>;

    if (!response.ok) {
      console.warn(`API error [${response.status}]: ${json.error ?? response.statusText}`);
      return { success: false, error: json.error ?? `HTTP ${response.status}` };
    }

    return json;
  } catch (error) {
    clearTimeout(timeoutId);
    const message = error instanceof Error ? error.message : 'Unknown network error';
    console.warn(`API request failed (${method} ${path}):`, message);
    return { success: false, error: message };
  }
}

// ── API functions ──────────────────────────────────────────────────

/** Submit a score to the backend (fire-and-forget safe) */
export async function submitScore(data: ScoreSubmission): Promise<ApiResponse<{ id: string }>> {
  return apiRequest<{ id: string }>('/api/v1/scores', {
    method: 'POST',
    body: data,
  });
}

/** Get leaderboard entries */
export async function getLeaderboard(
  query: LeaderboardQuery = {},
): Promise<ApiResponse<LeaderboardEntry[]>> {
  const params = new URLSearchParams();
  if (query.period) params.set('period', query.period);
  if (query.limit) params.set('limit', String(query.limit));
  if (query.game_id) params.set('game_id', query.game_id);

  const qs = params.toString();
  const path = `/api/v1/leaderboard${qs ? `?${qs}` : ''}`;

  return apiRequest<LeaderboardEntry[]>(path);
}

/** Health check */
export async function healthCheck(): Promise<ApiResponse<HealthData>> {
  return apiRequest<HealthData>('/api/v1/health');
}

/** Helper: submit all game results from a completed session */
export function submitSessionScores(
  gameResults: Array<{
    gameId: string;
    score: number;
    difficulty: number;
    accuracy: number;
    reactionTimeMs?: number;
  }>,
  mode: GameMode,
): void {
  const deviceId = getDeviceId();

  for (const result of gameResults) {
    const submission: ScoreSubmission = {
      device_id: deviceId,
      game_id: result.gameId,
      mode,
      score: Math.round(result.score),
      level: result.difficulty,
      accuracy: Math.round(result.accuracy * 1000) / 1000,
      avg_response_time: result.reactionTimeMs,
    };

    // Fire-and-forget: don't await, just log errors
    submitScore(submission).then((res) => {
      if (!res.success) {
        console.warn(`Failed to submit score for ${result.gameId}:`, res.error);
      }
    });
  }
}
