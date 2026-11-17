import React, { useState } from 'react';
import { api, ApiError } from '../utils/api.ts';
import type { FitnessLevel, GoalType, SensitiveZone, UserProfile } from '../shared/types.ts';

interface Props {
  user: UserProfile;
  aiAvailable: boolean;
  onComplete: (updated: UserProfile) => void;
}

const LEVELS: Array<{ value: FitnessLevel; label: string; desc: string }> = [
  { value: 'reinicio', label: 'Reinicio', desc: 'Retomando el movimiento con calma' },
  { value: 'principiante', label: 'Principiante', desc: 'Algo de base reciente sin impacto' },
  { value: 'intermedio', label: 'Intermedio', desc: 'Buena tolerancia a 2–3 rondas suaves' },
];

const GOALS: Array<{ value: GoalType; label: string }> = [
  { value: 'movilidad', label: 'Movilidad' },
  { value: 'fuerza_suave', label: 'Fuerza suave' },
  { value: 'volver_a_entrenar', label: 'Volver a entrenar' },
  { value: 'bienestar', label: 'Bienestar' },
];

const ZONES: Array<{ value: SensitiveZone; label: string }> = [
  { value: 'rodillas', label: 'Rodillas' },
  { value: 'espalda', label: 'Espalda' },
  { value: 'hombros', label: 'Hombros' },
  { value: 'otra', label: 'Otra zona' },
];

export const OnboardingWizard: React.FC<Props> = ({ user, aiAvailable, onComplete }) => {
  const [name, setName] = useState(user.name || '');
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [heightCm, setHeightCm] = useState(user.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user.weightKg ? String(user.weightKg) : '');
  const [level, setLevel] = useState<FitnessLevel>(user.level || 'reinicio');
  const [goal, setGoal] = useState<GoalType>(user.goal || 'bienestar');
  const [sensitiveZones, setSensitiveZones] = useState<SensitiveZone[]>(user.sensitiveZones || []);
  const [sensitiveNotes, setSensitiveNotes] = useState(user.sensitiveNotes || '');
  const [aiConsent, setAiConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleZone = (z: SensitiveZone) => {
    setSensitiveZones((prev) => (prev.includes(z) ? prev.filter((item) => item !== z) : [...prev, z]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await api.updateProfile({
        name,
        age: age ? Number(age) : null,
        heightCm: heightCm ? Number(heightCm) : null,
        weightKg: weightKg ? Number(weightKg) : null,
        level,
        goal,
        sensitiveZones,
        sensitiveNotes,
        aiConsent,
        onboardingCompleted: true,
      });
      onComplete(res.user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F7F7F5] dark:bg-[#0F1412] px-4 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto rounded-3xl bg-white dark:bg-[#171F1C] border border-[#E2E6E1] dark:border-[#27332E] p-6 sm:p-8 shadow-xs">
        <p className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7]">
          Configuración inicial · 1 minuto
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
          Adaptemos Mi Entrenamiento a ti
        </h1>
        <p className="mt-1.5 text-sm text-[#5B6860] dark:text-[#98A89F]">
          Tus datos permanecen en tu servidor privado. Esta información nos ayuda a sugerir un ritmo conservador.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="ob-name" className="block text-sm font-medium mb-1.5">
                Nombre o apodo
              </label>
              <input
                id="ob-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base"
              />
            </div>

            <div>
              <label htmlFor="ob-age" className="block text-sm font-medium mb-1.5">
                Edad (años)
              </label>
              <input
                id="ob-age"
                type="number"
                min={14}
                max={110}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ej. 38"
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="ob-height" className="block text-sm font-medium mb-1.5">
                Altura (cm)
              </label>
              <input
                id="ob-height"
                type="number"
                min={100}
                max={240}
                step="0.5"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                placeholder="Ej. 174"
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base tabular-nums"
              />
            </div>

            <div>
              <label htmlFor="ob-weight" className="block text-sm font-medium mb-1.5">
                Peso actual (kg)
              </label>
              <input
                id="ob-weight"
                type="number"
                min={30}
                max={300}
                step="0.1"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                placeholder="Ej. 75.5"
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base tabular-nums"
              />
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-2">Nivel actual</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {LEVELS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setLevel(item.value)}
                  className={`min-h-[56px] text-left rounded-2xl border p-3.5 transition-colors ${
                    level === item.value
                      ? 'border-[#1E4D3B] bg-[#1E4D3B]/8 dark:border-[#6EE7B7] dark:bg-[#6EE7B7]/12'
                      : 'border-[#DCE3DD] dark:border-[#2B3832] hover:bg-[#F7F7F5] dark:hover:bg-[#1C2622]'
                  }`}
                >
                  <div className="text-sm font-semibold">{item.label}</div>
                  <div className="text-xs text-[#5B6860] dark:text-[#98A89F] mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-2">Objetivo principal</span>
            <div className="grid grid-cols-2 gap-2.5">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGoal(g.value)}
                  className={`min-h-[46px] rounded-xl border px-3.5 py-2.5 text-sm font-medium text-left transition-colors ${
                    goal === g.value
                      ? 'border-[#1E4D3B] bg-[#1E4D3B]/8 dark:border-[#6EE7B7] dark:bg-[#6EE7B7]/12'
                      : 'border-[#DCE3DD] dark:border-[#2B3832]'
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-2">Zonas sensibles opcionales</span>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((z) => {
                const active = sensitiveZones.includes(z.value);
                return (
                  <button
                    key={z.value}
                    type="button"
                    onClick={() => toggleZone(z.value)}
                    className={`min-h-[44px] rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-[#1E4D3B] bg-[#1E4D3B] text-white dark:border-[#6EE7B7] dark:bg-[#6EE7B7] dark:text-[#0F1412]'
                        : 'border-[#DCE3DD] dark:border-[#2B3832] text-[#2A3630] dark:text-[#D5DFD9]'
                    }`}
                  >
                    {z.label}
                  </button>
                );
              })}
            </div>
            <label htmlFor="ob-notes" className="sr-only">
              Notas sobre zonas sensibles
            </label>
            <input
              id="ob-notes"
              type="text"
              value={sensitiveNotes}
              onChange={(e) => setSensitiveNotes(e.target.value)}
              placeholder="Nota breve opcional (ej. cuidar flexión profunda de rodilla derecha)"
              className="mt-3 w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-sm"
            />
          </div>

          <div className="rounded-2xl border border-[#DCE3DD] dark:border-[#2B3832] bg-[#F7F7F5] dark:bg-[#111815] p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                className="mt-1 w-5 h-5 rounded accent-[#1E4D3B]"
              />
              <span className="text-sm">
                <strong className="block font-medium">
                  Consentimiento opcional para asistente con IA (desactivado por defecto)
                </strong>
                <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                  {aiAvailable
                    ? 'Si lo activas, solo cuando pidas orientación se enviará tu perfil básico, rutina, adherencia, esfuerzo y dolor a Gemini en tu servidor.'
                    : 'Actualmente la IA está desactivada en el servidor (AI_ENABLED=false). Puedes dejarlo desmarcado.'}
                </span>
              </span>
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 px-3.5 py-2.5 text-sm text-rose-800 dark:text-rose-200"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full min-h-[50px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base hover:opacity-95 disabled:opacity-60 transition-opacity"
          >
            {saving ? 'Guardando perfil…' : 'Guardar y entrar a Mi Entrenamiento'}
          </button>
        </form>
      </div>
    </div>
  );
};
