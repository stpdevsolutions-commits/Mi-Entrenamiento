import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeInformationalBmi,
  evaluatePostWorkoutRecommendation,
  evaluatePreWorkoutSafety,
} from './safety.ts';

const noRedFlags = {
  severePain: false,
  swollenHotKnee: false,
  cannotBearWeight: false,
  kneeLocking: false,
  significantWeakness: false,
  numbness: false,
  bladderBowelLoss: false,
};

test('evaluatePreWorkoutSafety blocks training and shows medical prompt on red flags', () => {
  const res = evaluatePreWorkoutSafety({
    energy: 4,
    kneePain: 2,
    backPain: 1,
    redFlags: { ...noRedFlags, kneeLocking: true },
  });

  assert.equal(res.blocked, true);
  assert.equal(res.allowRecommendWorkout, false);
  assert.equal(res.status, 'pausa');
  assert.equal(res.headline, 'Busca atención médica profesional');
});

test('evaluatePreWorkoutSafety recommends recovery/mobility when pain > 3/10', () => {
  const res = evaluatePreWorkoutSafety({
    energy: 4,
    kneePain: 4,
    backPain: 1,
    redFlags: noRedFlags,
  });

  assert.equal(res.blocked, false);
  assert.equal(res.allowRecommendWorkout, true);
  assert.equal(res.status, 'recuperacion');
  assert.equal(res.suggestMobilityOnly, true);
});

test('evaluatePreWorkoutSafety returns listo when energy is good and pain <= 2', () => {
  const res = evaluatePreWorkoutSafety({
    energy: 4,
    kneePain: 1,
    backPain: 0,
    redFlags: noRedFlags,
  });

  assert.equal(res.status, 'listo');
  assert.equal(res.blocked, false);
  assert.equal(res.suggestMobilityOnly, false);
});

test('evaluatePostWorkoutRecommendation advises reducing load when pain rises during session', () => {
  const msg = evaluatePostWorkoutRecommendation({
    rpe: 5,
    preKneePain: 1,
    preBackPain: 1,
    postKneePain: 3,
    postBackPain: 1,
  });
  assert.match(msg, /aumentó|reduce/i);
});

test('computeInformationalBmi calculates metric BMI cleanly', () => {
  assert.equal(computeInformationalBmi(70, 175), 22.9);
  assert.equal(computeInformationalBmi(null, 175), null);
});
