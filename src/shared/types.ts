export type FitnessLevel = 'reinicio' | 'principiante' | 'intermedio';

export type GoalType = 'movilidad' | 'fuerza_suave' | 'volver_a_entrenar' | 'bienestar';

export type SensitiveZone = 'rodillas' | 'espalda' | 'hombros' | 'otra';

export type ExerciseZone =
  | 'piernas'
  | 'cadera'
  | 'espalda'
  | 'tronco'
  | 'movilidad'
  | 'cuerpo_completo';

export type DayStatus = 'listo' | 'recuperacion' | 'pausa';

export type TimerPhase =
  | 'preparacion'
  | 'trabajo'
  | 'descanso'
  | 'pausa'
  | 'finalizado';

export interface UserProfile {
  id: number;
  email: string;
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
  isDemo: boolean;
  createdAt: string;
}

export interface Exercise {
  id: string;
  name: string;
  zone: ExerciseZone;
  illustrationKey: string;
  altText: string;
  objective: string;
  instructions: string[];
  breathing: string;
  commonMistakes: string[];
  regression: string;
  whenToStop: string;
  defaultDurationSec: number;
  bilateral: boolean;
  customVideoUrl: string | null;
}

export interface RoutineExerciseItem {
  id: string;
  exerciseId: string;
  name: string;
  workSeconds: number;
  restSeconds: number;
  notes?: string;
}

export interface Routine {
  id: string;
  dayOfWeek: number; // 1 = Lunes ... 7 = Domingo
  dayName: string;
  title: string;
  subtitle: string;
  focus: 'fuerza' | 'movilidad' | 'recuperacion' | 'circuito' | 'descanso';
  isRestDay: boolean;
  warmupMinutes: number;
  mainMinutes: number;
  cooldownMinutes: number;
  rounds: number;
  defaultWorkSeconds: number;
  defaultRestSeconds: number;
  progressionNote: string;
  exercises: RoutineExerciseItem[];
}

export interface PreCheckInput {
  energy: number; // 1..5
  kneePain: number; // 0..10
  backPain: number; // 0..10
  note?: string;
  redFlags: {
    severePain: boolean;
    swollenHotKnee: boolean;
    cannotBearWeight: boolean;
    kneeLocking: boolean;
    significantWeakness: boolean;
    numbness: boolean;
    bladderBowelLoss: boolean;
  };
}

export interface SafetyEvaluation {
  status: DayStatus;
  blocked: boolean;
  allowRecommendWorkout: boolean;
  headline: string;
  guidance: string;
  reasons: string[];
  suggestMobilityOnly: boolean;
}

export interface WorkoutSession {
  id: string;
  routineId: string;
  routineTitle: string;
  routineFocus: string;
  startedAt: string;
  completedAt: string;
  durationSeconds: number;
  exercisesCompleted: number;
  roundsCompleted: number;
  preEnergy: number;
  preKneePain: number;
  preBackPain: number;
  rpe: number; // 1..10
  postKneePain: number; // 0..10
  postBackPain: number; // 0..10
  note: string;
  recommendation: string;
}

export interface WeightLog {
  id: string;
  recordedAt: string;
  weightKg: number;
  note: string;
}

export interface TimerConfig {
  prepSeconds: number;
  warmupSeconds: number;
  workSeconds: number;
  restSeconds: number;
  rounds: number;
  includeWarmupPhase: boolean;
}

export interface TimerSessionState {
  routineId: string;
  routineTitle: string;
  status: TimerPhase;
  phaseBeforePause: Exclude<TimerPhase, 'pausa' | 'finalizado'> | null;
  isWarmupStep: boolean;
  currentRound: number;
  totalRounds: number;
  currentExerciseIndex: number;
  exercises: RoutineExerciseItem[];
  config: TimerConfig;
  phaseStartedAtMs: number;
  phaseDurationMs: number;
  pausedRemainingMs: number;
  workoutStartedAtMs: number;
  accumulatedPauseMs: number;
  pauseStartedAtMs: number | null;
  exercisesCompletedCount: number;
  roundsCompletedCount: number;
}

export interface AiRecommendationResponse {
  recommendationType:
    | 'mantener'
    | 'reducir_ronda'
    | 'aumentar_descanso'
    | 'elegir_movilidad'
    | 'consulta_profesional';
  summary: string;
  rationale: string;
  suggestedAdjustments: string[];
  safetyNote: string;
  medicalDisclaimer: string;
}

export interface TrainingProfileSummary {
  bmi: number | null;
  bmiNote: string;
  weeklySessions: number;
  weeklyMinutes: number;
  weeklyStreak: number;
  totalSessions: number;
  avgEffort: number | null;
  avgPostKneePain: number | null;
  avgPostBackPain: number | null;
  toleranceLabel: string;
  adherenceLabel: string;
  conservativeNarrative: string;
  dayStatusSuggestion: DayStatus;
}
