import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  CalendarDays,
  Dumbbell,
  Play,
  User,
} from 'lucide-react';
import { DEFAULT_EXERCISES } from './shared/exercises.ts';
import { DEFAULT_ROUTINES, getRecommendedRoutineForDay } from './shared/routines.ts';
import { computeTrainingProfile } from './shared/safety.ts';
import type {
  Exercise,
  PreCheckInput,
  Routine,
  TrainingProfileSummary,
  UserProfile,
  WeightLog,
  WorkoutSession,
} from './shared/types.ts';
import {
  api,
  cacheViewedExercise,
  clearLocalCachesForUser,
  flushPendingSessions,
  loadOfflineRoutines,
  loadViewedExercises,
  queuePendingSession,
  saveOfflineRoutines,
} from './utils/api.ts';
import type { HealthResponse } from './utils/api.ts';
import { useOnlineStatus } from './utils/useOnlineStatus.ts';
import { AuthScreen } from './components/AuthScreen.tsx';
import { GuidesView } from './components/GuidesView.tsx';
import { OnboardingWizard } from './components/OnboardingWizard.tsx';
import { OfflineBanner } from './components/PWAInstallBanner.tsx';
import { PreWorkoutCheckModal } from './components/PreWorkoutCheckModal.tsx';
import { ProfileView } from './components/ProfileView.tsx';
import { ProgressView } from './components/ProgressView.tsx';
import { TodayView } from './components/TodayView.tsx';
import { TrainView } from './components/TrainView.tsx';
import { WorkoutTimerView } from './components/WorkoutTimerView.tsx';

type NavTab = 'hoy' | 'entrenar' | 'progreso' | 'guias' | 'perfil';

