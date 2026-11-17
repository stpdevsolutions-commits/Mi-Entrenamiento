import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Edit3,
  Play,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from 'lucide-react';
import type { Exercise, Routine, RoutineExerciseItem } from '../shared/types.ts';

interface Props {
  routines: Routine[];
  exercisesCatalog: Exercise[];
  onStartPreCheck: (routine: Routine) => void;
  onSaveRoutine: (routine: Routine) => Promise<void>;
  onResetRoutines: () => Promise<void>;
}

export const TrainView: React.FC<Props> = ({
  routines,
  exercisesCatalog,
  onStartPreCheck,
  onSaveRoutine,
  onResetRoutines,
}) => {
  const todayJs = new Date().getDay();
  const todayNum = todayJs === 0 ? 7 : todayJs;
  const [selectedDay, setSelectedDay] = useState<number>(todayNum);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Routine | null>(null);
  const [newExerciseId, setNewExerciseId] = useState<string>(exercisesCatalog[0]?.id ?? '');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeRoutine =
    routines.find((r) => r.dayOfWeek === selectedDay) ?? routines[0];

  const startEditing = () => {
    if (!activeRoutine) return;
    setDraft(JSON.parse(JSON.stringify(activeRoutine)) as Routine);
    setEditing(true);
    setStatusMessage(null);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    setSaving(true);
    setStatusMessage(null);
    try {
      await onSaveRoutine(draft);
      setEditing(false);
      setDraft(null);
      setStatusMessage('Rutina guardada correctamente.');
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'No se pudo guardar la rutina.');
    } finally {
      setSaving(false);
    }
  };

  const moveExercise = (index: number, dir: -1 | 1) => {
    if (!draft) return;
    const target = index + dir;
    if (target < 0 || target >= draft.exercises.length) return;
    const next = [...draft.exercises];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    setDraft({ ...draft, exercises: next });
  };

  const removeExercise = (index: number) => {
    if (!draft) return;
    setDraft({
      ...draft,
      exercises: draft.exercises.filter((_, i) => i !== index),
    });
  };

  const addExercise = () => {
    if (!draft) return;
    const catalogEx = exercisesCatalog.find((e) => e.id === newExerciseId);
    if (!catalogEx) return;
    const item: RoutineExerciseItem = {
      id: `item-${Date.now()}`,
      exerciseId: catalogEx.id,
      name: catalogEx.name,
      workSeconds: draft.defaultWorkSeconds || catalogEx.defaultDurationSec,
      restSeconds: draft.defaultRestSeconds,
    };
    setDraft({
      ...draft,
      isRestDay: false,
      exercises: [...draft.exercises, item],
    });
  };

  const handleResetAll = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await onResetRoutines();
      setEditing(false);
      setDraft(null);
      setStatusMessage('Rutinas restauradas a la planificación inicial.');
    } finally {
      setSaving(false);
    }
  };

  if (!activeRoutine) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
            Plan semanal de entrenamiento
          </h1>
          <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
            Rutinas editables de lunes a domingo con progresión gradual y pausas incluidas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleResetAll}
          disabled={saving}
          className="min-h-[44px] px-3.5 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EEF2EE] dark:hover:bg-[#1E2924]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar rutinas iniciales</span>
        </button>
      </div>

      {/* Day selector scroller */}
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        role="tablist"
        aria-label="Días de la semana"
      >
        {routines.map((r) => {
          const isSelected = r.dayOfWeek === selectedDay;
          const isToday = r.dayOfWeek === todayNum;
          return (
            <button
              key={r.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => {
                setSelectedDay(r.dayOfWeek);
                setEditing(false);
                setDraft(null);
                setStatusMessage(null);
              }}
              className={`min-h-[46px] px-4 rounded-2xl text-sm font-medium whitespace-nowrap shrink-0 border transition-colors ${
                isSelected
                  ? 'bg-[#1E4D3B] text-white border-[#1E4D3B] dark:bg-[#6EE7B7] dark:text-[#0F1412] dark:border-[#6EE7B7]'
                  : 'bg-white dark:bg-[#171F1C] border-[#DCE3DD] dark:border-[#2B3832] text-[#2A3630] dark:text-[#D5DFD9]'
              }`}
            >
              {r.dayName}
              {isToday ? ' · Hoy' : ''}
            </button>
          );
        })}
      </div>

      {statusMessage && (
        <div
          role="status"
          className="rounded-2xl bg-[#EEF5F0] dark:bg-[#172821] border border-[#CFE0D5] dark:border-[#2A4236] px-4 py-3 text-sm text-[#173A2C] dark:text-[#C5EBD6]"
        >
          {statusMessage}
        </div>
      )}

      {!editing ? (
        <div className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 shadow-xs space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                {activeRoutine.warmupMinutes} min calentamiento · {activeRoutine.mainMinutes} min rutina ·{' '}
                {activeRoutine.cooldownMinutes} min vuelta a la calma
              </div>
              <h2 className="mt-1 text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
                {activeRoutine.title}
              </h2>
              <p className="mt-1 text-sm text-[#5B6860] dark:text-[#98A89F]">
                {activeRoutine.subtitle}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={startEditing}
                className="min-h-[44px] px-4 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#F7F7F5] dark:hover:bg-[#1E2924]"
              >
                <Edit3 className="w-4 h-4" />
                <span>Editar rutina</span>
              </button>

              {!activeRoutine.isRestDay && activeRoutine.exercises.length > 0 && (
                <button
                  type="button"
                  onClick={() => onStartPreCheck(activeRoutine)}
                  className="min-h-[44px] px-5 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar</span>
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4 text-sm text-[#2A3630] dark:text-[#D5DFD9]">
            {activeRoutine.progressionNote}
          </div>

          {activeRoutine.isRestDay || activeRoutine.exercises.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#5B6860] dark:text-[#98A89F]">
              Día destinado a descanso activo o caminata tranquila opcional. Puedes editar este día si deseas añadir movilidad.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-[#5B6860] dark:text-[#98A89F]">
                <span>Bloque principal ({activeRoutine.rounds} rondas)</span>
                <span className="font-mono-tabular">
                  Formato base: {activeRoutine.defaultWorkSeconds}s trabajo /{' '}
                  {activeRoutine.defaultRestSeconds}s descanso
                </span>
              </div>

              <ol className="divide-y divide-[#EEF1EC] dark:divide-[#232E29]">
                {activeRoutine.exercises.map((ex, idx) => (
                  <li key={ex.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm sm:text-base text-[#17201B] dark:text-[#ECF1ED]">
                        {idx + 1}. {ex.name}
                      </div>
                      {ex.notes && (
                        <div className="text-xs text-[#5B6860] dark:text-[#98A89F] mt-0.5">
                          {ex.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-xs font-mono-tabular text-[#1E4D3B] dark:text-[#6EE7B7] shrink-0">
                      {ex.workSeconds}s · {ex.restSeconds}s desc.
                    </div>
                  </li>
                ))}
              </ol>

              <button
                type="button"
                onClick={() => onStartPreCheck(activeRoutine)}
                className="mt-2 w-full min-h-[52px] rounded-2xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                <span>Comenzar {activeRoutine.title}</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        draft && (
          <form
            onSubmit={handleSave}
            className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 shadow-xs space-y-5"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Editando {draft.dayName}</h2>
              <button
                type="button"
                onClick={cancelEditing}
                className="min-h-[44px] px-4 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-title" className="block text-xs font-medium mb-1">
                  Título
                </label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="edit-sub" className="block text-xs font-medium mb-1">
                  Subtítulo
                </label>
                <input
                  id="edit-sub"
                  type="text"
                  value={draft.subtitle}
                  onChange={(e) => setDraft({ ...draft, subtitle: e.target.value })}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label htmlFor="edit-rounds" className="block text-xs font-medium mb-1">
                  Rondas
                </label>
                <input
                  id="edit-rounds"
                  type="number"
                  min={1}
                  max={6}
                  value={draft.rounds}
                  onChange={(e) => setDraft({ ...draft, rounds: Number(e.target.value) })}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="edit-work" className="block text-xs font-medium mb-1">
                  Trabajo base (s)
                </label>
                <input
                  id="edit-work"
                  type="number"
                  min={10}
                  max={600}
                  value={draft.defaultWorkSeconds}
                  onChange={(e) =>
                    setDraft({ ...draft, defaultWorkSeconds: Number(e.target.value) })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="edit-rest" className="block text-xs font-medium mb-1">
                  Descanso base (s)
                </label>
                <input
                  id="edit-rest"
                  type="number"
                  min={0}
                  max={180}
                  value={draft.defaultRestSeconds}
                  onChange={(e) =>
                    setDraft({ ...draft, defaultRestSeconds: Number(e.target.value) })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="edit-warmup" className="block text-xs font-medium mb-1">
                  Calentamiento (min)
                </label>
                <input
                  id="edit-warmup"
                  type="number"
                  min={0}
                  max={30}
                  value={draft.warmupMinutes}
                  onChange={(e) => setDraft({ ...draft, warmupMinutes: Number(e.target.value) })}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-sm font-semibold">Ejercicios de la rutina</div>
              {draft.exercises.map((item, idx) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#DCE3DD] dark:border-[#2B3832] p-3 flex flex-col sm:flex-row sm:items-center gap-3 justify-between"
                >
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs flex items-center gap-1">
                      <span>Trab:</span>
                      <input
                        type="number"
                        min={10}
                        max={600}
                        value={item.workSeconds}
                        onChange={(e) => {
                          const updated = [...draft.exercises];
                          updated[idx] = { ...item, workSeconds: Number(e.target.value) };
                          setDraft({ ...draft, exercises: updated });
                        }}
                        className="w-16 min-h-[38px] rounded-lg border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-2 text-xs tabular-nums"
                      />
                    </label>
                    <label className="text-xs flex items-center gap-1">
                      <span>Desc:</span>
                      <input
                        type="number"
                        min={0}
                        max={180}
                        value={item.restSeconds}
                        onChange={(e) => {
                          const updated = [...draft.exercises];
                          updated[idx] = { ...item, restSeconds: Number(e.target.value) };
                          setDraft({ ...draft, exercises: updated });
                        }}
                        className="w-16 min-h-[38px] rounded-lg border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-2 text-xs tabular-nums"
                      />
                    </label>
                    <button
                      type="button"
                      aria-label={`Subir ${item.name}`}
                      onClick={() => moveExercise(idx, -1)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-[#D4DDD7] dark:border-[#2C3A33] flex items-center justify-center"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Bajar ${item.name}`}
                      onClick={() => moveExercise(idx, 1)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-[#D4DDD7] dark:border-[#2C3A33] flex items-center justify-center"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={`Quitar ${item.name}`}
                      onClick={() => removeExercise(idx)}
                      className="min-h-[38px] min-w-[38px] rounded-lg border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <select
                  aria-label="Seleccionar ejercicio para añadir"
                  value={newExerciseId}
                  onChange={(e) => setNewExerciseId(e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                >
                  {exercisesCatalog.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={addExercise}
                  className="min-h-[44px] px-4 rounded-xl border border-[#1E4D3B] dark:border-[#6EE7B7] text-[#1E4D3B] dark:text-[#6EE7B7] text-sm font-medium inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir ejercicio</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full min-h-[48px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-sm flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando cambios…' : 'Guardar rutina'}</span>
            </button>
          </form>
        )
      )}
    </div>
  );
};
