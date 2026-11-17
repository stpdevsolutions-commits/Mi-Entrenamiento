let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playCueSound(
  type: 'prep' | 'work' | 'rest' | 'finish',
  enabled: boolean,
): void {
  if (!enabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const playNote = (freq: number, startOffset: number, duration: number, gainPeak = 0.08) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + startOffset);
      gain.gain.setValueAtTime(0.0001, now + startOffset);
      gain.gain.exponentialRampToValueAtTime(gainPeak, now + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    if (type === 'prep') {
      playNote(523.25, 0, 0.12);
    } else if (type === 'work') {
      playNote(587.33, 0, 0.14);
      playNote(783.99, 0.14, 0.18);
    } else if (type === 'rest') {
      playNote(523.25, 0, 0.18);
      playNote(392.0, 0.16, 0.22);
    } else if (type === 'finish') {
      playNote(523.25, 0, 0.15);
      playNote(659.25, 0.15, 0.15);
      playNote(783.99, 0.3, 0.32);
    }
  } catch {
    // Audio playback blocked or unavailable
  }
}

export function triggerCueVibration(
  type: 'work' | 'rest' | 'finish',
  enabled: boolean,
): void {
  if (!enabled) return;
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  try {
    if (type === 'work') navigator.vibrate([80, 40, 80]);
    else if (type === 'rest') navigator.vibrate(100);
    else navigator.vibrate([120, 60, 120, 60, 160]);
  } catch {
    // Vibration not permitted
  }
}
