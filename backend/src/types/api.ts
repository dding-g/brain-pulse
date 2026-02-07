import { z } from "zod";

export const ScoreSubmissionSchema = z.object({
  device_id: z.string().min(1).max(128),
  game_id: z.string().min(1).max(64),
  mode: z.enum(["rest", "activation", "development"]),
  score: z.number().int().min(0).max(10000),
  level: z.number().int().min(1).max(100),
  accuracy: z.number().min(0).max(1),
  avg_response_time: z.number().min(0).optional(),
});

export type ScoreSubmission = z.infer<typeof ScoreSubmissionSchema>;

export const LeaderboardQuerySchema = z.object({
  period: z.enum(["daily", "weekly", "all"]).default("daily"),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  game_id: z.string().min(1).max(64).optional(),
});

export type LeaderboardQuery = z.infer<typeof LeaderboardQuerySchema>;

export const ShareCardQuerySchema = z.object({
  device_id: z.string().min(1).max(128),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type ShareCardQuery = z.infer<typeof ShareCardQuerySchema>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
