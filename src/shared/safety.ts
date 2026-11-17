import type {
  DayStatus,
  PreCheckInput,
  SafetyEvaluation,
  TrainingProfileSummary,
  UserProfile,
  WorkoutSession,
} from './types.ts';

export const MEDICAL_DISCLAIMER =
  'Orientación de entrenamiento, no consejo médico. No diagnostica ni sustituye la valoración de un médico o fisioterapeuta.';

export function hasRedFlags(flags: PreCheckInput['redFlags']): boolean {
  return Boolean(
    flags.severePain ||
      flags.swollenHotKnee ||
      flags.cannotBearWeight ||
      flags.kneeLocking ||
      flags.significantWeakness ||
      flags.numbness ||
      flags.bladderBowelLoss,
  );
}

export function evaluatePreWorkoutSafety(input: PreCheckInput): SafetyEvaluation {
  if (hasRedFlags(input.redFlags)) {
    const activeFlags: string[] = [];
    if (input.redFlags.severePain) activeFlags.push('dolor intenso');
    if (input.redFlags.swollenHotKnee) activeFlags.push('rodilla inflamada o caliente');
    if (input.redFlags.cannotBearWeight) activeFlags.push('incapacidad de apoyar peso');
    if (input.redFlags.kneeLocking) activeFlags.push('bloqueo de rodilla');
    if (input.redFlags.significantWeakness) activeFlags.push('debilidad importante');
    if (input.redFlags.numbness) activeFlags.push('entumecimiento');
    if (input.redFlags.bladderBowelLoss) activeFlags.push('pérdida de control de vejiga o intestino');

    return {
      status: 'pausa',
      blocked: true,
      allowRecommendWorkout: false,
      headline: 'Busca atención médica profesional',
      guidance:
        'Has marcado señales de alerta que requieren valoración clínica antes de hacer ejercicio. No se recomienda entrenar hoy.',
      reasons: activeFlags,
      suggestMobilityOnly: false,
    };
  }

  const maxPain = Math.max(input.kneePain, input.backPain);
  const reasons: string[] = [];

  if (input.kneePain > 3) {
    reasons.push(`Dolor de rodillas reportado (${input.kneePain}/10, superior a 3/10)`);
  }
  if (input.backPain > 3) {
    reasons.push(`Dolor de espalda reportado (${input.backPain}/10, superior a 3/10)`);
  }
  if (input.energy <= 2) {
    reasons.push(`Energía baja (${input.energy}/5)`);
  }

  if (maxPain > 3) {
    return {
      status: 'recuperacion',
      blocked: false,
      allowRecommendWorkout: true,
      headline: 'Recuperación recomendada',
      guidance:
        'El dolor supera 3/10. Te sugerimos reducir la carga, cambiar a una sesión suave de movilidad o elegir descanso activo hoy.',
      reasons,
      suggestMobilityOnly: true,
    };
  }

  if (input.energy <= 2 || maxPain === 3) {
    return {
      status: 'recuperacion',
      blocked: false,
      allowRecommendWorkout: true,
      headline: 'Ritmo suave recomendado',
      guidance:
        'Tu energía está baja o hay molestia moderada (3/10). Considera hacer menos rondas, más descanso o movilidad suave.',
      reasons: reasons.length > 0 ? reasons : ['Molestia leve (3/10) o baja energía'],
      suggestMobilityOnly: true,
    };
  }

  return {
    status: 'listo',
    blocked: false,
    allowRecommendWorkout: true,
    headline: 'Listo para entrenar',
    guidance:
      'Tus valores iniciales están en rango cómodo. Mantén una técnica controlada y detente si el dolor sube por encima de 3/10.',
    reasons: [],
    suggestMobilityOnly: false,
  };
}

export function evaluatePostWorkoutRecommendation(params: {
  rpe: number;
  preKneePain: number;
  preBackPain: number;
  postKneePain: number;
  postBackPain: number;
}): string {
  const maxPostPain = Math.max(params.postKneePain, params.postBackPain);
  const kneeIncreased = params.postKneePain > params.preKneePain;
  const backIncreased = params.postBackPain > params.preBackPain;

  if (maxPostPain > 3 || kneeIncreased || backIncreased) {
    return 'El dolor superó 3/10 o aumentó durante la sesión. En la próxima sesión reduce una ronda, prioriza movilidad suave o descansa. Si empeora mañana, pausa y consulta a un profesional.';
  }

  if (params.rpe >= 8) {
    return 'Esfuerzo percibido alto. Mantén 2 rondas o añade 10 segundos extra de descanso en tu próxima sesión de fuerza.';
  }

  if (params.rpe <= 4 && maxPostPain <= 1) {
    return 'Buena tolerancia y esfuerzo suave. Puedes repetir este formato en tu siguiente sesión y mantener la constancia semanal.';
  }

  return 'Sesión bien tolerada. Mantén el mismo volumen y revisa cómo amanecen tus rodillas y espalda mañana antes de progresar.';
}

