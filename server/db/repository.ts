import type Database from 'better-sqlite3';
import crypto from 'node:crypto';
import type {
  FitnessLevel,
  GoalType,
  Routine,
  RoutineExerciseItem,
  SensitiveZone,
  UserProfile,
  WeightLog,
  WorkoutSession,
} from '../../src/shared/types.ts';
import { DEFAULT_ROUTINES } from '../../src/shared/routines.ts';
import { seedDefaultRoutinesForUser } from './database.ts';

export interface UserWithSecret {
  profile: UserProfile;
  passwordHash: string;
}

export interface DataRepository {
  countUsers(): number;
  countNonDemoUsers(): number;
  getUserByEmail(email: string): UserWithSecret | null;
  getUserById(id: number): UserProfile | null;
  createUser(params: { email: string; passwordHash: string; name: string }): UserProfile;
  updateProfile(
    userId: number,
    patch: {
      name: string;
      age: number | null;
      heightCm: number | null;
      weightKg: number | null;
      level: FitnessLevel;
      goal: GoalType;
      sensitiveZones: SensitiveZone[];
      sensitiveNotes: string;
      aiConsent: boolean;
      onboardingCompleted: boolean;
    },
  ): UserProfile | null;
  deleteUserAndData(userId: number): void;
  createAuthSession(sessionId: string, userId: number, expiresAtIso: string): void;
  getAuthSessionUserId(sessionId: string): number | null;
  deleteAuthSession(sessionId: string): void;
  getRoutinesByUser(userId: number): Routine[];
  saveRoutine(userId: number, routine: Routine): Routine;
  resetRoutines(userId: number): Routine[];
  getExerciseVideoOverrides(userId: number): Record<string, string>;
  setExerciseVideoOverride(userId: number, exerciseId: string, videoUrl: string | null): void;
  getWorkoutSessions(userId: number): WorkoutSession[];
  createWorkoutSession(
    userId: number,
    input: Omit<WorkoutSession, 'id'>,
  ): WorkoutSession;
  getWeightLogs(userId: number): WeightLog[];
  createWeightLog(
    userId: number,
    input: { weightKg: number; recordedAt: string; note: string },
  ): WeightLog;
  deleteWeightLog(userId: number, logId: string): void;
  exportAllUserData(userId: number): Record<string, unknown> | null;
}

interface RawUserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  age: number | null;
  height_cm: number | null;
  weight_kg: number | null;
  level: string;
  goal: string;
  sensitive_zones: string;
  sensitive_notes: string;
  ai_consent: number;
  onboarding_completed: number;
  is_demo: number;
  created_at: string;
}

function mapUserRow(row: RawUserRow): UserProfile {
  let zones: SensitiveZone[] = [];
  try {
    zones = JSON.parse(row.sensitive_zones) as SensitiveZone[];
  } catch {
    zones = [];
  }
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    age: row.age,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    level: (row.level as FitnessLevel) || 'reinicio',
    goal: (row.goal as GoalType) || 'bienestar',
    sensitiveZones: Array.isArray(zones) ? zones : [],
    sensitiveNotes: row.sensitive_notes || '',
    aiConsent: row.ai_consent === 1,
    onboardingCompleted: row.onboarding_completed === 1,
    isDemo: row.is_demo === 1,
    createdAt: row.created_at,
  };
}

