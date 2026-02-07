import * as SQLite from 'expo-sqlite';
import type { GameResult, SessionData, DailySummary, GameMode, ConditionReport } from '@/games/types';

let db: SQLite.SQLiteDatabase | null = null;

/** Open and initialize the database */
export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('brainpulse.db');

  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      started_at TEXT NOT NULL,
      ended_at TEXT NOT NULL,
      mode TEXT NOT NULL,
      composite_score REAL NOT NULL,
      sleep_quality INTEGER NOT NULL,
      energy_level INTEGER NOT NULL,
      stress_level INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS game_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      game_id TEXT NOT NULL,
      score REAL NOT NULL,
      duration_ms INTEGER NOT NULL,
      accuracy REAL NOT NULL,
      reaction_time_ms REAL,
      difficulty INTEGER NOT NULL,
      correct_count INTEGER NOT NULL,
      total_count INTEGER NOT NULL,
      raw_metrics TEXT,
      FOREIGN KEY (session_id) REFERENCES sessions(id)
    );

    CREATE TABLE IF NOT EXISTS daily_summaries (
      date TEXT PRIMARY KEY,
      avg_score REAL NOT NULL,
      session_count INTEGER NOT NULL,
      best_score REAL NOT NULL,
      streak_count INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions(started_at);
    CREATE INDEX IF NOT EXISTS idx_game_results_session_id ON game_results(session_id);
    CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date);
  `);
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
}

// ── Sessions ────────────────────────────────────────────────────────

export async function insertSession(session: SessionData): Promise<void> {
  const d = getDb();
  await d.runAsync(
    `INSERT INTO sessions (id, started_at, ended_at, mode, composite_score, sleep_quality, energy_level, stress_level)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    session.id,
    session.startedAt,
    session.endedAt,
    session.mode,
    session.compositeScore,
    session.conditionBefore.sleepQuality,
    session.conditionBefore.energyLevel,
    session.conditionBefore.stressLevel,
  );

  for (const result of session.gameResults) {
    await insertGameResult(session.id, result);
  }
}

async function insertGameResult(sessionId: string, result: GameResult): Promise<void> {
  const d = getDb();
  await d.runAsync(
    `INSERT INTO game_results (session_id, game_id, score, duration_ms, accuracy, reaction_time_ms, difficulty, correct_count, total_count, raw_metrics)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    sessionId,
    result.gameId,
    result.score,
    result.durationMs,
    result.accuracy,
    result.reactionTimeMs ?? null,
    result.difficulty,
    result.correctCount,
    result.totalCount,
    result.rawMetrics ? JSON.stringify(result.rawMetrics) : null,
  );
}

export async function getRecentSessions(limit: number = 10): Promise<SessionData[]> {
  const d = getDb();
  const rows = await d.getAllAsync<{
    id: string;
    started_at: string;
    ended_at: string;
    mode: string;
    composite_score: number;
    sleep_quality: number;
    energy_level: number;
    stress_level: number;
  }>('SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?', limit);

  const sessions: SessionData[] = [];
  for (const row of rows) {
    const gameResults = await getGameResultsForSession(row.id);
    sessions.push({
      id: row.id,
      startedAt: row.started_at,
      endedAt: row.ended_at,
      mode: row.mode as GameMode,
      compositeScore: row.composite_score,
      conditionBefore: {
        sleepQuality: row.sleep_quality as ConditionReport['sleepQuality'],
        energyLevel: row.energy_level as ConditionReport['energyLevel'],
        stressLevel: row.stress_level as ConditionReport['stressLevel'],
      },
      gameResults,
    });
  }
  return sessions;
}

async function getGameResultsForSession(sessionId: string): Promise<GameResult[]> {
  const d = getDb();
  const rows = await d.getAllAsync<{
    game_id: string;
    score: number;
    duration_ms: number;
    accuracy: number;
    reaction_time_ms: number | null;
    difficulty: number;
    correct_count: number;
    total_count: number;
    raw_metrics: string | null;
  }>('SELECT * FROM game_results WHERE session_id = ? ORDER BY id', sessionId);

  return rows.map((row) => ({
    gameId: row.game_id,
    score: row.score,
    durationMs: row.duration_ms,
    accuracy: row.accuracy,
    reactionTimeMs: row.reaction_time_ms ?? undefined,
    difficulty: row.difficulty as GameResult['difficulty'],
    correctCount: row.correct_count,
    totalCount: row.total_count,
    rawMetrics: row.raw_metrics ? JSON.parse(row.raw_metrics) : undefined,
  }));
}

// ── Daily summaries ─────────────────────────────────────────────────

export async function upsertDailySummary(summary: DailySummary): Promise<void> {
  const d = getDb();
  await d.runAsync(
    `INSERT INTO daily_summaries (date, avg_score, session_count, best_score, streak_count)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET
       avg_score = excluded.avg_score,
       session_count = excluded.session_count,
       best_score = excluded.best_score,
       streak_count = excluded.streak_count`,
    summary.date,
    summary.avgScore,
    summary.sessionCount,
    summary.bestScore,
    summary.streakCount,
  );
}

export async function getDailySummaries(days: number = 30): Promise<DailySummary[]> {
  const d = getDb();
  const rows = await d.getAllAsync<{
    date: string;
    avg_score: number;
    session_count: number;
    best_score: number;
    streak_count: number;
  }>('SELECT * FROM daily_summaries ORDER BY date DESC LIMIT ?', days);

  return rows.map((row) => ({
    date: row.date,
    avgScore: row.avg_score,
    sessionCount: row.session_count,
    bestScore: row.best_score,
    streakCount: row.streak_count,
  }));
}

export async function getSessionCountForDate(date: string): Promise<number> {
  const d = getDb();
  const result = await d.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM sessions WHERE date(started_at) = ?',
    date,
  );
  return result?.count ?? 0;
}
