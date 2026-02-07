import { describe, it, expect } from "vitest";
import app from "../src/index";

const mockEnv = {
  BRAIN_PULSE_DB: {} as D1Database,
  BRAIN_PULSE_KV: {
    get: async () => null,
    put: async () => {},
  } as unknown as KVNamespace,
};

describe("Health endpoint", () => {
  it("should return ok status", async () => {
    const res = await app.request("/api/v1/health", {}, mockEnv);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("ok");
    expect(body.data.version).toBe("1.0.0");
    expect(body.data.timestamp).toBeDefined();
  });
});

describe("Not found", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await app.request("/unknown", {}, mockEnv);
    expect(res.status).toBe(404);

    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("Not found");
  });
});
