import type { ScoreSubmission } from "../types/api";

export async function insertScore(
  db: D1Database,
  score: ScoreSubmission
): Promise<number> {
  const result = await db
    .prepare(
      `INSERT INTO scores (device_id, game_id, mode, score, level, accuracy, avg_response_time)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      score.device_id,
      score.game_id,
      score.mode,
      score.score,
      score.level,
      score.accuracy,
      score.avg_response_time ?? null
    )
    .run();

  return result.meta.last_row_id;
}

export async function getLeaderboard(
  db: D1Database,
  period: "daily" | "weekly" | "all",
  limit: number,
  gameId?: string
): Promise<Record<string, unknown>[]> {
  let dateFilter = "";
  if (period === "daily") {
    dateFilter = "AND created_at >= datetime('now', '-1 day')";
  } else if (period === "weekly") {
    dateFilter = "AND created_at >= datetime('now', '-7 days')";
  }

  const gameFilter = gameId ? "AND game_id = ?" : "";

  const query = `
    SELECT device_id, game_id, MAX(score) as best_score, accuracy, avg_response_time, created_at
    FROM scores
    WHERE 1=1 ${dateFilter} ${gameFilter}
    GROUP BY device_id, game_id
    ORDER BY best_score DESC
    LIMIT ?
  `;

  const bindings: (string | number)[] = [];
  if (gameId) bindings.push(gameId);
  bindings.push(limit);

  const result = await db
    .prepare(query)
    .bind(...bindings)
    .all();

  return result.results;
}

export async function getDailySummary(
  db: D1Database,
  deviceId: string,
  date?: string
): Promise<Record<string, unknown> | null> {
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const result = await db
    .prepare(
      `SELECT * FROM daily_summary WHERE device_id = ? AND date = ?`
    )
    .bind(deviceId, targetDate)
    .first();

  return result;
}
