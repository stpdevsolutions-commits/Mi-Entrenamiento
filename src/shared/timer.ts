import type {
  Routine,
  RoutineExerciseItem,
  TimerConfig,
  TimerSessionState,
} from './types.ts';

export function buildInitialTimerState(
  routine: Routine,
  overrideConfig: Partial<TimerConfig> | undefined,
  nowMs: number,
): TimerSessionState {
  const config: TimerConfig = {
    prepSeconds: overrideConfig?.prepSeconds ?? 5,
    warmupSeconds: overrideConfig?.warmupSeconds ?? routine.warmupMinutes * 60,
    workSeconds: overrideConfig?.workSeconds ?? routine.defaultWorkSeconds,
    restSeconds: overrideConfig?.restSeconds ?? routine.defaultRestSeconds,
    rounds: overrideConfig?.rounds ?? routine.rounds,
    includeWarmupPhase: overrideConfig?.includeWarmupPhase ?? false,
  };

  const exercises: RoutineExerciseItem[] = routine.exercises.map((ex) => ({
    ...ex,
    workSeconds: overrideConfig?.workSeconds ?? ex.workSeconds,
    restSeconds: overrideConfig?.restSeconds ?? ex.restSeconds,
  }));

  return {
    routineId: routine.id,
    routineTitle: routine.title,
    status: 'preparacion',
    phaseBeforePause: null,
    isWarmupStep: false,
    currentRound: 1,
    totalRounds: Math.max(1, config.rounds),
    currentExerciseIndex: 0,
    exercises,
    config,
    phaseStartedAtMs: nowMs,
    phaseDurationMs: Math.max(1, config.prepSeconds) * 1000,
    pausedRemainingMs: 0,
    workoutStartedAtMs: nowMs,
    accumulatedPauseMs: 0,
    pauseStartedAtMs: null,
    exercisesCompletedCount: 0,
    roundsCompletedCount: 0,
  };
}

/**
 * Pure timestamp-based state progression.
 * Advances across phases even if JavaScript was suspended in iOS Safari background.
 */
export function advanceTimerByTimestamp(
  state: TimerSessionState,
  nowMs: number,
): { state: TimerSessionState; remainingMs: number; phaseChanged: boolean } {
  if (state.status === 'pausa') {
    return {
      state,
      remainingMs: Math.max(0, state.pausedRemainingMs),
      phaseChanged: false,
    };
  }

  if (state.status === 'finalizado') {
    return {
      state,
      remainingMs: 0,
      phaseChanged: false,
    };
  }

  if (state.exercises.length === 0) {
    return {
      state: { ...state, status: 'finalizado' },
      remainingMs: 0,
      phaseChanged: true,
    };
  }

  let current = { ...state };
  let phaseChanged = false;
  let guard = 0;

  while (current.status !== 'finalizado' && guard < 500) {
    guard += 1;
    const elapsed = nowMs - current.phaseStartedAtMs;
    if (elapsed < current.phaseDurationMs) {
      return {
        state: current,
        remainingMs: Math.max(0, current.phaseDurationMs - elapsed),
        phaseChanged,
      };
    }

    // Current phase finished at exact transition timestamp
    const transitionTime = current.phaseStartedAtMs + current.phaseDurationMs;
    phaseChanged = true;

    if (current.status === 'preparacion') {
      if (current.config.includeWarmupPhase && current.config.warmupSeconds > 0) {
        current = {
          ...current,
          status: 'trabajo',
          isWarmupStep: true,
          phaseStartedAtMs: transitionTime,
          phaseDurationMs: current.config.warmupSeconds * 1000,
        };
      } else {
        const firstEx = current.exercises[0];
        current = {
          ...current,
          status: 'trabajo',
          isWarmupStep: false,
          currentRound: 1,
          currentExerciseIndex: 0,
          phaseStartedAtMs: transitionTime,
          phaseDurationMs: Math.max(5, firstEx.workSeconds) * 1000,
        };
      }
      continue;
    }

    if (current.status === 'trabajo') {
      if (current.isWarmupStep) {
        const firstEx = current.exercises[0];
        current = {
          ...current,
          isWarmupStep: false,
          status: 'trabajo',
          currentRound: 1,
          currentExerciseIndex: 0,
          phaseStartedAtMs: transitionTime,
          phaseDurationMs: Math.max(5, firstEx.workSeconds) * 1000,
        };
        continue;
      }

      const activeEx = current.exercises[current.currentExerciseIndex];
      const isLastExInRound = current.currentExerciseIndex >= current.exercises.length - 1;
      const isLastRound = current.currentRound >= current.totalRounds;
      const completedCount = current.exercisesCompletedCount + 1;

      if (isLastExInRound && isLastRound) {
        current = {
          ...current,
          status: 'finalizado',
          exercisesCompletedCount: completedCount,
          roundsCompletedCount: current.totalRounds,
          phaseStartedAtMs: transitionTime,
          phaseDurationMs: 0,
        };
        break;
      }

      const restSec = activeEx?.restSeconds ?? current.config.restSeconds;
      if (restSec > 0) {
        current = {
          ...current,
          status: 'descanso',
          exercisesCompletedCount: completedCount,
          roundsCompletedCount: isLastExInRound
            ? current.currentRound
            : current.roundsCompletedCount,
          phaseStartedAtMs: transitionTime,
          phaseDurationMs: restSec * 1000,
        };
      } else {
        // Zero rest: advance directly to next exercise or next round
        current = moveToNextExerciseState(
          {
            ...current,
            exercisesCompletedCount: completedCount,
            roundsCompletedCount: isLastExInRound
              ? current.currentRound
              : current.roundsCompletedCount,
          },
          transitionTime,
        );
      }
      continue;
    }

    if (current.status === 'descanso') {
      current = moveToNextExerciseState(current, transitionTime);
      continue;
    }
  }

  return {
    state: current,
    remainingMs: 0,
    phaseChanged,
  };
}

