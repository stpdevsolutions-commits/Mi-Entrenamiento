import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceTimerByTimestamp,
  buildInitialTimerState,
  pauseTimerState,
  resumeTimerState,
  skipExerciseTimerState,
} from './timer.ts';
import { DEFAULT_ROUTINES } from './routines.ts';

const lunes = DEFAULT_ROUTINES[0];

test('timer advances accurately from preparation into work and rest using timestamps', () => {
  const t0 = 1_000_000;
  let state = buildInitialTimerState(
    lunes,
    { prepSeconds: 5, workSeconds: 40, restSeconds: 20, rounds: 2 },
    t0,
  );

  assert.equal(state.status, 'preparacion');

  // Simulate iOS background suspension for 15 seconds (5s prep + 10s into exercise 1)
  const step1 = advanceTimerByTimestamp(state, t0 + 15_000);
  assert.equal(step1.state.status, 'trabajo');
  assert.equal(step1.state.currentExerciseIndex, 0);
  assert.equal(step1.remainingMs, 30_000);

  // Jump ahead another 35 seconds (30s remaining work + 5s into rest)
  const step2 = advanceTimerByTimestamp(step1.state, t0 + 50_000);
  assert.equal(step2.state.status, 'descanso');
  assert.equal(step2.state.exercisesCompletedCount, 1);
  assert.equal(step2.remainingMs, 15_000);
});

test('timer pause and resume preserve remaining milliseconds accurately', () => {
  const t0 = 2_000_000;
  let state = buildInitialTimerState(
    lunes,
    { prepSeconds: 5, workSeconds: 40, restSeconds: 20, rounds: 1 },
    t0,
  );

  state = advanceTimerByTimestamp(state, t0 + 15_000).state; // 30s left in work
  const paused = pauseTimerState(state, t0 + 15_000);
  assert.equal(paused.status, 'pausa');
  assert.equal(paused.pausedRemainingMs, 30_000);

  // Wait 60 seconds while paused
  const stillPaused = advanceTimerByTimestamp(paused, t0 + 75_000);
  assert.equal(stillPaused.remainingMs, 30_000);

  // Resume at t0 + 75s
  const resumed = resumeTimerState(paused, t0 + 75_000);
  assert.equal(resumed.status, 'trabajo');
  const after10s = advanceTimerByTimestamp(resumed, t0 + 85_000);
  assert.equal(after10s.remainingMs, 20_000);
});

test('skipExerciseTimerState moves to next exercise and finishes at end of routine', () => {
  const t0 = 3_000_000;
  let state = buildInitialTimerState(
    lunes,
    { prepSeconds: 5, workSeconds: 40, restSeconds: 20, rounds: 1 },
    t0,
  );

  // Skip prep -> ex 0
  state = skipExerciseTimerState(state, t0 + 1000);
  assert.equal(state.status, 'trabajo');
  assert.equal(state.currentExerciseIndex, 0);

  // Skip through all 5 exercises
  for (let i = 1; i <= 5; i++) {
    state = skipExerciseTimerState(state, t0 + 1000 + i * 1000);
  }
  assert.equal(state.status, 'finalizado');
});
