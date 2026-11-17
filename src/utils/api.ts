import type {
  AiRecommendationResponse,
  Exercise,
  Routine,
  TrainingProfileSummary,
  UserProfile,
  WeightLog,
  WorkoutSession,
} from '../shared/types.ts';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!res.ok) {
    let msg = 'Error al comunicarse con el servidor.';
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      // ignore non-json error body
    }
    throw new ApiError(msg, res.status);
  }
  return (await res.json()) as T;
}

export interface HealthResponse {
  ok: boolean;
  aiEnabled: boolean;
  registrationAllowed: boolean;
  singleUserMode: boolean;
  demoAvailable: boolean;
  disclaimer: string;
}

export const api = {
  health: () => requestJson<HealthResponse>('/api/health'),
  me: () => requestJson<{ user: UserProfile; aiEnabled: boolean }>('/api/auth/me'),
  login: (email: string, password: string) =>
    requestJson<{ user: UserProfile; aiEnabled: boolean }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (email: string, password: string, name: string) =>
    requestJson<{ user: UserProfile; aiEnabled: boolean }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),
  logout: () => requestJson<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
  updateProfile: (payload: Record<string, unknown>) =>
    requestJson<{ user: UserProfile }>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),
  getRoutines: () => requestJson<{ routines: Routine[] }>('/api/routines'),
  saveRoutine: (routine: Routine) =>
    requestJson<{ routine: Routine }>(`/api/routines/${encodeURIComponent(routine.id)}`, {
      method: 'PUT',
      body: JSON.stringify(routine),
    }),
  resetRoutines: () =>
    requestJson<{ routines: Routine[] }>('/api/routines/reset', { method: 'POST' }),
  getExercises: () => requestJson<{ exercises: Exercise[] }>('/api/exercises'),
  setExerciseVideo: (exerciseId: string, videoUrl: string | null) =>
    requestJson<{ exerciseId: string; customVideoUrl: string | null }>(
      `/api/exercises/${encodeURIComponent(exerciseId)}/video`,
      {
        method: 'PUT',
        body: JSON.stringify({ videoUrl }),
      },
    ),
  getSessions: () =>
    requestJson<{ sessions: WorkoutSession[]; summary: TrainingProfileSummary }>('/api/sessions'),
  createSession: (payload: Record<string, unknown>) =>
    requestJson<{ session: WorkoutSession; summary: TrainingProfileSummary }>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getWeights: () => requestJson<{ weights: WeightLog[] }>('/api/weights'),
  createWeight: (payload: { weightKg: number; recordedAt?: string; note?: string }) =>
    requestJson<{ weight: WeightLog }>('/api/weights', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteWeight: (id: string) =>
    requestJson<{ ok: boolean }>(`/api/weights/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
  deleteAccount: () => requestJson<{ ok: boolean }>('/api/account', { method: 'DELETE' }),
  askAiAdvisor: (payload: {
    question: string;
    routineId?: string;
    hasRedFlagsReported?: boolean;
  }) =>
    requestJson<{ advice: AiRecommendationResponse; stored: boolean }>('/api/ai/advise', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

// Offline-only local storage for non-sensitive saved routines, viewed guides, and pending session queue
const OFFLINE_ROUTINES_KEY = 'me_offline_routines_v1';
const OFFLINE_GUIDES_KEY = 'me_offline_viewed_guides_v1';
const PENDING_SESSIONS_KEY = 'me_pending_sessions_v1';

export function saveOfflineRoutines(userId: number, routines: Routine[]): void {
  try {
    localStorage.setItem(`${OFFLINE_ROUTINES_KEY}_${userId}`, JSON.stringify(routines));
  } catch {
    // ignore quota errors
  }
}

export function loadOfflineRoutines(userId: number): Routine[] | null {
  try {
    const raw = localStorage.getItem(`${OFFLINE_ROUTINES_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as Routine[]) : null;
  } catch {
    return null;
  }
}

export function cacheViewedExercise(userId: number, exercise: Exercise): void {
  try {
    const key = `${OFFLINE_GUIDES_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    const list: Exercise[] = raw ? (JSON.parse(raw) as Exercise[]) : [];
    const filtered = list.filter((e) => e.id !== exercise.id);
    filtered.unshift(exercise);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function loadViewedExercises(userId: number): Exercise[] {
  try {
    const raw = localStorage.getItem(`${OFFLINE_GUIDES_KEY}_${userId}`);
    return raw ? (JSON.parse(raw) as Exercise[]) : [];
  } catch {
    return [];
  }
}

export function queuePendingSession(userId: number, payload: Record<string, unknown>): void {
  try {
    const key = `${PENDING_SESSIONS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    const list: Record<string, unknown>[] = raw ? (JSON.parse(raw) as Record<string, unknown>[]) : [];
    list.push(payload);
    localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export async function flushPendingSessions(userId: number): Promise<number> {
  try {
    const key = `${PENDING_SESSIONS_KEY}_${userId}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const list = JSON.parse(raw) as Record<string, unknown>[];
    if (!Array.isArray(list) || list.length === 0) return 0;
    const remaining: Record<string, unknown>[] = [];
    let synced = 0;
    for (const item of list) {
      try {
        await api.createSession(item);
        synced += 1;
      } catch {
        remaining.push(item);
      }
    }
    if (remaining.length === 0) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, JSON.stringify(remaining));
    }
    return synced;
  } catch {
    return 0;
  }
}

export function clearLocalCachesForUser(userId?: number): void {
  try {
    if (userId) {
      localStorage.removeItem(`${OFFLINE_ROUTINES_KEY}_${userId}`);
      localStorage.removeItem(`${OFFLINE_GUIDES_KEY}_${userId}`);
      localStorage.removeItem(`${PENDING_SESSIONS_KEY}_${userId}`);
    }
    localStorage.removeItem('me_active_timer_v1');
  } catch {
    // ignore
  }
}
