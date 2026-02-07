import { Hono } from "hono";
import { ShareCardQuerySchema } from "../types/api";
import type { Env } from "../types/env";
import { getDailySummary } from "../lib/db";
import { generateShareCardPng, generateShareCardSvg } from "../lib/og-image";

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

  const cardData = {
    score: Number(summary.overall_score ?? 0),
    date: String(date ?? new Date().toISOString().split("T")[0]),
    focusIndex:
      summary.focus_index != null ? Number(summary.focus_index) : undefined,
    stabilityIndex:
      summary.stability_index != null
        ? Number(summary.stability_index)
        : undefined,
    growthIndex:
      summary.growth_index != null ? Number(summary.growth_index) : undefined,
    streakDays:
      summary.streak_days != null ? Number(summary.streak_days) : undefined,
  };

  // Try PNG first, fall back to SVG if resvg rendering fails
  try {
    const png = await generateShareCardPng(c.env.BRAIN_PULSE_KV, cardData);
    return new Response(png, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (pngError) {
    console.error("PNG generation failed, falling back to SVG:", pngError);
    try {
      const svg = await generateShareCardSvg(c.env.BRAIN_PULSE_KV, cardData);
      return new Response(svg, {
        headers: {
          "Content-Type": "image/svg+xml",
          "Cache-Control": "public, max-age=3600, s-maxage=86400",
        },
      });
    } catch (svgError) {
      console.error("SVG generation also failed:", svgError);
      return c.json(
        { success: false, error: "Failed to generate share card image" },
        500
      );
    }
  }
});

export default shareCard;
