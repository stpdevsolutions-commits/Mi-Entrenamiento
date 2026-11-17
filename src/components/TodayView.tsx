import React from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  PauseCircle,
  Play,
} from 'lucide-react';
import { getRecommendedRoutineForDay } from '../shared/routines.ts';
import type {
  DayStatus,
  Routine,
  TrainingProfileSummary,
  UserProfile,
  WorkoutSession,
} from '../shared/types.ts';
import { PWAInstallButton } from './PWAInstallBanner.tsx';

interface Props {
  user: UserProfile;
  routines: Routine[];
  sessions: WorkoutSession[];
  summary: TrainingProfileSummary;
  onStartPreCheck: (routine: Routine) => void;
  onOpenTrainTab: () => void;
  onOpenProgressTab: () => void;
}

function getGreetingByHour(hour: number): string {
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

const STATUS_CONFIG: Record<
  DayStatus,
  { label: string; description: string; boxClass: string; icon: React.ReactNode }
> = {
  listo: {
    label: 'Listo para entrenar',
    description: 'Tu tolerancia reciente es favorable. Mantén técnica suave y respiración continua.',
    boxClass:
      'bg-[#EEF5F0] dark:bg-[#172821] border-[#CFE0D5] dark:border-[#2A4236] text-[#173A2C] dark:text-[#C5EBD6]',
    icon: <CheckCircle2 className="w-5 h-5 shrink-0" />,
  },
  recuperacion: {
    label: 'Recuperación recomendada',
    description:
      'Esfuerzo elevado o molestia reciente. Prioriza movilidad suave, menos rondas o más descanso.',
    boxClass:
      'bg-amber-50 dark:bg-amber-950/45 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-100',
    icon: <AlertTriangle className="w-5 h-5 shrink-0" />,
  },
  pausa: {
    label: 'Pausa sugerida',
    description:
      'Se registró molestia alta recientemente. Descansa hoy y busca atención médica profesional si persiste.',
    boxClass:
      'bg-rose-50 dark:bg-rose-950/45 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-100',
    icon: <PauseCircle className="w-5 h-5 shrink-0" />,
  },
};

export const TodayView: React.FC<Props> = ({
  user,
  routines,
  sessions,
  summary,
  onStartPreCheck,
  onOpenTrainTab,
  onOpenProgressTab,
}) => {
  const now = new Date();
  const greeting = getGreetingByHour(now.getHours());
  const { recommended, nextWorkout } = getRecommendedRoutineForDay(
    routines,
    now.getDay(),
    summary.dayStatusSuggestion,
  );
  const lastSession = sessions[0] ?? null;
  const statusInfo = STATUS_CONFIG[summary.dayStatusSuggestion];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 space-y-6">
      {/* Greeting & Install */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
            {now.toLocaleDateString('es-419', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
            {greeting}, {user.name}
          </h1>
        </div>
        <PWAInstallButton compact />
      </div>

      {/* Main 2-column desktop layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left/Primary Column: Status + Recommended Routine + Main CTA */}
        <div className="lg:col-span-7 space-y-5">
          {/* Day Status Banner */}
          <div className={`rounded-2xl border p-4 flex items-start gap-3 ${statusInfo.boxClass}`}>
            <div className="mt-0.5">{statusInfo.icon}</div>
            <div>
              <div className="text-sm font-semibold">Estado del día: {statusInfo.label}</div>
              <p className="mt-0.5 text-xs sm:text-sm opacity-90">{statusInfo.description}</p>
            </div>
          </div>

          {/* Recommended Routine Hero Card */}
          <section
            aria-labelledby="recommended-heading"
            className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-[#5B6860] dark:text-[#98A89F]">
              <span>Rutina recomendada para hoy</span>
              <span className="font-mono-tabular">
                {recommended.warmupMinutes} min calent. · {recommended.mainMinutes} min ·{' '}
                {recommended.cooldownMinutes} min calma
              </span>
            </div>

            <h2
              id="recommended-heading"
              className="mt-2 text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]"
            >
              {recommended.title}
            </h2>
            <p className="mt-1 text-sm text-[#5B6860] dark:text-[#98A89F]">
              {recommended.subtitle}
            </p>

            {recommended.isRestDay ? (
              <div className="mt-4 rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4 text-sm text-[#2A3630] dark:text-[#D5DFD9]">
                {recommended.progressionNote}
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <div className="text-xs font-medium text-[#5B6860] dark:text-[#98A89F]">
                  {recommended.rounds} {recommended.rounds === 1 ? 'ronda' : 'rondas'} ·{' '}
                  {recommended.exercises.length} ejercicios
                </div>
                <ul className="divide-y divide-[#EEF1EC] dark:divide-[#232E29] text-sm">
                  {recommended.exercises.slice(0, 5).map((ex) => (
                    <li key={ex.id} className="py-2 flex items-center justify-between gap-3">
                      <span className="font-medium text-[#17201B] dark:text-[#ECF1ED]">
                        {ex.name}
                      </span>
                      <span className="text-xs font-mono-tabular text-[#5B6860] dark:text-[#98A89F] shrink-0">
                        {ex.workSeconds}s / {ex.restSeconds}s
                      </span>
                    </li>
                  ))}
                  {recommended.exercises.length > 5 && (
                    <li className="py-2 text-xs text-[#5B6860] dark:text-[#98A89F]">
                      +{recommended.exercises.length - 5} ejercicios más en esta sesión
                    </li>
                  )}
                </ul>
              </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {!recommended.isRestDay ? (
                <button
                  type="button"
                  onClick={() => onStartPreCheck(recommended)}
                  className="flex-1 min-h-[54px] rounded-2xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Play className="w-5 h-5" />
                  <span>Comenzar entrenamiento</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onStartPreCheck(nextWorkout)}
                  className="flex-1 min-h-[54px] rounded-2xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  <Play className="w-5 h-5" />
                  <span>Comenzar entrenamiento</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenTrainTab}
                className="min-h-[54px] px-5 rounded-2xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium text-[#17201B] dark:text-[#ECF1ED] hover:bg-[#F7F7F5] dark:hover:bg-[#1E2924]"
              >
                Ver todas las rutinas
              </button>
            </div>
          </section>
        </div>

        {/* Right Column: Next Workout + Last Session Summary + Weekly Snapshot */}
        <div className="lg:col-span-5 space-y-5">
          {/* Next Workout */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-medium text-[#5B6860] dark:text-[#98A89F]">
                <CalendarClock className="w-4 h-4" />
                <span>Próximo entrenamiento</span>
              </div>
              <button
                type="button"
                onClick={onOpenTrainTab}
                className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7] inline-flex items-center gap-0.5 min-h-[36px]"
              >
                <span>Plan semanal</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h3 className="mt-1.5 text-lg font-bold text-[#17201B] dark:text-[#ECF1ED]">
              {nextWorkout.title}
            </h3>
            <p className="mt-0.5 text-xs text-[#5B6860] dark:text-[#98A89F]">
              {nextWorkout.subtitle}
            </p>
            <p className="mt-2.5 text-xs text-[#2A3630] dark:text-[#D5DFD9]">
              {nextWorkout.progressionNote}
            </p>
          </section>

          {/* Last Session Summary */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#17201B] dark:text-[#ECF1ED]">
                Resumen de la última sesión
              </h3>
              <button
                type="button"
                onClick={onOpenProgressTab}
                className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7] inline-flex items-center gap-0.5 min-h-[36px]"
              >
                <span>Progreso</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {lastSession ? (
              <div className="mt-3 space-y-3">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold text-base">{lastSession.routineTitle}</span>
                  <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                    {new Date(lastSession.completedAt).toLocaleDateString('es-419', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-[#F7F7F5] dark:bg-[#111815] p-2.5">
                    <div className="text-[11px] text-[#5B6860] dark:text-[#98A89F]">Esfuerzo</div>
                    <div className="text-sm font-bold font-mono-tabular">
                      {lastSession.rpe}/10
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F7F7F5] dark:bg-[#111815] p-2.5">
                    <div className="text-[11px] text-[#5B6860] dark:text-[#98A89F]">Rodillas</div>
                    <div className="text-sm font-bold font-mono-tabular">
                      {lastSession.postKneePain}/10
                    </div>
                  </div>
                  <div className="rounded-xl bg-[#F7F7F5] dark:bg-[#111815] p-2.5">
                    <div className="text-[11px] text-[#5B6860] dark:text-[#98A89F]">Espalda</div>
                    <div className="text-sm font-bold font-mono-tabular">
                      {lastSession.postBackPain}/10
                    </div>
                  </div>
                </div>

                {lastSession.note && (
                  <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                    “{lastSession.note}”
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-2 text-sm text-[#5B6860] dark:text-[#98A89F]">
                Aún no hay sesiones registradas. Completa tu primer entrenamiento para ver tu resumen aquí.
              </p>
            )}
          </section>

          {/* Conservative Weekly Summary */}
          <section className="rounded-3xl bg-[#F0F4F1] dark:bg-[#151D1A] border border-[#DCE3DD] dark:border-[#25322C] p-5">
            <div className="flex items-center justify-between text-xs text-[#5B6860] dark:text-[#98A89F]">
              <span>Esta semana</span>
              <span className="font-mono-tabular font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
                {summary.weeklySessions} sesiones · {summary.weeklyMinutes} min
              </span>
            </div>
            <p className="mt-2 text-sm text-[#2A3630] dark:text-[#D5DFD9] leading-relaxed">
              {summary.conservativeNarrative}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
