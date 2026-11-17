import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  advanceTimerByTimestamp,
  buildInitialTimerState,
  finishTimerEarlyState,
  getActiveElapsedSeconds,
  pauseTimerState,
  resumeTimerState,
  skipExerciseTimerState,
} from '../shared/timer.ts';
import { evaluatePostWorkoutRecommendation } from '../shared/safety.ts';
import type {
  Exercise,
  PreCheckInput,
  Routine,
  TimerConfig,
  TimerSessionState,
  WorkoutSession,
} from '../shared/types.ts';
import { playCueSound, triggerCueVibration } from '../utils/feedback.ts';
import { ExerciseIllustration } from './ExerciseIllustration.tsx';

interface Props {
  routine: Routine;
  exercisesCatalog: Exercise[];
  preCheck: PreCheckInput;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleMute: () => void;
  onSaveCompletedSession: (payload: Omit<WorkoutSession, 'id'>) => Promise<WorkoutSession>;
  onExit: () => void;
}

const ACTIVE_TIMER_STORAGE_KEY = 'me_active_timer_v1';

const PHASE_LABELS: Record<TimerSessionState['status'], string> = {
  preparacion: 'Preparación',
  trabajo: 'Trabajo',
  descanso: 'Descanso',
  pausa: 'En pausa',
  finalizado: 'Finalizado',
};

function formatSeconds(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
}

