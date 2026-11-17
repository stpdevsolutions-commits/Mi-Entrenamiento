import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import {
  SESSION_COOKIE_NAME,
  generateSessionId,
  hashPassword,
  parseCookies,
  signSessionToken,
  validatePasswordPolicy,
  verifyPassword,
  verifySignedSessionToken,
} from '../auth/security.ts';
import type { DataRepository } from '../db/repository.ts';
import { DEFAULT_EXERCISES } from '../../src/shared/exercises.ts';
import {
  computeTrainingProfile,
  evaluatePostWorkoutRecommendation,
  MEDICAL_DISCLAIMER,
} from '../../src/shared/safety.ts';
import type {
  FitnessLevel,
  GoalType,
  Routine,
  RoutineExerciseItem,
  SensitiveZone,
  UserProfile,
} from '../../src/shared/types.ts';
import { isAiEnabledOnServer, requestConservativeAiAdvice } from '../services/aiAdvisor.ts';

interface AuthedRequest extends Request {
  user?: UserProfile;
  authSessionId?: string;
}

const VALID_LEVELS = new Set<FitnessLevel>(['reinicio', 'principiante', 'intermedio']);
const VALID_GOALS = new Set<GoalType>([
  'movilidad',
  'fuerza_suave',
  'volver_a_entrenar',
  'bienestar',
]);
const VALID_ZONES = new Set<SensitiveZone>(['rodillas', 'espalda', 'hombros', 'otra']);

function setSessionCookie(req: Request, res: Response, token: string): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  });
}

function clearSessionCookie(req: Request, res: Response): void {
  const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isHttps,
    path: '/',
  });
}

function isValidNumberInRange(val: unknown, min: number, max: number): val is number {
  return typeof val === 'number' && Number.isFinite(val) && val >= min && val <= max;
}

function sanitizeVideoUrl(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.length > 500) {
    throw new Error('El enlace de video es demasiado largo.');
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      throw new Error('Protocolo no permitido.');
    }
    return parsed.toString();
  } catch {
    throw new Error('El enlace de video debe ser una URL válida (https:// o ruta /videos/...).');
  }
}

