import { Hono } from "hono";
import type { Env } from "../types/env";

const health = new Hono<{ Bindings: Env }>();

health.get("/", (c) => {
  return c.json({
    success: true,
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
  });
});

export default health;