export default function App() {
  const isOnline = useOnlineStatus();
  const [booting, setBooting] = useState(true);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [aiEnabled, setAiEnabled] = useState(false);

  const [routines, setRoutines] = useState<Routine[]>(DEFAULT_ROUTINES);
  const [exercises, setExercises] = useState<Exercise[]>(DEFAULT_EXERCISES);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [weights, setWeights] = useState<WeightLog[]>([]);
  const [summary, setSummary] = useState<TrainingProfileSummary>(() =>
    computeTrainingProfile([], { weightKg: null, heightCm: null }),
  );

  const [activeTab, setActiveTab] = useState<NavTab>('hoy');
  const [preCheckRoutine, setPreCheckRoutine] = useState<Routine | null>(null);
  const [activeWorkout, setActiveWorkout] = useState<{
    routine: Routine;
    preCheck: PreCheckInput;
  } | null>(null);

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('me_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // Sound & vibration strictly off until user activates them
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('me_sound_enabled') === 'true';
    } catch {
      return false;
    }
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('me_vibration_enabled') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    try {
      localStorage.setItem('me_theme', darkMode ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [darkMode]);

  const loadUserWorkspace = useCallback(async (currentUser: UserProfile) => {
    try {
      const [rRes, eRes, sRes, wRes] = await Promise.all([
        api.getRoutines(),
        api.getExercises(),
        api.getSessions(),
        api.getWeights(),
      ]);
      setRoutines(rRes.routines);
      saveOfflineRoutines(currentUser.id, rRes.routines);
      setExercises(eRes.exercises);
      setSessions(sRes.sessions);
      setSummary(sRes.summary);
      setWeights(wRes.weights);
    } catch {
      // Offline fallback for non-sensitive cached routines & viewed guides
      const cachedRoutines = loadOfflineRoutines(currentUser.id);
      if (cachedRoutines) setRoutines(cachedRoutines);
      const cachedGuides = loadViewedExercises(currentUser.id);
      if (cachedGuides.length > 0) {
        const merged = DEFAULT_EXERCISES.map(
          (ex) => cachedGuides.find((g) => g.id === ex.id) ?? ex,
        );
        setExercises(merged);
      }
      setSummary(computeTrainingProfile([], currentUser));
    }
  }, []);

  useEffect(() => {
    let active = true;
    const init = async () => {
      try {
        const h = await api.health();
        if (!active) return;
        setHealth(h);
        setAiEnabled(h.aiEnabled);

        const meRes = await api.me();
        if (!active) return;
        if (meRes.user) {
          setUser(meRes.user);
          setAiEnabled(meRes.aiEnabled);
          await loadUserWorkspace(meRes.user);
        } else {
          const params = new URLSearchParams(window.location.search);
          if (params.get('autostart') === '1' && h.demoAvailable) {
            try {
              const demoRes = await api.login(
                'atleta@mi-entrenamiento.local',
                'Calistenia2026!',
              );
              if (!active) return;
              setUser(demoRes.user);
              setAiEnabled(demoRes.aiEnabled);
              await loadUserWorkspace(demoRes.user);
            } catch {
              // stay on auth screen
            }
          }
        }
      } catch {
        // Offline at boot
      } finally {
        if (active) setBooting(false);
      }
    };
    void init();
    return () => {
      active = false;
    };
  }, [loadUserWorkspace]);

  // Flush queued offline sessions when connection comes back
  useEffect(() => {
    if (!isOnline || !user) return;
    void (async () => {
      const synced = await flushPendingSessions(user.id);
      if (synced > 0) {
        const sRes = await api.getSessions();
        setSessions(sRes.sessions);
        setSummary(sRes.summary);
      }
    })();
  }, [isOnline, user]);

  const mobilityRoutine = useMemo(
    () => routines.find((r) => r.focus === 'movilidad') ?? routines[1] ?? null,
    [routines],
  );

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('me_sound_enabled', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const toggleVibration = () => {
    setVibrationEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('me_vibration_enabled', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAuthenticated = async (loggedUser: UserProfile, serverAi: boolean) => {
    setUser(loggedUser);
    setAiEnabled(serverAi);
    await loadUserWorkspace(loggedUser);
  };

  const handleLogout = async () => {
    const uid = user?.id;
    try {
      await api.logout();
    } finally {
      clearLocalCachesForUser(uid);
      setUser(null);
      setSessions([]);
      setWeights([]);
      setActiveWorkout(null);
      setActiveTab('hoy');
    }
  };

  const handleDeleteAccount = async () => {
    const uid = user?.id;
    await api.deleteAccount();
    clearLocalCachesForUser(uid);
    setUser(null);
    setSessions([]);
    setWeights([]);
    setActiveWorkout(null);
    setActiveTab('hoy');
  };

  const handleSaveRoutine = async (updated: Routine) => {
    const res = await api.saveRoutine(updated);
    setRoutines((prev) => {
      const next = prev.map((r) => (r.id === res.routine.id ? res.routine : r));
      if (user) saveOfflineRoutines(user.id, next);
      return next;
    });
  };

  const handleResetRoutines = async () => {
    const res = await api.resetRoutines();
    setRoutines(res.routines);
    if (user) saveOfflineRoutines(user.id, res.routines);
  };

  const handleSaveCompletedSession = async (
    payload: Omit<WorkoutSession, 'id'>,
  ): Promise<WorkoutSession> => {
    if (!user) throw new Error('Sesión no iniciada.');
    try {
      const res = await api.createSession(payload as Record<string, unknown>);
      setSessions((prev) => [res.session, ...prev]);
      setSummary(res.summary);
      return res.session;
    } catch (err) {
      if (!navigator.onLine) {
        queuePendingSession(user.id, payload as Record<string, unknown>);
        const localSession: WorkoutSession = { id: `local-${Date.now()}`, ...payload };
        const updatedList = [localSession, ...sessions];
        setSessions(updatedList);
        setSummary(computeTrainingProfile(updatedList, user));
        return localSession;
      }
      throw err;
    }
  };

  const handleAddWeight = async (weightKg: number, note: string) => {
    const res = await api.createWeight({ weightKg, note });
    setWeights((prev) => [res.weight, ...prev]);
    if (user) {
      const nextUser = { ...user, weightKg: res.weight.weightKg };
      setUser(nextUser);
      setSummary(computeTrainingProfile(sessions, nextUser));
    }
  };

  const handleDeleteWeight = async (id: string) => {
    await api.deleteWeight(id);
    setWeights((prev) => prev.filter((w) => w.id !== id));
  };

  const handleSaveVideoUrl = async (exerciseId: string, videoUrl: string | null) => {
    const res = await api.setExerciseVideo(exerciseId, videoUrl);
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId ? { ...ex, customVideoUrl: res.customVideoUrl } : ex,
      ),
    );
  };

  if (booting) {
    return (
      <div className="min-h-dvh bg-[#F7F7F5] dark:bg-[#0F1412] flex flex-col items-center justify-center gap-3 p-6">
        <div className="w-12 h-12 rounded-2xl bg-[#1E4D3B] text-white flex items-center justify-center font-bold text-lg">
          ME
        </div>
        <div className="text-base font-semibold">Mi Entrenamiento</div>
        <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Cargando espacio privado…</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen health={health} onAuthenticated={handleAuthenticated} />;
  }

  if (!user.onboardingCompleted) {
    return (
      <OnboardingWizard
        user={user}
        aiAvailable={aiEnabled}
        onComplete={(updated) => {
          setUser(updated);
          setSummary(computeTrainingProfile(sessions, updated));
        }}
      />
    );
  }

  const { recommended } = getRecommendedRoutineForDay(
    routines,
    new Date().getDay(),
    summary.dayStatusSuggestion,
  );

  const navItems: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'hoy', label: 'Hoy', icon: <Activity className="w-5 h-5" /> },
    { id: 'entrenar', label: 'Entrenar', icon: <Dumbbell className="w-5 h-5" /> },
    { id: 'progreso', label: 'Progreso', icon: <CalendarDays className="w-5 h-5" /> },
    { id: 'guias', label: 'Guías', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'perfil', label: 'Perfil', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-dvh bg-[#F7F7F5] dark:bg-[#0F1412] text-[#17201B] dark:text-[#ECF1ED]">
      <OfflineBanner />

      {/* Desktop Top Navigation Contract (3 zones) */}
      <header className="hidden lg:flex sticky top-0 z-30 h-16 bg-white/85 dark:bg-[#141B18]/85 backdrop-blur-md border-b border-[#E2E6E1] dark:border-[#24302A] px-6 items-center justify-between gap-8">
        <button
          type="button"
          onClick={() => {
            setActiveWorkout(null);
            setActiveTab('hoy');
          }}
          className="text-lg font-bold tracking-tight whitespace-nowrap shrink-0"
        >
          Mi Entrenamiento
        </button>

        <nav className="flex items-center gap-6" aria-label="Navegación principal">
          {navItems.map((item) => {
            const isCurrent = activeTab === item.id && !activeWorkout;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveWorkout(null);
                  setActiveTab(item.id);
                }}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-2 border-b-2 transition-colors ${
                  isCurrent
                    ? 'border-[#1E4D3B] text-[#1E4D3B] dark:border-[#6EE7B7] dark:text-[#6EE7B7]'
                    : 'border-transparent text-[#5B6860] dark:text-[#98A89F] hover:text-[#17201B] dark:hover:text-[#ECF1ED]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => setPreCheckRoutine(recommended.isRestDay ? routines[0] : recommended)}
          className="min-h-[42px] px-4 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
        >
          <Play className="w-4 h-4" />
          <span>Entrenar hoy</span>
        </button>
      </header>

      {/* Main Content */}
      <main>
        {activeWorkout ? (
          <WorkoutTimerView
            routine={activeWorkout.routine}
            exercisesCatalog={exercises}
            preCheck={activeWorkout.preCheck}
            soundEnabled={soundEnabled}
            vibrationEnabled={vibrationEnabled}
            onToggleMute={toggleSound}
            onSaveCompletedSession={handleSaveCompletedSession}
            onExit={() => {
              setActiveWorkout(null);
              setActiveTab('hoy');
            }}
          />
        ) : (
          <>
            {activeTab === 'hoy' && (
              <TodayView
                user={user}
                routines={routines}
                sessions={sessions}
                summary={summary}
                onStartPreCheck={(routine) => setPreCheckRoutine(routine)}
                onOpenTrainTab={() => setActiveTab('entrenar')}
                onOpenProgressTab={() => setActiveTab('progreso')}
              />
            )}

            {activeTab === 'entrenar' && (
              <TrainView
                routines={routines}
                exercisesCatalog={exercises}
                onStartPreCheck={(routine) => setPreCheckRoutine(routine)}
                onSaveRoutine={handleSaveRoutine}
                onResetRoutines={handleResetRoutines}
              />
            )}

            {activeTab === 'progreso' && (
              <ProgressView
                sessions={sessions}
                weights={weights}
                summary={summary}
                onAddWeight={handleAddWeight}
                onDeleteWeight={handleDeleteWeight}
              />
            )}

            {activeTab === 'guias' && (
              <GuidesView
                exercises={exercises}
                onGuideViewed={(ex) => {
                  if (user) cacheViewedExercise(user.id, ex);
                }}
                onSaveVideoUrl={handleSaveVideoUrl}
              />
            )}

            {activeTab === 'perfil' && (
              <ProfileView
                user={user}
                summary={summary}
                routines={routines}
                aiAvailable={aiEnabled}
                darkMode={darkMode}
                soundEnabled={soundEnabled}
                vibrationEnabled={vibrationEnabled}
                onToggleDarkMode={() => setDarkMode((d) => !d)}
                onToggleSound={toggleSound}
                onToggleVibration={toggleVibration}
                onProfileUpdated={(updated) => {
                  setUser(updated);
                  setSummary(computeTrainingProfile(sessions, updated));
                }}
                onLogout={handleLogout}
                onDeleteAccount={handleDeleteAccount}
              />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (5 tabs, <= 15% mobile viewport height) */}
      {!activeWorkout && (
        <nav
          aria-label="Navegación inferior"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 dark:bg-[#141B18]/92 backdrop-blur-md border-t border-[#E2E6E1] dark:border-[#24302A] pb-safe"
        >
          <div className="grid grid-cols-5 items-center h-16">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active
                      ? 'text-[#1E4D3B] dark:text-[#6EE7B7]'
                      : 'text-[#64736A] dark:text-[#8E9F95]'
                  }`}
                >
                  {item.icon}
                  <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Pre-Workout Safety Triage Modal */}
      {preCheckRoutine && (
        <PreWorkoutCheckModal
          open={Boolean(preCheckRoutine)}
          routine={preCheckRoutine}
          mobilityRoutine={mobilityRoutine}
          onClose={() => setPreCheckRoutine(null)}
          onProceed={(selectedRoutine, preCheck) => {
            setPreCheckRoutine(null);
            setActiveWorkout({ routine: selectedRoutine, preCheck });
          }}
        />
      )}
    </div>
  );
}
