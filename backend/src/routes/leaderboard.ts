import { Hono } from "hono";
import { LeaderboardQuerySchema } from "../types/api";
import type { Env } from "../types/env";
import { getLeaderboard } from "../lib/db";

const CACHE_TTL = 300; // 5 minutes

const leaderboard = new Hono<{ Bindings: Env }>();

leaderboard.get("/", async (c) => {
  const parsed = LeaderboardQuerySchema.safeParse({
    period: c.req.query("period"),
    limit: c.req.query("limit"),
    game_id: c.req.query("game_id"),
  });

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Invalid query parameters",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const { period, limit, game_id } = parsed.data;
  const cacheKey = `leaderboard:${period}:${limit}:${game_id ?? "all"}`;

  const cached = await c.env.BRAIN_PULSE_KV.get(cacheKey);
  if (cached) {
    return c.json({ success: true, data: JSON.parse(cached) });
  }

  const results = await getLeaderboard(
    c.env.BRAIN_PULSE_DB,
    period,
    limit,
    game_id
  );

  await c.env.BRAIN_PULSE_KV.put(cacheKey, JSON.stringify(results), {
    expirationTtl: CACHE_TTL,
  });

  return c.json({ success: true, data: results });
});

export default leaderboard;
