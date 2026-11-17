import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPassword } from '../auth/security.ts';
import { DEFAULT_ROUTINES } from '../../src/shared/routines.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDatabasePath(): string {
  const configured = process.env.DATABASE_PATH?.trim();
  if (configured) {
    try {
      fs.mkdirSync(path.dirname(configured), { recursive: true });
      fs.accessSync(path.dirname(configured), fs.constants.W_OK);
      return configured;
    } catch {
      // Fall back to local workspace ./data if configured path isn't writable
    }
  }

  const defaultDataDir = '/data';
  try {
    fs.mkdirSync(defaultDataDir, { recursive: true });
    fs.accessSync(defaultDataDir, fs.constants.W_OK);
    return path.join(defaultDataDir, 'mi-entrenamiento.db');
  } catch {
    const localDir = path.resolve(process.cwd(), 'data');
    fs.mkdirSync(localDir, { recursive: true });
    return path.join(localDir, 'mi-entrenamiento.db');
  }
}

let dbInstance: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (dbInstance) return dbInstance;
  const dbPath = resolveDatabasePath();
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  runMigrations(db);
  seedDemoIfNeeded(db);
  dbInstance = db;
  return db;
}

function runMigrations(db: Database.Database): void {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  // Ensure migration tracking table exists before querying it
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const appliedStmt = db.prepare('SELECT id FROM schema_migrations WHERE id = ?');
  const insertMig = db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)');

  for (const file of files) {
    const existing = appliedStmt.get(file);
    if (!existing) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      const runTx = db.transaction(() => {
        db.exec(sql);
        insertMig.run(file, new Date().toISOString());
      });
      runTx();
    }
  }
}

