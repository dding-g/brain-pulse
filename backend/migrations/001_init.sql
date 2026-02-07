CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  game_id TEXT NOT NULL,
  mode TEXT NOT NULL CHECK(mode IN ('rest', 'activation', 'development')),
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  accuracy REAL NOT NULL,
  avg_response_time REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX idx_scores_device ON scores(device_id, created_at);
CREATE INDEX idx_scores_game ON scores(game_id, score DESC);
CREATE INDEX idx_scores_daily ON scores(created_at, score DESC);

CREATE TABLE daily_summary (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id TEXT NOT NULL,
  date TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  focus_index INTEGER,
  stability_index INTEGER,
  growth_index INTEGER,
  streak_days INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(device_id, date)
);

CREATE INDEX idx_daily_summary_device ON daily_summary(device_id, date DESC);
