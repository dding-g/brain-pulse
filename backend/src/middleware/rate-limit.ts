import { createMiddleware } from "hono/factory";
import type { Env } from "../types/env";

const MAX_REQUESTS = 100;
const WINDOW_SECONDS = 60;

export const rateLimit = createMiddleware<{ Bindings: Env }>(
  async (c, next) => {
    const deviceId =
      c.req.header("X-Device-ID") ??
      (c.req.method === "POST"
        ? ((await c.req.raw.clone().json().catch(() => null)) as Record<
            string,
            unknown
          > | null)?.device_id
        : c.req.query("device_id"));

    if (!deviceId || typeof deviceId !== "string") {
      return await next();
    }

    const key = `rate:${deviceId}`;
    const current = await c.env.BRAIN_PULSE_KV.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= MAX_REQUESTS) {
      return c.json(
        { success: false, error: "Rate limit exceeded. Try again later." },
        429
      );
    }

    await c.env.BRAIN_PULSE_KV.put(key, String(count + 1), {
      expirationTtl: WINDOW_SECONDS,
    });

    await next();
  }
);