export function seedDefaultRoutinesForUser(db: Database.Database, userId: number): void {
  const insertRoutine = db.prepare(`
    INSERT OR IGNORE INTO routines (
      id, user_id, day_of_week, day_name, title, subtitle, focus, is_rest_day,
      warmup_minutes, main_minutes, cooldown_minutes, rounds,
      default_work_seconds, default_rest_seconds, progression_note, exercises_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const now = new Date().toISOString();
  for (const r of DEFAULT_ROUTINES) {
    insertRoutine.run(
      r.id,
      userId,
      r.dayOfWeek,
      r.dayName,
      r.title,
      r.subtitle,
      r.focus,
      r.isRestDay ? 1 : 0,
      r.warmupMinutes,
      r.mainMinutes,
      r.cooldownMinutes,
      r.rounds,
      r.defaultWorkSeconds,
      r.defaultRestSeconds,
      r.progressionNote,
      JSON.stringify(r.exercises),
      now,
    );
  }
}

function seedDemoIfNeeded(db: Database.Database): void {
  if (process.env.SEED_DEMO_DATA === 'false') return;

  const userCount = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
  if (userCount > 0) return;

  const now = new Date();
  const daysAgo = (d: number, hour = 8) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() - d);
    dt.setHours(hour, 15, 0, 0);
    return dt.toISOString();
  };

  const insertDemo = db.transaction(() => {
    const info = db
      .prepare(
        `INSERT INTO users (
          email, password_hash, name, age, height_cm, weight_kg, level, goal,
          sensitive_zones, sensitive_notes, ai_consent, onboarding_completed, is_demo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        'atleta@mi-entrenamiento.local',
        hashPassword('Calistenia2026!'),
        'Alex',
        38,
        174,
        76.4,
        'reinicio',
        'fuerza_suave',
        JSON.stringify(['rodillas', 'espalda']),
        'Cuidar profundidad de sentadilla y mantener postura lumbar neutra.',
        0,
        1,
        1,
        daysAgo(14, 9),
      );

    const userId = Number(info.lastInsertRowid);
    seedDefaultRoutinesForUser(db, userId);

    const sampleSessions = [
      {
        id: 'demo-ses-1',
        routineId: 'lunes-fuerza-a',
        routineTitle: 'Lunes · Fuerza A',
        routineFocus: 'fuerza',
        daysAgo: 9,
        durationSeconds: 1320,
        exercisesCompleted: 10,
        roundsCompleted: 2,
        preEnergy: 3,
        preKneePain: 2,
        preBackPain: 1,
        rpe: 6,
        postKneePain: 2,
        postBackPain: 1,
        note: 'Sentadilla corta con respaldo de silla, ritmo cómodo.',
        recommendation:
          'Sesión bien tolerada. Mantén el mismo volumen y revisa cómo amanecen tus rodillas y espalda mañana.',
      },
      {
        id: 'demo-ses-2',
        routineId: 'martes-movilidad',
        routineTitle: 'Martes · Movilidad',
        routineFocus: 'movilidad',
        daysAgo: 8,
        durationSeconds: 1140,
        exercisesCompleted: 12,
        roundsCompleted: 2,
        preEnergy: 4,
        preKneePain: 1,
        preBackPain: 2,
        rpe: 3,
        postKneePain: 1,
        postBackPain: 1,
        note: 'Basculaciones pélvicas ayudaron a soltar tensión matutina.',
        recommendation:
          'Buena tolerancia y esfuerzo suave. Puedes repetir este formato en tu siguiente sesión.',
      },
      {
        id: 'demo-ses-3',
        routineId: 'miercoles-fuerza-b',
        routineTitle: 'Miércoles · Fuerza B',
        routineFocus: 'fuerza',
        daysAgo: 6,
        durationSeconds: 1380,
        exercisesCompleted: 10,
        roundsCompleted: 2,
        preEnergy: 4,
        preKneePain: 1,
        preBackPain: 1,
        rpe: 5,
        postKneePain: 1,
        postBackPain: 1,
        note: 'Puente con pausa se sintió estable y sin carga lumbar.',
        recommendation:
          'Sesión bien tolerada. Mantén el mismo volumen y la constancia semanal.',
      },
      {
        id: 'demo-ses-4',
        routineId: 'viernes-circuito',
        routineTitle: 'Viernes · Circuito completo',
        routineFocus: 'circuito',
        daysAgo: 3,
        durationSeconds: 1500,
        exercisesCompleted: 12,
        roundsCompleted: 2,
        preEnergy: 4,
        preKneePain: 1,
        preBackPain: 1,
        rpe: 6,
        postKneePain: 2,
        postBackPain: 1,
        note: 'Buen cierre de semana, respiración fluida.',
        recommendation:
          'Sesión bien tolerada. Mantén el mismo volumen y observa tu recuperación.',
      },
      {
        id: 'demo-ses-5',
        routineId: 'lunes-fuerza-a',
        routineTitle: 'Lunes · Fuerza A',
        routineFocus: 'fuerza',
        daysAgo: 1,
        durationSeconds: 1350,
        exercisesCompleted: 10,
        roundsCompleted: 2,
        preEnergy: 4,
        preKneePain: 1,
        preBackPain: 1,
        rpe: 5,
        postKneePain: 1,
        postBackPain: 1,
        note: 'Controlando bajada en sentadilla corta y elevación lateral.',
        recommendation:
          'Buena tolerancia. Sigue con 2 rondas antes de valorar la tercera en la semana 3.',
      },
    ];

    const insertSession = db.prepare(`
      INSERT INTO workout_sessions (
        id, user_id, routine_id, routine_title, routine_focus, started_at, completed_at,
        duration_seconds, exercises_completed, rounds_completed,
        pre_energy, pre_knee_pain, pre_back_pain, rpe, post_knee_pain, post_back_pain,
        note, recommendation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of sampleSessions) {
      const completed = daysAgo(s.daysAgo, 8);
      const started = new Date(new Date(completed).getTime() - s.durationSeconds * 1000).toISOString();
      insertSession.run(
        s.id,
        userId,
        s.routineId,
        s.routineTitle,
        s.routineFocus,
        started,
        completed,
        s.durationSeconds,
        s.exercisesCompleted,
        s.roundsCompleted,
        s.preEnergy,
        s.preKneePain,
        s.preBackPain,
        s.rpe,
        s.postKneePain,
        s.postBackPain,
        s.note,
        s.recommendation,
      );
    }

    const insertWeight = db.prepare(
      'INSERT INTO weight_logs (id, user_id, recorded_at, weight_kg, note) VALUES (?, ?, ?, ?, ?)',
    );
    insertWeight.run('demo-w-1', userId, daysAgo(14, 7), 77.1, 'Registro inicial');
    insertWeight.run('demo-w-2', userId, daysAgo(9, 7), 76.8, 'Mañana en ayunas');
    insertWeight.run('demo-w-3', userId, daysAgo(4, 7), 76.6, '');
    insertWeight.run('demo-w-4', userId, daysAgo(1, 7), 76.4, 'Constante');
  });

  insertDemo();
}
