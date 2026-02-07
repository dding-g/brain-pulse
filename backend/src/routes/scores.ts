import { Hono } from "hono";
import { ScoreSubmissionSchema } from "../types/api";
import type { Env } from "../types/env";
import { insertScore } from "../lib/db";

const scores = new Hono<{ Bindings: Env }>();

scores.post("/", async (c) => {
  const body = await c.req.json();
  const parsed = ScoreSubmissionSchema.safeParse(body);

  if (!parsed.success) {
    return c.json(
      {
        success: false,
        error: "Validation failed",
        details: parsed.error.flatten().fieldErrors,
      },
      400
    );
  }

  const id = await insertScore(c.env.BRAIN_PULSE_DB, parsed.data);

  return c.json({ success: true, data: { id } }, 201);
});

export default scores;
