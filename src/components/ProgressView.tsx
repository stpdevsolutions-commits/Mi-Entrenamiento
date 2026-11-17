import React, { useMemo, useState } from 'react';
import { Calendar, Plus, Trash2 } from 'lucide-react';
import type { TrainingProfileSummary, WeightLog, WorkoutSession } from '../shared/types.ts';

interface Props {
  sessions: WorkoutSession[];
  weights: WeightLog[];
  summary: TrainingProfileSummary;
  onAddWeight: (weightKg: number, note: string) => Promise<void>;
  onDeleteWeight: (id: string) => Promise<void>;
}

const MetricTrendChart: React.FC<{
  title: string;
  data: Array<{ label: string; value: number }>;
  maxValue: number;
  unit?: string;
  colorClass: string;
}> = ({ title, data, maxValue, unit = '', colorClass }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4 text-xs text-[#5B6860] dark:text-[#98A89F]">
        {title}: sin datos aún.
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4">
      <div className="flex flex-col gap-0.5 mb-3">
        <span className="text-xs font-medium text-[#17201B] dark:text-[#ECF1ED] whitespace-nowrap">
          {title}
        </span>
        <span className="text-[11px] font-mono-tabular text-[#5B6860] dark:text-[#98A89F]">
          Último: {data[data.length - 1].value}
          {unit}
        </span>
      </div>
      <div className="flex items-end gap-2 h-24" role="img" aria-label={`Gráfico de ${title}`}>
        {data.map((d, idx) => {
          const pct = Math.max(8, Math.round((d.value / maxValue) * 100));
          return (
            <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
              <span className="text-[10px] font-mono-tabular text-[#5B6860] dark:text-[#98A89F]">
                {d.value}
              </span>
              <div className="w-full flex items-end justify-center h-14">
                <div
                  className={`w-full max-w-[24px] rounded-t-md ${colorClass}`}
                  style={{ height: `${pct}%` }}
                  title={`${d.label}: ${d.value}${unit}`}
                />
              </div>
              <span className="text-[10px] text-[#5B6860] dark:text-[#98A89F] truncate max-w-full">
                {d.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProgressView: React.FC<Props> = ({
  sessions,
  weights,
  summary,
  onAddWeight,
  onDeleteWeight,
}) => {
  const [weightInput, setWeightInput] = useState('');
  const [weightNote, setWeightNote] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightError, setWeightError] = useState<string | null>(null);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const sessionDaySet = useMemo(() => {
    const set = new Set<string>();
    for (const s of sessions) {
      const d = new Date(s.completedAt);
      set.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    }
    return set;
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
    const cells: Array<{ day: number | null; trained: boolean; isToday: boolean }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, trained: false, isToday: false });
    }
    for (let day = 1; day <= totalDays; day++) {
      const key = `${year}-${month}-${day}`;
      cells.push({
        day,
        trained: sessionDaySet.has(key),
        isToday: day === now.getDate(),
      });
    }
    return cells;
  }, [year, month, sessionDaySet, now]);

  const recentChrono = useMemo(() => {
    return [...sessions].slice(0, 8).reverse();
  }, [sessions]);

  const handleWeightSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWeightError(null);
    const parsed = Number(weightInput);
    if (!Number.isFinite(parsed) || parsed < 30 || parsed > 300) {
      setWeightError('Ingresa un peso válido entre 30 y 300 kg.');
      return;
    }
    setSavingWeight(true);
    try {
      await onAddWeight(parsed, weightNote);
      setWeightInput('');
      setWeightNote('');
    } catch (err) {
      setWeightError(err instanceof Error ? err.message : 'No se pudo registrar el peso.');
    } finally {
      setSavingWeight(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
          Progreso y tolerancia
        </h1>
        <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
          Seguimiento conservador de constancia, esfuerzo percibido y respuesta articular.
        </p>
      </div>

      {/* Top KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-2xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4">
          <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Racha semanal</div>
          <div className="mt-1 text-2xl font-bold font-mono-tabular">
            {summary.weeklyStreak} {summary.weeklyStreak === 1 ? 'semana' : 'semanas'}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4">
          <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Minutos esta semana</div>
          <div className="mt-1 text-2xl font-bold font-mono-tabular">
            {summary.weeklyMinutes} min
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4">
          <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Sesiones totales</div>
          <div className="mt-1 text-2xl font-bold font-mono-tabular">
            {summary.totalSessions}
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4">
          <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Tolerancia reciente</div>
          <div className="mt-1 text-sm font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
            {summary.toleranceLabel}
          </div>
        </div>
      </div>

      {/* Conservative Interpretive Summary */}
      <div className="rounded-3xl bg-[#EEF5F0] dark:bg-[#172821] border border-[#CFE0D5] dark:border-[#2A4236] p-5">
        <div className="text-xs font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
          Lectura conservadora
        </div>
        <p className="mt-1 text-sm sm:text-base text-[#173A2C] dark:text-[#D5DFD9]">
          {summary.conservativeNarrative}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Calendar */}
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1E4D3B] dark:text-[#6EE7B7]" />
              <span>
                {(() => {
                  const formatted = now.toLocaleDateString('es-419', {
                    month: 'long',
                    year: 'numeric',
                  });
                  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
                })()}
              </span>
            </h2>
            <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">
              Marcados = sesión completada
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-[#5B6860] dark:text-[#98A89F] mb-2">
            <span>L</span>
            <span>M</span>
            <span>X</span>
            <span>J</span>
            <span>V</span>
            <span>S</span>
            <span>D</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) =>
              cell.day === null ? (
                <div key={idx} className="h-9" />
              ) : (
                <div
                  key={idx}
                  aria-label={`Día ${cell.day}${cell.trained ? ', entrenamiento completado' : ''}`}
                  className={`h-9 rounded-xl flex items-center justify-center text-xs font-mono-tabular ${
                    cell.trained
                      ? 'bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-bold'
                      : cell.isToday
                        ? 'border border-[#1E4D3B] dark:border-[#6EE7B7] font-semibold'
                        : 'bg-[#F7F7F5] dark:bg-[#111815] text-[#5B6860] dark:text-[#98A89F]'
                  }`}
                >
                  {cell.day}
                </div>
              ),
            )}
          </div>
        </section>

        {/* Accessible Evolution Charts */}
        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-4">
          <h2 className="text-base font-bold">Evolución reciente (últimas sesiones)</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <MetricTrendChart
              title="Esfuerzo (1-10)"
              maxValue={10}
              data={recentChrono.map((s) => ({
                label: new Date(s.completedAt).toLocaleDateString('es-419', {
                  day: 'numeric',
                  month: 'numeric',
                }),
                value: s.rpe,
              }))}
              colorClass="bg-[#1E4D3B] dark:bg-[#6EE7B7]"
            />
            <MetricTrendChart
              title="Dolor rodilla (0-10)"
              maxValue={10}
              data={recentChrono.map((s) => ({
                label: new Date(s.completedAt).toLocaleDateString('es-419', {
                  day: 'numeric',
                  month: 'numeric',
                }),
                value: s.postKneePain,
              }))}
              colorClass="bg-[#0F766E] dark:bg-[#5EEAD4]"
            />
            <MetricTrendChart
              title="Dolor espalda (0-10)"
              maxValue={10}
              data={recentChrono.map((s) => ({
                label: new Date(s.completedAt).toLocaleDateString('es-419', {
                  day: 'numeric',
                  month: 'numeric',
                }),
                value: s.postBackPain,
              }))}
              colorClass="bg-[#B45309] dark:bg-[#FBBF24]"
            />
          </div>
        </section>
      </div>

      {/* Optional Weight Log & Session History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        <section className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-4">
          <div>
            <h2 className="text-base font-bold">Registro opcional de peso</h2>
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
              Solo seguimiento informativo en kilogramos.
            </p>
          </div>

          <form onSubmit={handleWeightSubmit} className="space-y-3">
            <div className="flex gap-2">
              <div className="w-32">
                <label htmlFor="w-kg" className="sr-only">
                  Peso en kilogramos
                </label>
                <input
                  id="w-kg"
                  type="number"
                  step="0.1"
                  min={30}
                  max={300}
                  required
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  placeholder="76.2 kg"
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="w-note" className="sr-only">
                  Nota opcional
                </label>
                <input
                  id="w-note"
                  type="text"
                  value={weightNote}
                  onChange={(e) => setWeightNote(e.target.value)}
                  placeholder="Nota breve (opcional)"
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={savingWeight}
                aria-label="Registrar peso"
                className="min-h-[44px] min-w-[44px] px-3.5 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] flex items-center justify-center"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {weightError && (
              <p className="text-xs text-rose-700 dark:text-rose-300">{weightError}</p>
            )}
          </form>

          {weights.length > 0 ? (
            <ul className="divide-y divide-[#EEF1EC] dark:divide-[#232E29] text-sm">
              {weights.slice(0, 6).map((w) => (
                <li key={w.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <span className="font-semibold font-mono-tabular">{w.weightKg} kg</span>
                    <span className="ml-2 text-xs text-[#5B6860] dark:text-[#98A89F]">
                      {new Date(w.recordedAt).toLocaleDateString('es-419', {
                        day: 'numeric',
                        month: 'short',
                      })}
                      {w.note ? ` · ${w.note}` : ''}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Eliminar registro de ${w.weightKg} kg`}
                    onClick={() => void onDeleteWeight(w.id)}
                    className="min-h-[38px] min-w-[38px] rounded-lg text-[#5B6860] hover:text-rose-700 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">Sin registros de peso aún.</p>
          )}
        </section>

        <section className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-3">
          <h2 className="text-base font-bold">Historial de sesiones y notas</h2>
          {sessions.length === 0 ? (
            <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
              Todavía no has completado sesiones.
            </p>
          ) : (
            <ul className="divide-y divide-[#EEF1EC] dark:divide-[#232E29]">
              {sessions.slice(0, 12).map((s) => (
                <li key={s.id} className="py-3.5 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-sm">{s.routineTitle}</span>
                    <span className="text-xs text-[#5B6860] dark:text-[#98A89F] font-mono-tabular">
                      {new Date(s.completedAt).toLocaleDateString('es-419', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                      })}{' '}
                      · {Math.max(1, Math.round(s.durationSeconds / 60))} min
                    </span>
                  </div>
                  <div className="text-xs text-[#5B6860] dark:text-[#98A89F] font-mono-tabular">
                    Esfuerzo {s.rpe}/10 · Rodilla {s.postKneePain}/10 · Espalda {s.postBackPain}/10
                  </div>
                  {s.note && (
                    <p className="text-xs text-[#2A3630] dark:text-[#D5DFD9]">“{s.note}”</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
};