function moveToNextExerciseState(
  state: TimerSessionState,
  transitionTime: number,
): TimerSessionState {
  const isLastExInRound = state.currentExerciseIndex >= state.exercises.length - 1;
  if (!isLastExInRound) {
    const nextIdx = state.currentExerciseIndex + 1;
    const nextEx = state.exercises[nextIdx];
    return {
      ...state,
      status: 'trabajo',
      currentExerciseIndex: nextIdx,
      phaseStartedAtMs: transitionTime,
      phaseDurationMs: Math.max(5, nextEx.workSeconds) * 1000,
    };
  }

  if (state.currentRound < state.totalRounds) {
    const nextRound = state.currentRound + 1;
    const firstEx = state.exercises[0];
    return {
      ...state,
      status: 'trabajo',
      currentRound: nextRound,
      currentExerciseIndex: 0,
      phaseStartedAtMs: transitionTime,
      phaseDurationMs: Math.max(5, firstEx.workSeconds) * 1000,
    };
  }

  return {
    ...state,
    status: 'finalizado',
    roundsCompletedCount: state.totalRounds,
    phaseStartedAtMs: transitionTime,
    phaseDurationMs: 0,
  };
}

export function pauseTimerState(
  state: TimerSessionState,
  nowMs: number,
): TimerSessionState {
  if (state.status === 'pausa' || state.status === 'finalizado') return state;
  const progressed = advanceTimerByTimestamp(state, nowMs);
  if (progressed.state.status === 'finalizado') return progressed.state;

  return {
    ...progressed.state,
    phaseBeforePause: progressed.state.status as Exclude<
      TimerSessionState['status'],
      'pausa' | 'finalizado'
    >,
    status: 'pausa',
    pausedRemainingMs: progressed.remainingMs,
    pauseStartedAtMs: nowMs,
  };
}

export function resumeTimerState(
  state: TimerSessionState,
  nowMs: number,
): TimerSessionState {
  if (state.status !== 'pausa' || !state.phaseBeforePause) return state;
  const pauseDelta = state.pauseStartedAtMs ? Math.max(0, nowMs - state.pauseStartedAtMs) : 0;
  const remaining = Math.max(0, state.pausedRemainingMs);

  return {
    ...state,
    status: state.phaseBeforePause,
    phaseBeforePause: null,
    phaseDurationMs: remaining,
    phaseStartedAtMs: nowMs,
    pausedRemainingMs: 0,
    pauseStartedAtMs: null,
    accumulatedPauseMs: state.accumulatedPauseMs + pauseDelta,
  };
}

export function skipExerciseTimerState(
  state: TimerSessionState,
  nowMs: number,
): TimerSessionState {
  if (state.status === 'finalizado') return state;
  const active = state.status === 'pausa' ? resumeTimerState(state, nowMs) : state;

  if (active.status === 'preparacion') {
    const firstEx = active.exercises[0];
    if (!firstEx) return { ...active, status: 'finalizado' };
    return {
      ...active,
      status: 'trabajo',
      isWarmupStep: false,
      currentRound: 1,
      currentExerciseIndex: 0,
      phaseStartedAtMs: nowMs,
      phaseDurationMs: Math.max(5, firstEx.workSeconds) * 1000,
    };
  }

  if (active.isWarmupStep) {
    const firstEx = active.exercises[0];
    return {
      ...active,
      isWarmupStep: false,
      status: 'trabajo',
      currentRound: 1,
      currentExerciseIndex: 0,
      phaseStartedAtMs: nowMs,
      phaseDurationMs: Math.max(5, firstEx?.workSeconds ?? active.config.workSeconds) * 1000,
    };
  }

  const next = moveToNextExerciseState(active, nowMs);
  return next;
}

export function finishTimerEarlyState(
  state: TimerSessionState,
  nowMs: number,
): TimerSessionState {
  const progressed = advanceTimerByTimestamp(state, nowMs).state;
  return {
    ...progressed,
    status: 'finalizado',
    phaseBeforePause: null,
    pauseStartedAtMs: null,
    phaseDurationMs: 0,
  };
}

export function getActiveElapsedSeconds(state: TimerSessionState, nowMs: number): number {
  const effectiveNow =
    state.status === 'pausa' && state.pauseStartedAtMs ? state.pauseStartedAtMs : nowMs;
  const rawElapsed = Math.max(0, effectiveNow - state.workoutStartedAtMs - state.accumulatedPauseMs);
  return Math.max(1, Math.round(rawElapsed / 1000));
}