export class SqliteRepository implements DataRepository {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  countUsers(): number {
    const row = this.db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number };
    return row.cnt;
  }

  countNonDemoUsers(): number {
    const row = this.db
      .prepare('SELECT COUNT(*) as cnt FROM users WHERE is_demo = 0')
      .get() as { cnt: number };
    return row.cnt;
  }

  getUserByEmail(email: string): UserWithSecret | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email.trim()) as RawUserRow | undefined;
    if (!row) return null;
    return { profile: mapUserRow(row), passwordHash: row.password_hash };
  }

  getUserById(id: number): UserProfile | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
      | RawUserRow
      | undefined;
    return row ? mapUserRow(row) : null;
  }

  createUser(params: { email: string; passwordHash: string; name: string }): UserProfile {
    const now = new Date().toISOString();
    const tx = this.db.transaction(() => {
      const res = this.db
        .prepare(
          `INSERT INTO users (
            email, password_hash, name, level, goal, sensitive_zones,
            sensitive_notes, ai_consent, onboarding_completed, is_demo, created_at
          ) VALUES (?, ?, ?, 'reinicio', 'bienestar', '[]', '', 0, 0, 0, ?)`,
        )
        .run(params.email.trim().toLowerCase(), params.passwordHash, params.name.trim(), now);
      const userId = Number(res.lastInsertRowid);
      seedDefaultRoutinesForUser(this.db, userId);
      return userId;
    });
    const newId = tx();
    return this.getUserById(newId)!;
  }

  updateProfile(
    userId: number,
    patch: {
      name: string;
      age: number | null;
      heightCm: number | null;
      weightKg: number | null;
      level: FitnessLevel;
      goal: GoalType;
      sensitiveZones: SensitiveZone[];
      sensitiveNotes: string;
      aiConsent: boolean;
      onboardingCompleted: boolean;
    },
  ): UserProfile | null {
    this.db
      .prepare(
        `UPDATE users SET
          name = ?,
          age = ?,
          height_cm = ?,
          weight_kg = ?,
          level = ?,
          goal = ?,
          sensitive_zones = ?,
          sensitive_notes = ?,
          ai_consent = ?,
          onboarding_completed = ?
        WHERE id = ?`,
      )
      .run(
        patch.name,
        patch.age,
        patch.heightCm,
        patch.weightKg,
        patch.level,
        patch.goal,
        JSON.stringify(patch.sensitiveZones),
        patch.sensitiveNotes,
        patch.aiConsent ? 1 : 0,
        patch.onboardingCompleted ? 1 : 0,
        userId,
      );
    return this.getUserById(userId);
  }

  deleteUserAndData(userId: number): void {
    this.db.prepare('DELETE FROM users WHERE id = ?').run(userId);
  }

  createAuthSession(sessionId: string, userId: number, expiresAtIso: string): void {
    this.db
      .prepare(
        'INSERT INTO auth_sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)',
      )
      .run(sessionId, userId, expiresAtIso, new Date().toISOString());
  }

  getAuthSessionUserId(sessionId: string): number | null {
    const row = this.db
      .prepare('SELECT user_id, expires_at FROM auth_sessions WHERE id = ?')
      .get(sessionId) as { user_id: number; expires_at: string } | undefined;
    if (!row) return null;
    if (new Date(row.expires_at).getTime() <= Date.now()) {
      this.deleteAuthSession(sessionId);
      return null;
    }
    return row.user_id;
  }

  deleteAuthSession(sessionId: string): void {
    this.db.prepare('DELETE FROM auth_sessions WHERE id = ?').run(sessionId);
  }

  getRoutinesByUser(userId: number): Routine[] {
    const rows = this.db
      .prepare('SELECT * FROM routines WHERE user_id = ? ORDER BY day_of_week ASC')
      .all(userId) as Array<{
      id: string;
      day_of_week: number;
      day_name: string;
      title: string;
      subtitle: string;
      focus: string;
      is_rest_day: number;
      warmup_minutes: number;
      main_minutes: number;
      cooldown_minutes: number;
      rounds: number;
      default_work_seconds: number;
      default_rest_seconds: number;
      progression_note: string;
      exercises_json: string;
    }>;

    if (rows.length === 0) {
      seedDefaultRoutinesForUser(this.db, userId);
      return DEFAULT_ROUTINES;
    }

    return rows.map((row) => {
      let exercises: RoutineExerciseItem[] = [];
      try {
        exercises = JSON.parse(row.exercises_json) as RoutineExerciseItem[];
      } catch {
        exercises = [];
      }
      return {
        id: row.id,
        dayOfWeek: row.day_of_week,
        dayName: row.day_name,
        title: row.title,
        subtitle: row.subtitle,
        focus: row.focus as Routine['focus'],
        isRestDay: row.is_rest_day === 1,
        warmupMinutes: row.warmup_minutes,
        mainMinutes: row.main_minutes,
        cooldownMinutes: row.cooldown_minutes,
        rounds: row.rounds,
        defaultWorkSeconds: row.default_work_seconds,
        defaultRestSeconds: row.default_rest_seconds,
        progressionNote: row.progression_note,
        exercises,
      };
    });
  }

  saveRoutine(userId: number, routine: Routine): Routine {
    this.db
      .prepare(
        `UPDATE routines SET
          title = ?,
          subtitle = ?,
          is_rest_day = ?,
          warmup_minutes = ?,
          main_minutes = ?,
          cooldown_minutes = ?,
          rounds = ?,
          default_work_seconds = ?,
          default_rest_seconds = ?,
          progression_note = ?,
          exercises_json = ?,
          updated_at = ?
        WHERE user_id = ? AND id = ?`,
      )
      .run(
        routine.title,
        routine.subtitle,
        routine.isRestDay ? 1 : 0,
        routine.warmupMinutes,
        routine.mainMinutes,
        routine.cooldownMinutes,
        routine.rounds,
        routine.defaultWorkSeconds,
        routine.defaultRestSeconds,
        routine.progressionNote,
        JSON.stringify(routine.exercises),
        new Date().toISOString(),
        userId,
        routine.id,
      );
    const updated = this.getRoutinesByUser(userId).find((r) => r.id === routine.id);
    return updated ?? routine;
  }

  resetRoutines(userId: number): Routine[] {
    const tx = this.db.transaction(() => {
      this.db.prepare('DELETE FROM routines WHERE user_id = ?').run(userId);
      seedDefaultRoutinesForUser(this.db, userId);
    });
    tx();
    return this.getRoutinesByUser(userId);
  }

  getExerciseVideoOverrides(userId: number): Record<string, string> {
    const rows = this.db
      .prepare('SELECT exercise_id, video_url FROM exercise_video_overrides WHERE user_id = ?')
      .all(userId) as Array<{ exercise_id: string; video_url: string }>;
    const map: Record<string, string> = {};
    for (const row of rows) {
      map[row.exercise_id] = row.video_url;
    }
    return map;
  }

  setExerciseVideoOverride(userId: number, exerciseId: string, videoUrl: string | null): void {
    if (!videoUrl) {
      this.db
        .prepare('DELETE FROM exercise_video_overrides WHERE user_id = ? AND exercise_id = ?')
        .run(userId, exerciseId);
      return;
    }
    this.db
      .prepare(
        `INSERT INTO exercise_video_overrides (user_id, exercise_id, video_url, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(user_id, exercise_id) DO UPDATE SET video_url = excluded.video_url, updated_at = excluded.updated_at`,
      )
      .run(userId, exerciseId, videoUrl, new Date().toISOString());
  }

  getWorkoutSessions(userId: number): WorkoutSession[] {
    const rows = this.db
      .prepare('SELECT * FROM workout_sessions WHERE user_id = ? ORDER BY completed_at DESC')
      .all(userId) as Array<{
      id: string;
      routine_id: string;
      routine_title: string;
      routine_focus: string;
      started_at: string;
      completed_at: string;
      duration_seconds: number;
      exercises_completed: number;
      rounds_completed: number;
      pre_energy: number;
      pre_knee_pain: number;
      pre_back_pain: number;
      rpe: number;
      post_knee_pain: number;
      post_back_pain: number;
      note: string;
      recommendation: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      routineId: r.routine_id,
      routineTitle: r.routine_title,
      routineFocus: r.routine_focus,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      durationSeconds: r.duration_seconds,
      exercisesCompleted: r.exercises_completed,
      roundsCompleted: r.rounds_completed,
      preEnergy: r.pre_energy,
      preKneePain: r.pre_knee_pain,
      preBackPain: r.pre_back_pain,
      rpe: r.rpe,
      postKneePain: r.post_knee_pain,
      postBackPain: r.post_back_pain,
      note: r.note,
      recommendation: r.recommendation,
    }));
  }

  createWorkoutSession(
    userId: number,
    input: Omit<WorkoutSession, 'id'>,
  ): WorkoutSession {
    const id = `ses-${crypto.randomUUID()}`;
    this.db
      .prepare(
        `INSERT INTO workout_sessions (
          id, user_id, routine_id, routine_title, routine_focus, started_at, completed_at,
          duration_seconds, exercises_completed, rounds_completed,
          pre_energy, pre_knee_pain, pre_back_pain, rpe, post_knee_pain, post_back_pain,
          note, recommendation
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        userId,
        input.routineId,
        input.routineTitle,
        input.routineFocus,
        input.startedAt,
        input.completedAt,
        input.durationSeconds,
        input.exercisesCompleted,
        input.roundsCompleted,
        input.preEnergy,
        input.preKneePain,
        input.preBackPain,
        input.rpe,
        input.postKneePain,
        input.postBackPain,
        input.note,
        input.recommendation,
      );
    return { id, ...input };
  }

  getWeightLogs(userId: number): WeightLog[] {
    const rows = this.db
      .prepare('SELECT * FROM weight_logs WHERE user_id = ? ORDER BY recorded_at DESC')
      .all(userId) as Array<{
      id: string;
      recorded_at: string;
      weight_kg: number;
      note: string;
    }>;

    return rows.map((r) => ({
      id: r.id,
      recordedAt: r.recorded_at,
      weightKg: r.weight_kg,
      note: r.note,
    }));
  }

  createWeightLog(
    userId: number,
    input: { weightKg: number; recordedAt: string; note: string },
  ): WeightLog {
    const id = `w-${crypto.randomUUID()}`;
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          'INSERT INTO weight_logs (id, user_id, recorded_at, weight_kg, note) VALUES (?, ?, ?, ?, ?)',
        )
        .run(id, userId, input.recordedAt, input.weightKg, input.note);
      this.db
        .prepare('UPDATE users SET weight_kg = ? WHERE id = ?')
        .run(input.weightKg, userId);
    });
    tx();
    return { id, recordedAt: input.recordedAt, weightKg: input.weightKg, note: input.note };
  }

  deleteWeightLog(userId: number, logId: string): void {
    this.db
      .prepare('DELETE FROM weight_logs WHERE id = ? AND user_id = ?')
      .run(logId, userId);
  }

  exportAllUserData(userId: number): Record<string, unknown> | null {
    const profile = this.getUserById(userId);
    if (!profile) return null;
    return {
      exportedAt: new Date().toISOString(),
      app: 'Mi Entrenamiento',
      profile,
      routines: this.getRoutinesByUser(userId),
      sessions: this.getWorkoutSessions(userId),
      weightLogs: this.getWeightLogs(userId),
      exerciseVideoOverrides: this.getExerciseVideoOverrides(userId),
    };
  }
}
