import { Hono } from "hono";
import { cors } from "hono/cors";
import type { Env } from "./types/env";
import { rateLimit } from "./middleware/rate-limit";
import health from "./routes/health";
import scores from "./routes/scores";
import leaderboard from "./routes/leaderboard";
import shareCard from "./routes/share-card";

const app = new Hono<{ Bindings: Env }>();

// Global middleware
app.use("*", cors());
app.use("/api/*", rateLimit);

// Global error handler
app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json(
    { success: false, error: "Internal server error" },
    500
  );
});

// Not found handler
app.notFound((c) => {
  return c.json({ success: false, error: "Not found" }, 404);
});

// Routes
app.route("/api/v1/health", health);
app.route("/api/v1/scores", scores);
app.route("/api/v1/leaderboard", leaderboard);
app.route("/api/v1/share-card", shareCard);

export default app;
