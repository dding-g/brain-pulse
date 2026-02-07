import { describe, it, expect } from "vitest";
import { ScoreSubmissionSchema } from "../src/types/api";

describe("ScoreSubmission Zod validation", () => {
  it("should accept valid score submission", () => {
    const valid = {
      device_id: "test-device-123",
      game_id: "color-match",
      mode: "rest",
      score: 850,
      level: 5,
      accuracy: 0.92,
      avg_response_time: 342.5,
    };

    const result = ScoreSubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should accept submission without optional fields", () => {
    const valid = {
      device_id: "test-device-123",
      game_id: "color-match",
      mode: "activation",
      score: 500,
      level: 1,
      accuracy: 0.75,
    };

    const result = ScoreSubmissionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it("should reject invalid mode", () => {
    const invalid = {
      device_id: "test-device-123",
      game_id: "color-match",
      mode: "invalid_mode",
      score: 500,
      level: 1,
      accuracy: 0.75,
    };

    const result = ScoreSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject missing required fields", () => {
    const invalid = {
      device_id: "test-device-123",
    };

    const result = ScoreSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject score out of range", () => {
    const invalid = {
      device_id: "test-device-123",
      game_id: "color-match",
      mode: "rest",
      score: -1,
      level: 1,
      accuracy: 0.75,
    };

    const result = ScoreSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("should reject accuracy out of range", () => {
    const invalid = {
      device_id: "test-device-123",
      game_id: "color-match",
      mode: "rest",
      score: 500,
      level: 1,
      accuracy: 1.5,
    };

    const result = ScoreSubmissionSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
