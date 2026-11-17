import React, { useState } from 'react';
import {
  Bot,
  Download,
  LogOut,
  Moon,
  ShieldAlert,
  Smartphone,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';
import { MEDICAL_DISCLAIMER } from '../shared/safety.ts';
import type {
  AiRecommendationResponse,
  FitnessLevel,
  GoalType,
  Routine,
  SensitiveZone,
  TrainingProfileSummary,
  UserProfile,
} from '../shared/types.ts';
import { api, ApiError } from '../utils/api.ts';
import { IPhoneInstallModal, PWAInstallButton } from './PWAInstallBanner.tsx';

interface Props {
  user: UserProfile;
  summary: TrainingProfileSummary;
  routines: Routine[];
  aiAvailable: boolean;
  darkMode: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  onToggleDarkMode: () => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onProfileUpdated: (user: UserProfile) => void;
  onLogout: () => Promise<void>;
  onDeleteAccount: () => Promise<void>;
}

const AI_TYPE_LABELS: Record<AiRecommendationResponse['recommendationType'], string> = {
  mantener: 'Mantener plan actual',
  reducir_ronda: 'Reducir una ronda',
  aumentar_descanso: 'Aumentar descanso',
  elegir_movilidad: 'Elegir movilidad suave',
  consulta_profesional: 'Consulta profesional recomendada',
};

export const ProfileView: React.FC<Props> = ({
  user,
  summary,
  routines,
  aiAvailable,
  darkMode,
  soundEnabled,
  vibrationEnabled,
  onToggleDarkMode,
  onToggleSound,
  onToggleVibration,
  onProfileUpdated,
  onLogout,
  onDeleteAccount,
}) => {
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(user.age ? String(user.age) : '');
  const [heightCm, setHeightCm] = useState(user.heightCm ? String(user.heightCm) : '');
  const [weightKg, setWeightKg] = useState(user.weightKg ? String(user.weightKg) : '');
  const [level, setLevel] = useState<FitnessLevel>(user.level);
  const [goal, setGoal] = useState<GoalType>(user.goal);
  const [sensitiveZones, setSensitiveZones] = useState<SensitiveZone[]>(user.sensitiveZones);
  const [sensitiveNotes, setSensitiveNotes] = useState(user.sensitiveNotes);
  const [aiConsent, setAiConsent] = useState(user.aiConsent);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileErr, setProfileErr] = useState<string | null>(null);

  const [showIosModal, setShowIosModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Optional AI Advisor state (not persisted in DB)
  const [showAiConsentModal, setShowAiConsentModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AiRecommendationResponse | null>(null);

  const toggleZone = (z: SensitiveZone) => {
    setSensitiveZones((prev) => (prev.includes(z) ? prev.filter((item) => item !== z) : [...prev, z]));
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileErr(null);
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
      onProfileUpdated(res.user);
      setProfileMsg('Perfil actualizado correctamente.');
    } catch (err) {
      setProfileErr(err instanceof ApiError ? err.message : 'No se pudo actualizar tu perfil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleGrantConsentAndClose = async () => {
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
        aiConsent: true,
        onboardingCompleted: true,
      });
      setAiConsent(true);
      onProfileUpdated(res.user);
      setShowAiConsentModal(false);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : 'Error al guardar el consentimiento.');
    }
  };

  const handleAskAi = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiError(null);
    if (!user.aiConsent) {
      setShowAiConsentModal(true);
      return;
    }
    setAiLoading(true);
    try {
      const todayJs = new Date().getDay();
      const todayNum = todayJs === 0 ? 7 : todayJs;
      const todayRoutine = routines.find((r) => r.dayOfWeek === todayNum);
      const res = await api.askAiAdvisor({
        question: aiQuestion,
        routineId: todayRoutine?.id,
      });
      setAiResult(res.advice);
    } catch (err) {
      setAiError(err instanceof ApiError ? err.message : 'No se pudo consultar al asistente.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
            Perfil y ajustes
          </h1>
          <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
            Cuenta privada ({user.email}) · Datos almacenados localmente en tu servidor.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void onLogout()}
          className="min-h-[44px] px-4 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium inline-flex items-center gap-2 hover:bg-[#EEF2EE] dark:hover:bg-[#1E2924]"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar sesión</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Training Profile & BMI Info + Preferences + Privacy */}
        <div className="lg:col-span-5 space-y-5">
          {/* Training Profile & BMI */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-4">
            <h2 className="text-base font-bold">Perfil de entrenamiento</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
                <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Adherencia</div>
                <div className="mt-1 text-sm font-semibold">{summary.adherenceLabel}</div>
              </div>
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
                <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Tolerancia</div>
                <div className="mt-1 text-sm font-semibold">{summary.toleranceLabel}</div>
              </div>
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
                <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">Esfuerzo medio</div>
                <div className="mt-1 text-lg font-bold font-mono-tabular">
                  {summary.avgEffort !== null ? `${summary.avgEffort}/10` : '—'}
                </div>
              </div>
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
                <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">IMC informativo</div>
                <div className="mt-1 text-lg font-bold font-mono-tabular">
                  {summary.bmi !== null ? summary.bmi : '—'}
                </div>
              </div>
            </div>
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F] leading-relaxed">
              {summary.bmiNote}
            </p>
          </section>

          {/* App & PWA Settings */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-3">
            <h2 className="text-base font-bold">Preferencias e instalación en iPhone</h2>

            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2.5 text-sm">
                {darkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                <span>Apariencia oscura</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={darkMode}
                onClick={onToggleDarkMode}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${
                  darkMode
                    ? 'bg-[#6EE7B7] text-[#0F1412] border-[#6EE7B7]'
                    : 'border-[#D4DDD7] text-[#2A3630]'
                }`}
              >
                {darkMode ? 'Oscuro' : 'Claro'}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[#EEF1EC] dark:border-[#232E29]">
              <div className="flex items-center gap-2.5 text-sm">
                <Volume2 className="w-4 h-4" />
                <span>Avisos sonoros en temporizador</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={soundEnabled}
                onClick={onToggleSound}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${
                  soundEnabled
                    ? 'bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] border-transparent'
                    : 'border-[#D4DDD7] dark:border-[#2C3A33]'
                }`}
              >
                {soundEnabled ? 'Activados' : 'Silenciados'}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-[#EEF1EC] dark:border-[#232E29]">
              <div className="text-sm">Vibración suave (si el navegador la permite)</div>
              <button
                type="button"
                role="switch"
                aria-checked={vibrationEnabled}
                onClick={onToggleVibration}
                className={`min-h-[40px] px-4 rounded-xl text-xs font-semibold border ${
                  vibrationEnabled
                    ? 'bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] border-transparent'
                    : 'border-[#D4DDD7] dark:border-[#2C3A33]'
                }`}
              >
                {vibrationEnabled ? 'Activada' : 'Desactivada'}
              </button>
            </div>

            <div className="pt-2 border-t border-[#EEF1EC] dark:border-[#232E29] flex flex-wrap gap-2">
              <PWAInstallButton />
              <button
                type="button"
                onClick={() => setShowIosModal(true)}
                className="min-h-[44px] px-3.5 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-xs font-medium inline-flex items-center gap-1.5"
              >
                <Smartphone className="w-4 h-4" />
                <span>Guía Safari iPhone</span>
              </button>
            </div>
          </section>

          {/* Data Export & Account Deletion */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 space-y-3">
            <h2 className="text-base font-bold">Privacidad y tus datos</h2>
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
              No hay analítica, rastreadores ni envío automático de datos de salud. Puedes exportar o eliminar todo en cualquier momento.
            </p>

            <a
              href="/api/account/export"
              download
              className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#F7F7F5] dark:hover:bg-[#1E2924]"
            >
              <Download className="w-4 h-4" />
              <span>Exportar todos mis datos (JSON)</span>
            </a>

            {!confirmDelete ? (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="w-full min-h-[46px] rounded-xl border border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="w-4 h-4" />
                <span>Borrar cuenta y todos los datos</span>
              </button>
            ) : (
              <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-800 p-4 space-y-3">
                <p className="text-xs font-medium text-rose-900 dark:text-rose-100">
                  Esta acción eliminará permanentemente tu cuenta, rutinas, historial de sesiones y registros de peso de la base SQLite.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 min-h-[42px] rounded-xl border border-[#D4DDD7] bg-white dark:bg-[#171F1C] text-xs font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={deleting}
                    onClick={() => void handleDeleteAccount()}
                    className="flex-1 min-h-[42px] rounded-xl bg-rose-700 text-white text-xs font-semibold"
                  >
                    {deleting ? 'Borrando…' : 'Confirmar borrado'}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Right: Editable Profile Form + Optional AI Assistant */}
        <div className="lg:col-span-7 space-y-5">
          <form
            onSubmit={handleProfileSave}
            className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 space-y-4"
          >
            <h2 className="text-base font-bold">Datos personales</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="pf-name" className="block text-xs font-medium mb-1">
                  Nombre o apodo
                </label>
                <input
                  id="pf-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                />
              </div>
              <div>
                <label htmlFor="pf-age" className="block text-xs font-medium mb-1">
                  Edad
                </label>
                <input
                  id="pf-age"
                  type="number"
                  min={14}
                  max={110}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="pf-height" className="block text-xs font-medium mb-1">
                  Altura (cm)
                </label>
                <input
                  id="pf-height"
                  type="number"
                  min={100}
                  max={240}
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="pf-weight" className="block text-xs font-medium mb-1">
                  Peso (kg)
                </label>
                <input
                  id="pf-weight"
                  type="number"
                  min={30}
                  max={300}
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="pf-level" className="block text-xs font-medium mb-1">
                  Nivel actual
                </label>
                <select
                  id="pf-level"
                  value={level}
                  onChange={(e) => setLevel(e.target.value as FitnessLevel)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                >
                  <option value="reinicio">Reinicio</option>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                </select>
              </div>
              <div>
                <label htmlFor="pf-goal" className="block text-xs font-medium mb-1">
                  Objetivo principal
                </label>
                <select
                  id="pf-goal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value as GoalType)}
                  className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                >
                  <option value="movilidad">Movilidad</option>
                  <option value="fuerza_suave">Fuerza suave</option>
                  <option value="volver_a_entrenar">Volver a entrenar</option>
                  <option value="bienestar">Bienestar</option>
                </select>
              </div>
            </div>

            <div>
              <span className="block text-xs font-medium mb-1.5">Zonas sensibles opcionales</span>
              <div className="flex flex-wrap gap-2">
                {(['rodillas', 'espalda', 'hombros', 'otra'] as SensitiveZone[]).map((z) => {
                  const active = sensitiveZones.includes(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleZone(z)}
                      className={`min-h-[40px] px-3.5 rounded-xl border text-xs font-medium capitalize ${
                        active
                          ? 'bg-[#1E4D3B] text-white border-[#1E4D3B] dark:bg-[#6EE7B7] dark:text-[#0F1412] dark:border-[#6EE7B7]'
                          : 'border-[#DCE3DD] dark:border-[#2B3832]'
                      }`}
                    >
                      {z}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                aria-label="Notas sobre zonas sensibles"
                value={sensitiveNotes}
                onChange={(e) => setSensitiveNotes(e.target.value)}
                placeholder="Notas adicionales sobre tus zonas sensibles"
                className="mt-2.5 w-full min-h-[42px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={aiConsent}
                onChange={(e) => setAiConsent(e.target.checked)}
                className="w-4 h-4 accent-[#1E4D3B]"
              />
              <span>Autorizar uso opcional del asistente con IA (solo al enviar consulta)</span>
            </label>

            {profileMsg && (
              <p className="text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7]">
                {profileMsg}
              </p>
            )}
            {profileErr && (
              <p className="text-xs font-medium text-rose-700 dark:text-rose-300">{profileErr}</p>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="min-h-[46px] px-6 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-semibold"
            >
              {savingProfile ? 'Guardando…' : 'Guardar cambios del perfil'}
            </button>
          </form>

          {/* Optional Gemini AI Assistant */}
          <section className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#1E4D3B] dark:text-[#6EE7B7]" />
                  <h2 className="text-base font-bold">Asistente opcional de entrenamiento</h2>
                </div>
                <p className="mt-1 text-xs font-medium text-[#1E4D3B] dark:text-[#6EE7B7]">
                  Orientación de entrenamiento, no consejo médico.
                </p>
              </div>
              <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                {aiAvailable ? 'Disponible en servidor' : 'Desactivado (AI_ENABLED=false)'}
              </span>
            </div>

            {!aiAvailable ? (
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4 text-xs text-[#5B6860] dark:text-[#98A89F]">
                La integración opcional con Gemini está desactivada por defecto en tu servidor (
                <code>AI_ENABLED=false</code>). Tus datos no salen de tu instancia local. Si algún día deseas activarla, configura <code>AI_ENABLED=true</code> y <code>GEMINI_API_KEY</code> en el backend.
              </div>
            ) : !user.aiConsent ? (
              <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-4 space-y-3">
                <p className="text-xs text-[#2A3630] dark:text-[#D5DFD9] leading-relaxed">
                  El consentimiento para IA está desactivado. Antes de enviar cualquier dato, revisa qué información se compartirá únicamente durante la consulta (no se guarda el historial de conversación).
                </p>
                <button
                  type="button"
                  onClick={() => setShowAiConsentModal(true)}
                  className="min-h-[44px] px-4 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-xs font-semibold"
                >
                  Revisar consentimiento de IA
                </button>
              </div>
            ) : (
              <form onSubmit={handleAskAi} className="space-y-3">
                <label htmlFor="ai-question" className="block text-xs font-medium">
                  Pregunta sobre tu ritmo o ajuste conservador (no se guarda historial)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    id="ai-question"
                    type="text"
                    required
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="Ej. Hoy sentí algo cargada la rodilla en 2/10, ¿mantengo o bajo?"
                    className="flex-1 min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-sm"
                  />
                  <button
                    type="submit"
                    disabled={aiLoading}
                    className="min-h-[46px] px-5 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-semibold whitespace-nowrap"
                  >
                    {aiLoading ? 'Consultando…' : 'Consultar'}
                  </button>
                </div>

                {aiError && (
                  <p className="text-xs text-rose-700 dark:text-rose-300">{aiError}</p>
                )}

                {aiResult && (
                  <div className="rounded-2xl border border-[#CFE0D5] dark:border-[#2A4236] bg-[#EEF5F0] dark:bg-[#172821] p-4 space-y-2.5 text-sm">
                    <div className="font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
                      Sugerencia: {AI_TYPE_LABELS[aiResult.recommendationType]}
                    </div>
                    <p className="font-medium text-[#17201B] dark:text-[#ECF1ED]">
                      {aiResult.summary}
                    </p>
                    <p className="text-xs text-[#2A3630] dark:text-[#D5DFD9]">
                      {aiResult.rationale}
                    </p>
                    <ul className="list-disc list-inside text-xs space-y-1 text-[#2A3630] dark:text-[#D5DFD9]">
                      {aiResult.suggestedAdjustments.map((adj, idx) => (
                        <li key={idx}>{adj}</li>
                      ))}
                    </ul>
                    <div className="pt-2 border-t border-[#CFE0D5] dark:border-[#2A4236] text-[11px] text-[#5B6860] dark:text-[#98A89F]">
                      {aiResult.safetyNote} · {aiResult.medicalDisclaimer}
                    </div>
                  </div>
                )}
              </form>
            )}
          </section>
        </div>
      </div>

      {/* Explicit AI Consent Disclosure Modal */}
      {showAiConsentModal && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="ai-consent-title"
        >
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-[#1E4D3B] dark:text-[#6EE7B7]">
              <ShieldAlert className="w-5 h-5" />
              <h3 id="ai-consent-title" className="text-lg font-bold text-[#17201B] dark:text-[#ECF1ED]">
                Consentimiento explícito para IA
              </h3>
            </div>
            <p className="text-xs text-[#2A3630] dark:text-[#D5DFD9] leading-relaxed">
              Si aceptas, únicamente cuando envíes una pregunta se enviarán a Gemini desde el servidor los siguientes datos:
            </p>
            <ul className="text-xs space-y-1 list-disc list-inside text-[#5B6860] dark:text-[#98A89F]">
              <li>Nombre/apodo, edad, altura, peso, nivel, objetivo y zonas sensibles.</li>
              <li>Rutina del día (título, rondas y tiempos de trabajo/descanso).</li>
              <li>Adherencia semanal, esfuerzo percibido (RPE) y dolor reportado (0–10).</li>
            </ul>
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
              No se envían contraseñas ni correo, y no se guarda el texto completo de tus conversaciones. {MEDICAL_DISCLAIMER}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAiConsentModal(false)}
                className="flex-1 min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium"
              >
                Mantener desactivado
              </button>
              <button
                type="button"
                onClick={() => void handleGrantConsentAndClose()}
                className="flex-1 min-h-[46px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-semibold"
              >
                Aceptar y activar
              </button>
            </div>
          </div>
        </div>
      )}

      <IPhoneInstallModal open={showIosModal} onClose={() => setShowIosModal(false)} />
    </div>
  );
};