export function computeInformationalBmi(
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
): number | null {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  if (!Number.isFinite(bmi)) return null;
  return Math.round(bmi * 10) / 10;
}

function getIsoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export function computeWeeklyStreak(sessions: WorkoutSession[], now = new Date()): number {
  if (sessions.length === 0) return 0;
  const weekSet = new Set(sessions.map((s) => getIsoWeekKey(new Date(s.completedAt))));
  let streak = 0;
  const cursor = new Date(now);

  // If current week has no session yet, allow streak starting from last week
  if (!weekSet.has(getIsoWeekKey(cursor))) {
    cursor.setDate(cursor.getDate() - 7);
  }

  while (weekSet.has(getIsoWeekKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return streak;
}

export function computeTrainingProfile(
  sessions: WorkoutSession[],
  profile: Pick<UserProfile, 'weightKg' | 'heightCm'>,
  now = new Date(),
): TrainingProfileSummary {
  const bmi = computeInformationalBmi(profile.weightKg, profile.heightCm);
  const currentWeekKey = getIsoWeekKey(now);
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );

  const thisWeek = sorted.filter((s) => getIsoWeekKey(new Date(s.completedAt)) === currentWeekKey);
  const weeklySessions = thisWeek.length;
  const weeklyMinutes = Math.round(
    thisWeek.reduce((acc, s) => acc + s.durationSeconds, 0) / 60,
  );
  const weeklyStreak = computeWeeklyStreak(sorted, now);

  const recent = sorted.slice(0, 6);
  const avgEffort =
    recent.length > 0
      ? Math.round((recent.reduce((acc, s) => acc + s.rpe, 0) / recent.length) * 10) / 10
      : null;
  const avgPostKneePain =
    recent.length > 0
      ? Math.round(
          (recent.reduce((acc, s) => acc + s.postKneePain, 0) / recent.length) * 10,
        ) / 10
      : null;
  const avgPostBackPain =
    recent.length > 0
      ? Math.round(
          (recent.reduce((acc, s) => acc + s.postBackPain, 0) / recent.length) * 10,
        ) / 10
      : null;

  const latest = sorted[0];
  const prev = sorted[1];

  let dayStatusSuggestion: DayStatus = 'listo';
  let toleranceLabel = 'Sin registros recientes';
  let conservativeNarrative =
    'Completa tu primera sesión para evaluar tolerancia, esfuerzo y molestias de forma progresiva.';

  if (latest) {
    const latestMaxPain = Math.max(latest.postKneePain, latest.postBackPain);
    const prevMaxPain = prev ? Math.max(prev.postKneePain, prev.postBackPain) : 0;
    const painRose =
      latestMaxPain > 3 ||
      (prev && latestMaxPain > prevMaxPain) ||
      latest.postKneePain > latest.preKneePain ||
      latest.postBackPain > latest.preBackPain;

    if (latestMaxPain > 5) {
      dayStatusSuggestion = 'pausa';
      toleranceLabel = 'Requiere pausa o revisión';
      conservativeNarrative = `Has completado ${weeklySessions} ${weeklySessions === 1 ? 'sesión' : 'sesiones'} esta semana. La última molestia reportada fue elevada (${latestMaxPain}/10); prioriza descanso y consulta profesional si persiste.`;
    } else if (painRose || latest.rpe >= 8) {
      dayStatusSuggestion = 'recuperacion';
      toleranceLabel = 'Tolerancia ajustada (bajar carga)';
      conservativeNarrative = `Has completado ${weeklySessions} ${weeklySessions === 1 ? 'sesión' : 'sesiones'} esta semana. El dolor o esfuerzo reportado aumentó; considera reducir intensidad o elegir movilidad suave.`;
    } else {
      dayStatusSuggestion = 'listo';
      toleranceLabel = 'Buena tolerancia reciente';
      conservativeNarrative = `Has completado ${weeklySessions} ${weeklySessions === 1 ? 'sesión' : 'sesiones'} esta semana con molestias estables y esfuerzo controlado.`;
    }
  }

  let adherenceLabel = 'Inicio gradual';
  if (weeklySessions >= 4) adherenceLabel = 'Constancia alta esta semana';
  else if (weeklySessions >= 2) adherenceLabel = 'Buen ritmo semanal';
  else if (weeklySessions === 1) adherenceLabel = 'Primera sesión de la semana';

  return {
    bmi,
    bmiNote:
      'Dato orientativo de referencia poblacional; no evalúa composición corporal ni constituye un diagnóstico médico.',
    weeklySessions,
    weeklyMinutes,
    weeklyStreak,
    totalSessions: sessions.length,
    avgEffort,
    avgPostKneePain,
    avgPostBackPain,
    toleranceLabel,
    adherenceLabel,
    conservativeNarrative,
    dayStatusSuggestion,
  };
}
