CREATE TABLE IF NOT EXISTS schema_migrations (
  id TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  age INTEGER,
  height_cm REAL,
  weight_kg REAL,
  level TEXT NOT NULL DEFAULT 'reinicio',
  goal TEXT NOT NULL DEFAULT 'bienestar',
  sensitive_zones TEXT NOT NULL DEFAULT '[]',
  sensitive_notes TEXT NOT NULL DEFAULT '',
  ai_consent INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  is_demo INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS routines (
  id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  day_name TEXT NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  focus TEXT NOT NULL,
  is_rest_day INTEGER NOT NULL DEFAULT 0,
  warmup_minutes INTEGER NOT NULL DEFAULT 5,
  main_minutes INTEGER NOT NULL DEFAULT 20,
  cooldown_minutes INTEGER NOT NULL DEFAULT 5,
  rounds INTEGER NOT NULL DEFAULT 2,
  default_work_seconds INTEGER NOT NULL DEFAULT 40,
  default_rest_seconds INTEGER NOT NULL DEFAULT 20,
  progression_note TEXT NOT NULL DEFAULT '',
  exercises_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exercise_video_overrides (
  user_id INTEGER NOT NULL,
  exercise_id TEXT NOT NULL,
  video_url TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, exercise_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workout_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  routine_id TEXT NOT NULL,
  routine_title TEXT NOT NULL,
  routine_focus TEXT NOT NULL,
  started_at TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  exercises_completed INTEGER NOT NULL,
  rounds_completed INTEGER NOT NULL,
  pre_energy INTEGER NOT NULL,
  pre_knee_pain INTEGER NOT NULL,
  pre_back_pain INTEGER NOT NULL,
  rpe INTEGER NOT NULL,
  post_knee_pain INTEGER NOT NULL,
  post_back_pain INTEGER NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  recommendation TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_completed
  ON workout_sessions (user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS weight_logs (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  recorded_at TEXT NOT NULL,
  weight_kg REAL NOT NULL,
  note TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_weight_logs_user_date
  ON weight_logs (user_id, recorded_at DESC);