export function createApiRouter(repo: DataRepository): express.Router {
  const router = express.Router();

  // Disable caching on all private API routes
  router.use((_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    next();
  });

  const requireAuth = (req: AuthedRequest, res: Response, next: NextFunction) => {
    const cookies = parseCookies(req.headers.cookie);
    const signed = cookies[SESSION_COOKIE_NAME];
    const sessionId = verifySignedSessionToken(signed);
    if (!sessionId) {
      res.status(401).json({ error: 'Sesión no iniciada o expirada.' });
      return;
    }
    const userId = repo.getAuthSessionUserId(sessionId);
    if (!userId) {
      clearSessionCookie(req, res);
      res.status(401).json({ error: 'Tu sesión expiró. Vuelve a iniciar sesión.' });
      return;
    }
    const user = repo.getUserById(userId);
    if (!user) {
      clearSessionCookie(req, res);
      res.status(401).json({ error: 'Cuenta no encontrada.' });
      return;
    }
    req.user = user;
    req.authSessionId = sessionId;
    next();
  };

  router.get('/health', (_req, res) => {
    const allowEnv = process.env.ALLOW_REGISTRATION !== 'false';
    const singleUser = process.env.SINGLE_USER_MODE !== 'false';
    const personalCount = repo.countNonDemoUsers();
    const registrationAllowed = allowEnv && (!singleUser || personalCount === 0);
    const demoUser = repo.getUserByEmail('atleta@mi-entrenamiento.local');

    res.json({
      ok: true,
      aiEnabled: isAiEnabledOnServer(),
      registrationAllowed,
      singleUserMode: singleUser,
      demoAvailable: Boolean(demoUser),
      disclaimer: MEDICAL_DISCLAIMER,
    });
  });

  router.post('/auth/register', (req, res) => {
    const allowEnv = process.env.ALLOW_REGISTRATION !== 'false';
    const singleUser = process.env.SINGLE_USER_MODE !== 'false';
    const personalCount = repo.countNonDemoUsers();

    if (!allowEnv || (singleUser && personalCount > 0)) {
      res.status(403).json({
        error:
          'El registro de nuevas cuentas está desactivado en este servidor (ALLOW_REGISTRATION=false o cuenta única ya creada).',
      });
      return;
    }

    const { email, password, name } = req.body ?? {};
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({ error: 'Ingresa un correo electrónico válido.' });
      return;
    }
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) {
      res.status(400).json({ error: 'El nombre o apodo debe tener entre 2 y 60 caracteres.' });
      return;
    }
    const pwdError = validatePasswordPolicy(password);
    if (pwdError) {
      res.status(400).json({ error: pwdError });
      return;
    }
    if (repo.getUserByEmail(email)) {
      res.status(409).json({ error: 'Ya existe una cuenta registrada con ese correo.' });
      return;
    }

    const user = repo.createUser({
      email,
      passwordHash: hashPassword(password),
      name,
    });

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    repo.createAuthSession(sessionId, user.id, expiresAt);
    setSessionCookie(req, res, signSessionToken(sessionId));

    res.status(201).json({ user, aiEnabled: isAiEnabledOnServer() });
  });

  router.post('/auth/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      res.status(400).json({ error: 'Ingresa tu correo y contraseña.' });
      return;
    }

    const found = repo.getUserByEmail(email);
    if (!found || !verifyPassword(password, found.passwordHash)) {
      res.status(401).json({ error: 'Correo o contraseña incorrectos.' });
      return;
    }

    const sessionId = generateSessionId();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
    repo.createAuthSession(sessionId, found.profile.id, expiresAt);
    setSessionCookie(req, res, signSessionToken(sessionId));

    res.json({ user: found.profile, aiEnabled: isAiEnabledOnServer() });
  });

  router.post('/auth/logout', (req: AuthedRequest, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = verifySignedSessionToken(cookies[SESSION_COOKIE_NAME]);
    if (sessionId) {
      repo.deleteAuthSession(sessionId);
    }
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  router.get('/auth/me', (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = verifySignedSessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!sessionId) {
      res.json({ authenticated: false, user: null, aiEnabled: isAiEnabledOnServer() });
      return;
    }
    const userId = repo.getAuthSessionUserId(sessionId);
    if (!userId) {
      clearSessionCookie(req, res);
      res.json({ authenticated: false, user: null, aiEnabled: isAiEnabledOnServer() });
      return;
    }
    const user = repo.getUserById(userId);
    if (!user) {
      clearSessionCookie(req, res);
      res.json({ authenticated: false, user: null, aiEnabled: isAiEnabledOnServer() });
      return;
    }
    res.json({
      authenticated: true,
      user,
      aiEnabled: isAiEnabledOnServer(),
    });
  });

  router.put('/profile', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (name.length < 2 || name.length > 60) {
      res.status(400).json({ error: 'El nombre o apodo debe tener entre 2 y 60 caracteres.' });
      return;
    }

    let age: number | null = null;
    if (body.age !== null && body.age !== undefined && body.age !== '') {
      const parsedAge = Number(body.age);
      if (!isValidNumberInRange(parsedAge, 14, 110)) {
        res.status(400).json({ error: 'La edad debe estar entre 14 y 110 años.' });
        return;
      }
      age = Math.round(parsedAge);
    }

    let heightCm: number | null = null;
    if (body.heightCm !== null && body.heightCm !== undefined && body.heightCm !== '') {
      const parsedH = Number(body.heightCm);
      if (!isValidNumberInRange(parsedH, 100, 240)) {
        res.status(400).json({ error: 'La altura debe estar entre 100 y 240 cm.' });
        return;
      }
      heightCm = Math.round(parsedH * 10) / 10;
    }

    let weightKg: number | null = null;
    if (body.weightKg !== null && body.weightKg !== undefined && body.weightKg !== '') {
      const parsedW = Number(body.weightKg);
      if (!isValidNumberInRange(parsedW, 30, 300)) {
        res.status(400).json({ error: 'El peso debe estar entre 30 y 300 kg.' });
        return;
      }
      weightKg = Math.round(parsedW * 10) / 10;
    }

    const level: FitnessLevel = VALID_LEVELS.has(body.level) ? body.level : 'reinicio';
    const goal: GoalType = VALID_GOALS.has(body.goal) ? body.goal : 'bienestar';
    const sensitiveZones: SensitiveZone[] = Array.isArray(body.sensitiveZones)
      ? body.sensitiveZones.filter((z: unknown): z is SensitiveZone =>
          VALID_ZONES.has(z as SensitiveZone),
        )
      : [];
    const sensitiveNotes =
      typeof body.sensitiveNotes === 'string' ? body.sensitiveNotes.trim().slice(0, 400) : '';
    const aiConsent = Boolean(body.aiConsent);
    const onboardingCompleted =
      body.onboardingCompleted !== undefined
        ? Boolean(body.onboardingCompleted)
        : req.user!.onboardingCompleted;

    const updated = repo.updateProfile(req.user!.id, {
      name,
      age,
      heightCm,
      weightKg,
      level,
      goal,
      sensitiveZones,
      sensitiveNotes,
      aiConsent,
      onboardingCompleted,
    });

    res.json({ user: updated });
  });

  router.get('/routines', requireAuth, (req: AuthedRequest, res) => {
    const routines = repo.getRoutinesByUser(req.user!.id);
    res.json({ routines });
  });

  router.put('/routines/:id', requireAuth, (req: AuthedRequest, res) => {
    const routineId = String(req.params.id);
    const existing = repo.getRoutinesByUser(req.user!.id).find((r) => r.id === routineId);
    if (!existing) {
      res.status(404).json({ error: 'Rutina no encontrada.' });
      return;
    }

    const body = req.body ?? {};
    const title =
      typeof body.title === 'string' && body.title.trim().length >= 2
        ? body.title.trim().slice(0, 80)
        : existing.title;
    const subtitle =
      typeof body.subtitle === 'string' ? body.subtitle.trim().slice(0, 140) : existing.subtitle;
    const isRestDay = body.isRestDay !== undefined ? Boolean(body.isRestDay) : existing.isRestDay;
    const warmupMinutes = isValidNumberInRange(Number(body.warmupMinutes), 0, 30)
      ? Math.round(Number(body.warmupMinutes))
      : existing.warmupMinutes;
    const mainMinutes = isValidNumberInRange(Number(body.mainMinutes), 5, 60)
      ? Math.round(Number(body.mainMinutes))
      : existing.mainMinutes;
    const cooldownMinutes = isValidNumberInRange(Number(body.cooldownMinutes), 0, 30)
      ? Math.round(Number(body.cooldownMinutes))
      : existing.cooldownMinutes;
    const rounds = isValidNumberInRange(Number(body.rounds), 1, 6)
      ? Math.round(Number(body.rounds))
      : existing.rounds;
    const defaultWorkSeconds = isValidNumberInRange(Number(body.defaultWorkSeconds), 10, 600)
      ? Math.round(Number(body.defaultWorkSeconds))
      : existing.defaultWorkSeconds;
    const defaultRestSeconds = isValidNumberInRange(Number(body.defaultRestSeconds), 0, 180)
      ? Math.round(Number(body.defaultRestSeconds))
      : existing.defaultRestSeconds;
    const progressionNote =
      typeof body.progressionNote === 'string'
        ? body.progressionNote.trim().slice(0, 300)
        : existing.progressionNote;

    let exercises: RoutineExerciseItem[] = existing.exercises;
    if (Array.isArray(body.exercises)) {
      exercises = body.exercises
        .filter((item: unknown) => item && typeof item === 'object')
        .slice(0, 20)
        .map((item: Record<string, unknown>, idx: number) => ({
          id: typeof item.id === 'string' && item.id ? item.id : `item-${idx + 1}`,
          exerciseId:
            typeof item.exerciseId === 'string' && item.exerciseId
              ? item.exerciseId
              : 'sentadilla-corta-asistida',
          name:
            typeof item.name === 'string' && item.name.trim()
              ? item.name.trim().slice(0, 90)
              : 'Ejercicio',
          workSeconds: isValidNumberInRange(Number(item.workSeconds), 10, 600)
            ? Math.round(Number(item.workSeconds))
            : defaultWorkSeconds,
          restSeconds: isValidNumberInRange(Number(item.restSeconds), 0, 180)
            ? Math.round(Number(item.restSeconds))
            : defaultRestSeconds,
          notes: typeof item.notes === 'string' ? item.notes.trim().slice(0, 120) : undefined,
        }));
    }

    const updated: Routine = {
      ...existing,
      title,
      subtitle,
      isRestDay,
      warmupMinutes,
      mainMinutes,
      cooldownMinutes,
      rounds,
      defaultWorkSeconds,
      defaultRestSeconds,
      progressionNote,
      exercises,
    };

    const saved = repo.saveRoutine(req.user!.id, updated);
    res.json({ routine: saved });
  });

  router.post('/routines/reset', requireAuth, (req: AuthedRequest, res) => {
    const routines = repo.resetRoutines(req.user!.id);
    res.json({ routines });
  });

  router.get('/exercises', requireAuth, (req: AuthedRequest, res) => {
    const overrides = repo.getExerciseVideoOverrides(req.user!.id);
    const exercises = DEFAULT_EXERCISES.map((ex) => ({
      ...ex,
      customVideoUrl: overrides[ex.id] ?? null,
    }));
    res.json({ exercises });
  });

  router.put('/exercises/:id/video', requireAuth, (req: AuthedRequest, res) => {
    const exerciseId = String(req.params.id);
    const exists = DEFAULT_EXERCISES.some((ex) => ex.id === exerciseId);
    if (!exists) {
      res.status(404).json({ error: 'Ejercicio no encontrado.' });
      return;
    }
    try {
      const videoUrl = sanitizeVideoUrl(req.body?.videoUrl);
      repo.setExerciseVideoOverride(req.user!.id, exerciseId, videoUrl);
      res.json({ exerciseId, customVideoUrl: videoUrl });
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'URL de video no válida.',
      });
    }
  });

  router.get('/sessions', requireAuth, (req: AuthedRequest, res) => {
    const sessions = repo.getWorkoutSessions(req.user!.id);
    const summary = computeTrainingProfile(sessions, req.user!);
    res.json({ sessions, summary });
  });

  router.post('/sessions', requireAuth, (req: AuthedRequest, res) => {
    const body = req.body ?? {};
    const durationSeconds = Number(body.durationSeconds);
    const exercisesCompleted = Number(body.exercisesCompleted);
    const roundsCompleted = Number(body.roundsCompleted);
    const preEnergy = Number(body.preEnergy ?? 3);
    const preKneePain = Number(body.preKneePain ?? 0);
    const preBackPain = Number(body.preBackPain ?? 0);
    const rpe = Number(body.rpe);
    const postKneePain = Number(body.postKneePain);
    const postBackPain = Number(body.postBackPain);

    if (
      !isValidNumberInRange(durationSeconds, 1, 14400) ||
      !isValidNumberInRange(exercisesCompleted, 0, 200) ||
      !isValidNumberInRange(roundsCompleted, 0, 20) ||
      !isValidNumberInRange(preEnergy, 1, 5) ||
      !isValidNumberInRange(preKneePain, 0, 10) ||
      !isValidNumberInRange(preBackPain, 0, 10) ||
      !isValidNumberInRange(rpe, 1, 10) ||
      !isValidNumberInRange(postKneePain, 0, 10) ||
      !isValidNumberInRange(postBackPain, 0, 10)
    ) {
      res.status(400).json({ error: 'Valores numéricos fuera de rango en el registro de sesión.' });
      return;
    }

    const routineId = typeof body.routineId === 'string' ? body.routineId.slice(0, 80) : 'personal';
    const routineTitle =
      typeof body.routineTitle === 'string' && body.routineTitle.trim()
        ? body.routineTitle.trim().slice(0, 100)
        : 'Entrenamiento personal';
    const routineFocus =
      typeof body.routineFocus === 'string' ? body.routineFocus.slice(0, 40) : 'fuerza';

    const startedAt =
      typeof body.startedAt === 'string' && !Number.isNaN(Date.parse(body.startedAt))
        ? body.startedAt
        : new Date(Date.now() - durationSeconds * 1000).toISOString();
    const completedAt =
      typeof body.completedAt === 'string' && !Number.isNaN(Date.parse(body.completedAt))
        ? body.completedAt
        : new Date().toISOString();

    const recommendation = evaluatePostWorkoutRecommendation({
      rpe,
      preKneePain,
      preBackPain,
      postKneePain,
      postBackPain,
    });

    const created = repo.createWorkoutSession(req.user!.id, {
      routineId,
      routineTitle,
      routineFocus,
      startedAt,
      completedAt,
      durationSeconds: Math.round(durationSeconds),
      exercisesCompleted: Math.round(exercisesCompleted),
      roundsCompleted: Math.round(roundsCompleted),
      preEnergy: Math.round(preEnergy),
      preKneePain: Math.round(preKneePain),
      preBackPain: Math.round(preBackPain),
      rpe: Math.round(rpe),
      postKneePain: Math.round(postKneePain),
      postBackPain: Math.round(postBackPain),
      note: typeof body.note === 'string' ? body.note.trim().slice(0, 500) : '',
      recommendation,
    });

    const sessions = repo.getWorkoutSessions(req.user!.id);
    const summary = computeTrainingProfile(sessions, req.user!);
    res.status(201).json({ session: created, summary });
  });

  router.get('/weights', requireAuth, (req: AuthedRequest, res) => {
    const weights = repo.getWeightLogs(req.user!.id);
    res.json({ weights });
  });

  router.post('/weights', requireAuth, (req: AuthedRequest, res) => {
    const weightKg = Number(req.body?.weightKg);
    if (!isValidNumberInRange(weightKg, 30, 300)) {
      res.status(400).json({ error: 'El peso debe estar entre 30 y 300 kg.' });
      return;
    }
    const recordedAt =
      typeof req.body?.recordedAt === 'string' && !Number.isNaN(Date.parse(req.body.recordedAt))
        ? req.body.recordedAt
        : new Date().toISOString();
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 200) : '';
    const log = repo.createWeightLog(req.user!.id, {
      weightKg: Math.round(weightKg * 10) / 10,
      recordedAt,
      note,
    });
    res.status(201).json({ weight: log });
  });

  router.delete('/weights/:id', requireAuth, (req: AuthedRequest, res) => {
    repo.deleteWeightLog(req.user!.id, String(req.params.id));
    res.json({ ok: true });
  });

  router.get('/account/export', requireAuth, (req: AuthedRequest, res) => {
    const payload = repo.exportAllUserData(req.user!.id);
    if (!payload) {
      res.status(404).json({ error: 'No se encontraron datos para exportar.' });
      return;
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="mi-entrenamiento-respaldo-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    res.send(JSON.stringify(payload, null, 2));
  });

  router.delete('/account', requireAuth, (req: AuthedRequest, res) => {
    repo.deleteUserAndData(req.user!.id);
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  router.post('/ai/advise', requireAuth, async (req: AuthedRequest, res) => {
    if (process.env.AI_ENABLED !== 'true') {
      res.status(403).json({
        error: 'La integración opcional con IA está desactivada en el servidor (AI_ENABLED=false).',
      });
      return;
    }
    if (!req.user!.aiConsent) {
      res.status(403).json({
        error: 'Debes otorgar consentimiento explícito en tu perfil o en el aviso previo antes de usar la IA.',
      });
      return;
    }

    const question = typeof req.body?.question === 'string' ? req.body.question.trim() : '';
    if (question.length < 3 || question.length > 500) {
      res.status(400).json({ error: 'Escribe una consulta breve (entre 3 y 500 caracteres).' });
      return;
    }

    const routineId = typeof req.body?.routineId === 'string' ? req.body.routineId : null;
    const routines = repo.getRoutinesByUser(req.user!.id);
    const currentRoutine = routineId
      ? routines.find((r) => r.id === routineId) ?? null
      : routines[0] ?? null;
    const recentSessions = repo.getWorkoutSessions(req.user!.id);
    const summary = computeTrainingProfile(recentSessions, req.user!);

    try {
      const advice = await requestConservativeAiAdvice({
        question,
        profile: req.user!,
        summary,
        currentRoutine,
        recentSessions,
        hasRedFlagsReported: Boolean(req.body?.hasRedFlagsReported),
      });
      // Do NOT save conversation text by default
      res.json({ advice, stored: false });
    } catch (err) {
      const code = err instanceof Error ? err.message : 'AI_ERROR';
      if (code === 'GEMINI_KEY_MISSING') {
        res.status(503).json({
          error: 'No hay una clave GEMINI_API_KEY configurada en el servidor.',
        });
        return;
      }
      res.status(502).json({
        error: 'No fue posible obtener orientación de la IA en este momento. Usa las reglas conservadoras locales.',
      });
    }
  });

  return router;
}
