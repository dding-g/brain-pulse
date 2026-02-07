import { Hono } from "hono";
import { ShareCardQuerySchema } from "../types/api";
import type { Env } from "../types/env";
import { getDailySummary } from "../lib/db";

const shareCard = new Hono<{ Bindings: Env }>();

shareCard.get("/", async (c) => {
  const parsed = ShareCardQuerySchema.safeParse({
    device_id: c.req.query("device_id"),
    date: c.req.query("date"),
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

  const { device_id, date } = parsed.data;
  const summary = await getDailySummary(c.env.BRAIN_PULSE_DB, device_id, date);

  if (!summary) {
    return c.json(
      { success: false, error: "No data found for the given device and date" },
      404
    );
  }

  // Phase 3: Replace with workers-og image generation
  return c.json({
    success: true,
    data: {
      card: {
        device_id,
        date: date ?? new Date().toISOString().split("T")[0],
        overall_score: summary.overall_score,
        focus_index: summary.focus_index,
        stability_index: summary.stability_index,
        growth_index: summary.growth_index,
        streak_days: summary.streak_days,
      },
      image_url: null, // Will be generated in Phase 3
    },
  });
});

export default shareCard;