export const WorkoutTimerView: React.FC<Props> = ({
  routine,
  exercisesCatalog,
  preCheck,
  soundEnabled,
  vibrationEnabled,
  onToggleMute,
  onSaveCompletedSession,
  onExit,
}) => {
  const [timerConfig, setTimerConfig] = useState<Partial<TimerConfig>>({
    prepSeconds: 5,
    workSeconds: routine.defaultWorkSeconds,
    restSeconds: routine.defaultRestSeconds,
    rounds: routine.rounds,
    includeWarmupPhase: false,
    warmupSeconds: routine.warmupMinutes * 60,
  });

  const [timerState, setTimerState] = useState<TimerSessionState>(() => {
    try {
      const savedRaw = localStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
      if (savedRaw) {
        const parsed = JSON.parse(savedRaw) as TimerSessionState;
        if (parsed.routineId === routine.id && parsed.status !== 'finalizado') {
          return advanceTimerByTimestamp(parsed, Date.now()).state;
        }
      }
    } catch {
      // ignore invalid storage
    }
    return buildInitialTimerState(routine, timerConfig, Date.now());
  });

  const [remainingMs, setRemainingMs] = useState<number>(() => {
    return advanceTimerByTimestamp(timerState, Date.now()).remainingMs;
  });

  const [showSettings, setShowSettings] = useState(false);
  const [rpe, setRpe] = useState(5);
  const [postKneePain, setPostKneePain] = useState(preCheck.kneePain);
  const [postBackPain, setPostBackPain] = useState(preCheck.backPain);
  const [postNote, setPostNote] = useState('');
  const [savingPost, setSavingPost] = useState(false);
  const [savedSummary, setSavedSummary] = useState<WorkoutSession | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const prevStatusRef = useRef(timerState.status);

  // Sync timer state using real timestamps every 200ms and on visibility/focus changes
  useEffect(() => {
    const syncNow = () => {
      const now = Date.now();
      setTimerState((prev) => {
        const res = advanceTimerByTimestamp(prev, now);
        setRemainingMs(res.remainingMs);
        return res.state;
      });
    };

    syncNow();
    const interval = window.setInterval(syncNow, 200);
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', syncNow);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', syncNow);
    };
  }, []);

  // Persist active timer snapshot for Safari background/reload recovery
  useEffect(() => {
    try {
      if (timerState.status === 'finalizado') {
        localStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
      } else {
        localStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(timerState));
      }
    } catch {
      // ignore
    }
  }, [timerState]);

  // Sound & vibration cues on phase transitions
  useEffect(() => {
    const prev = prevStatusRef.current;
    const curr = timerState.status;
    if (prev !== curr) {
      prevStatusRef.current = curr;
      if (curr === 'trabajo') {
        playCueSound('work', soundEnabled);
        triggerCueVibration('work', vibrationEnabled);
      } else if (curr === 'descanso') {
        playCueSound('rest', soundEnabled);
        triggerCueVibration('rest', vibrationEnabled);
      } else if (curr === 'finalizado') {
        playCueSound('finish', soundEnabled);
        triggerCueVibration('finish', vibrationEnabled);
      }
    }
  }, [timerState.status, soundEnabled, vibrationEnabled]);

  const currentExerciseItem = timerState.exercises[timerState.currentExerciseIndex];
  const nextExerciseItem =
    timerState.currentExerciseIndex + 1 < timerState.exercises.length
      ? timerState.exercises[timerState.currentExerciseIndex + 1]
      : timerState.currentRound < timerState.totalRounds
        ? timerState.exercises[0]
        : null;

  const catalogExercise = useMemo(() => {
    if (!currentExerciseItem) return null;
    return exercisesCatalog.find((e) => e.id === currentExerciseItem.exerciseId) ?? null;
  }, [currentExerciseItem, exercisesCatalog]);

  const totalPhaseMs = Math.max(1000, timerState.phaseDurationMs || 1000);
  const progressRatio =
    timerState.status === 'finalizado'
      ? 1
      : Math.max(0, Math.min(1, 1 - remainingMs / totalPhaseMs));

  const radius = 104;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const handlePauseOrResume = () => {
    const now = Date.now();
    if (timerState.status === 'pausa') {
      const resumed = resumeTimerState(timerState, now);
      setTimerState(resumed);
      setRemainingMs(advanceTimerByTimestamp(resumed, now).remainingMs);
    } else if (timerState.status !== 'finalizado') {
      const paused = pauseTimerState(timerState, now);
      setTimerState(paused);
      setRemainingMs(paused.pausedRemainingMs);
    }
  };

  const handleReset = () => {
    const now = Date.now();
    const fresh = buildInitialTimerState(routine, timerConfig, now);
    setTimerState(fresh);
    setRemainingMs(fresh.phaseDurationMs);
  };

  const handleSkip = () => {
    const now = Date.now();
    const skipped = skipExerciseTimerState(timerState, now);
    setTimerState(skipped);
    setRemainingMs(advanceTimerByTimestamp(skipped, now).remainingMs);
  };

  const handleFinishEarly = () => {
    const now = Date.now();
    const ended = finishTimerEarlyState(timerState, now);
    setTimerState(ended);
    setRemainingMs(0);
  };

  const handleApplyTimerSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    const fresh = buildInitialTimerState(routine, timerConfig, now);
    setTimerState(fresh);
    setRemainingMs(fresh.phaseDurationMs);
    setShowSettings(false);
  };

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPost(true);
    setSaveError(null);
    const nowMs = Date.now();
    const elapsedSec = getActiveElapsedSeconds(timerState, nowMs);
    const recommendation = evaluatePostWorkoutRecommendation({
      rpe,
      preKneePain: preCheck.kneePain,
      preBackPain: preCheck.backPain,
      postKneePain,
      postBackPain,
    });

    const payload: Omit<WorkoutSession, 'id'> = {
      routineId: routine.id,
      routineTitle: routine.title,
      routineFocus: routine.focus,
      startedAt: new Date(timerState.workoutStartedAtMs).toISOString(),
      completedAt: new Date(nowMs).toISOString(),
      durationSeconds: elapsedSec,
      exercisesCompleted: timerState.exercisesCompletedCount,
      roundsCompleted: Math.max(1, timerState.roundsCompletedCount || timerState.currentRound),
      preEnergy: preCheck.energy,
      preKneePain: preCheck.kneePain,
      preBackPain: preCheck.backPain,
      rpe,
      postKneePain,
      postBackPain,
      note: postNote.trim(),
      recommendation,
    };

    try {
      const saved = await onSaveCompletedSession(payload);
      setSavedSummary(saved);
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'No se pudo guardar en línea; guardado localmente.',
      );
      setSavedSummary({ id: 'local-pending', ...payload });
    } finally {
      setSavingPost(false);
    }
  };

  if (savedSummary) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 sm:p-8 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#1E4D3B]/10 dark:bg-[#6EE7B7]/15 text-[#1E4D3B] dark:text-[#6EE7B7] flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
            Sesión registrada
          </h1>
          <p className="mt-1 text-sm text-[#5B6860] dark:text-[#98A89F]">
            {savedSummary.routineTitle}
          </p>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
              <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Duración</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular">
                {Math.max(1, Math.round(savedSummary.durationSeconds / 60))} min
              </div>
            </div>
            <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
              <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Ejercicios</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular">
                {savedSummary.exercisesCompleted}
              </div>
            </div>
            <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
              <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Rondas</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular">
                {savedSummary.roundsCompleted}
              </div>
            </div>
            <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
              <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Esfuerzo</div>
              <div className="mt-1 text-lg font-bold font-mono-tabular">
                {savedSummary.rpe} / 10
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-[#CFE0D5] dark:border-[#2A4236] bg-[#EEF5F0] dark:bg-[#172821] p-4">
            <div className="text-xs font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
              Recomendación para tu próxima sesión
            </div>
            <p className="mt-1 text-sm text-[#173A2C] dark:text-[#D5DFD9] leading-relaxed">
              {savedSummary.recommendation}
            </p>
          </div>

          {saveError && (
            <p className="mt-3 text-xs text-amber-700 dark:text-amber-300">{saveError}</p>
          )}

          <button
            type="button"
            onClick={onExit}
            className="mt-6 w-full min-h-[48px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base"
          >
            Volver al resumen de Hoy
          </button>
        </div>
      </div>
    );
  }

  if (timerState.status === 'finalizado') {
    return (
      <div className="max-w-xl mx-auto px-4 py-6 pb-24">
        <div className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 sm:p-8 shadow-xs">
          <p className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7]">
            Sesión finalizada
          </p>
          <h1 className="mt-1 text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
            ¿Cómo respondió tu cuerpo?
          </h1>
          <p className="mt-1 text-sm text-[#5B6860] dark:text-[#98A89F]">
            Registra esfuerzo y molestias para ajustar con prudencia tu próxima sesión.
          </p>

          <form onSubmit={handlePostSubmit} className="mt-6 space-y-5">
            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <label htmlFor="post-rpe">Esfuerzo percibido (1 = muy suave, 10 = máximo)</label>
                <span className="font-mono-tabular font-semibold">{rpe} / 10</span>
              </div>
              <input
                id="post-rpe"
                type="range"
                min={1}
                max={10}
                value={rpe}
                onChange={(e) => setRpe(Number(e.target.value))}
                className="w-full h-10 accent-[#1E4D3B]"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <label htmlFor="post-knee">Dolor de rodillas al terminar</label>
                <span className="font-mono-tabular font-semibold">{postKneePain} / 10</span>
              </div>
              <input
                id="post-knee"
                type="range"
                min={0}
                max={10}
                value={postKneePain}
                onChange={(e) => setPostKneePain(Number(e.target.value))}
                className="w-full h-10 accent-[#1E4D3B]"
              />
            </div>

            <div>
              <div className="flex justify-between text-sm font-medium mb-1.5">
                <label htmlFor="post-back">Dolor de espalda al terminar</label>
                <span className="font-mono-tabular font-semibold">{postBackPain} / 10</span>
              </div>
              <input
                id="post-back"
                type="range"
                min={0}
                max={10}
                value={postBackPain}
                onChange={(e) => setPostBackPain(Number(e.target.value))}
                className="w-full h-10 accent-[#1E4D3B]"
              />
            </div>

            <div>
              <label htmlFor="post-note" className="block text-sm font-medium mb-1.5">
                Nota opcional de la sesión
              </label>
              <textarea
                id="post-note"
                rows={2}
                value={postNote}
                onChange={(e) => setPostNote(e.target.value)}
                placeholder="Ej. Cómodo en el puente, mantuve rango corto en sentadilla."
                className="w-full rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] p-3 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={savingPost}
              className="w-full min-h-[50px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base"
            >
              {savingPost ? 'Guardando…' : 'Guardar y ver resumen'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const activePhase = timerState.status;
  const activeColorClass =
    activePhase === 'trabajo'
      ? 'stroke-[#1E4D3B] dark:stroke-[#6EE7B7]'
      : activePhase === 'descanso'
        ? 'stroke-[#0F766E] dark:stroke-[#5EEAD4]'
        : activePhase === 'preparacion'
          ? 'stroke-[#B45309] dark:stroke-[#FBBF24]'
          : 'stroke-[#64736A]';

  return (
    <div className="max-w-4xl mx-auto px-4 py-4 pb-28">
      {/* Timer Top Controls */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">{routine.title}</p>
          <p className="text-sm font-semibold tabular-nums">
            Ronda {timerState.currentRound} de {timerState.totalRounds} · Ejercicio{' '}
            {Math.min(timerState.currentExerciseIndex + 1, timerState.exercises.length)} de{' '}
            {timerState.exercises.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={soundEnabled ? 'Silenciar avisos' : 'Activar avisos sonoros'}
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] flex items-center gap-1.5 text-xs font-medium"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden sm:inline">{soundEnabled ? 'Silenciar' : 'Silenciado'}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            aria-label="Configurar tiempos del temporizador"
            className="min-h-[44px] min-w-[44px] px-3 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] flex items-center gap-1.5 text-xs font-medium"
          >
            <Settings2 className="w-4 h-4" />
            <span className="hidden sm:inline">Tiempos</span>
          </button>
        </div>
      </div>

      {showSettings && (
        <form
          onSubmit={handleApplyTimerSettings}
          className="mt-4 rounded-2xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4 space-y-3"
        >
          <div className="text-sm font-semibold">Ajustar temporizador de esta sesión</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="cfg-work" className="block text-xs text-[#5B6860] dark:text-[#98A89F] mb-1">
                Trabajo (seg)
              </label>
              <input
                id="cfg-work"
                type="number"
                min={10}
                max={600}
                value={timerConfig.workSeconds ?? 40}
                onChange={(e) =>
                  setTimerConfig((c) => ({ ...c, workSeconds: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="cfg-rest" className="block text-xs text-[#5B6860] dark:text-[#98A89F] mb-1">
                Descanso (seg)
              </label>
              <input
                id="cfg-rest"
                type="number"
                min={0}
                max={180}
                value={timerConfig.restSeconds ?? 20}
                onChange={(e) =>
                  setTimerConfig((c) => ({ ...c, restSeconds: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="cfg-rounds" className="block text-xs text-[#5B6860] dark:text-[#98A89F] mb-1">
                Rondas
              </label>
              <input
                id="cfg-rounds"
                type="number"
                min={1}
                max={6}
                value={timerConfig.rounds ?? 2}
                onChange={(e) => setTimerConfig((c) => ({ ...c, rounds: Number(e.target.value) }))}
                className="w-full min-h-[42px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="cfg-prep" className="block text-xs text-[#5B6860] dark:text-[#98A89F] mb-1">
                Preparación (seg)
              </label>
              <input
                id="cfg-prep"
                type="number"
                min={3}
                max={30}
                value={timerConfig.prepSeconds ?? 5}
                onChange={(e) =>
                  setTimerConfig((c) => ({ ...c, prepSeconds: Number(e.target.value) }))
                }
                className="w-full min-h-[42px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
              />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={Boolean(timerConfig.includeWarmupPhase)}
              onChange={(e) =>
                setTimerConfig((c) => ({ ...c, includeWarmupPhase: e.target.checked }))
              }
              className="w-4 h-4 accent-[#1E4D3B]"
            />
            <span>Incluir bloque de calentamiento previo ({routine.warmupMinutes} min)</span>
          </label>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowSettings(false)}
              className="min-h-[42px] px-4 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="min-h-[42px] px-4 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-xs font-semibold"
            >
              Aplicar y reiniciar
            </button>
          </div>
        </form>
      )}

      {/* Main Timer Grid */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Circular Timer Card */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 flex flex-col items-center text-center shadow-xs">
          <div className="text-sm font-semibold tracking-wide text-[#1E4D3B] dark:text-[#6EE7B7]">
            {timerState.isWarmupStep ? 'Calentamiento suave' : PHASE_LABELS[timerState.status]}
          </div>

          <div className="relative mt-4 w-60 h-60 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                strokeWidth="12"
                className="stroke-[#E6ECE7] dark:stroke-[#232F2A]"
              />
              <circle
                cx="120"
                cy="120"
                r={radius}
                fill="none"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className={`transition-[stroke-dashoffset] duration-150 ${activeColorClass}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center px-4">
              <div
                data-testid="timer-countdown"
                className="text-5xl font-bold font-mono-tabular tracking-tight text-[#17201B] dark:text-[#ECF1ED]"
              >
                {formatSeconds(remainingMs / 1000)}
              </div>
              <div className="mt-2 text-xs text-[#5B6860] dark:text-[#98A89F]">
                {timerState.status === 'descanso'
                  ? 'Recupera la respiración'
                  : timerState.status === 'preparacion'
                    ? 'Colócate en posición'
                    : timerState.status === 'pausa'
                      ? 'Temporizador detenido'
                      : 'Movimiento controlado'}
              </div>
            </div>
          </div>

          <h2 className="mt-4 text-xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
            {timerState.isWarmupStep
              ? 'Calentamiento general articular'
              : currentExerciseItem?.name ?? 'Sesión'}
          </h2>
          {currentExerciseItem?.notes && !timerState.isWarmupStep && (
            <p className="mt-1 text-sm text-[#1E4D3B] dark:text-[#6EE7B7]">{currentExerciseItem.notes}</p>
          )}

          {nextExerciseItem && (
            <div className="mt-4 w-full rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] px-4 py-3 text-left flex items-center justify-between gap-2">
              <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">Siguiente</span>
              <span className="text-sm font-medium truncate">{nextExerciseItem.name}</span>
            </div>
          )}

          {/* Large Touch Action Controls */}
          <div className="mt-6 w-full grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handlePauseOrResume}
              className="col-span-2 min-h-[54px] rounded-2xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
            >
              {timerState.status === 'pausa' ? (
                <>
                  <Play className="w-5 h-5" />
                  <span>Reanudar</span>
                </>
              ) : (
                <>
                  <Pause className="w-5 h-5" />
                  <span>Pausar</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="min-h-[48px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#F7F7F5] dark:hover:bg-[#1D2823]"
            >
              <SkipForward className="w-4 h-4" />
              <span>Saltar ejercicio</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="min-h-[48px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] font-medium text-sm flex items-center justify-center gap-2 hover:bg-[#F7F7F5] dark:hover:bg-[#1D2823]"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar</span>
            </button>

            <button
              type="button"
              onClick={handleFinishEarly}
              className="col-span-2 min-h-[48px] rounded-xl border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-200 font-medium text-sm flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40"
            >
              <Square className="w-4 h-4" />
              <span>Terminar sesión</span>
            </button>
          </div>
        </div>

        {/* Visual Guide & Technique Cue Card */}
        <div className="lg:col-span-6 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 sm:p-6 space-y-4">
          {catalogExercise ? (
            <>
              <ExerciseIllustration
                illustrationKey={catalogExercise.illustrationKey}
                altText={catalogExercise.altText}
                className="w-full h-48"
              />
              <div>
                <h3 className="text-base font-semibold text-[#17201B] dark:text-[#ECF1ED]">
                  Cómo ejecutarlo con seguridad
                </h3>
                <ol className="mt-2 space-y-1.5 text-sm text-[#2A3630] dark:text-[#D5DFD9] list-decimal list-inside">
                  {catalogExercise.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>
              <div className="pt-3 border-t border-[#E6EAE4] dark:border-[#25312B] text-xs space-y-1.5 text-[#5B6860] dark:text-[#98A89F]">
                <p>
                  <strong className="text-[#17201B] dark:text-[#ECF1ED]">Respiración:</strong>{' '}
                  {catalogExercise.breathing}
                </p>
                <p>
                  <strong className="text-[#17201B] dark:text-[#ECF1ED]">Cuándo detenerse:</strong>{' '}
                  {catalogExercise.whenToStop}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
              Mantén un ritmo suave, respiración fluida y detente si notas molestia superior a 3/10.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
