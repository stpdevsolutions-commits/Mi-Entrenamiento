import React, { useState } from 'react';
import { Lock, ShieldCheck } from 'lucide-react';
import { api, ApiError } from '../utils/api.ts';
import type { HealthResponse } from '../utils/api.ts';
import type { UserProfile } from '../shared/types.ts';
import { PWAInstallButton } from './PWAInstallBanner.tsx';

interface Props {
  health: HealthResponse | null;
  onAuthenticated: (user: UserProfile, aiEnabled: boolean) => void;
}

export const AuthScreen: React.FC<Props> = ({ health, onAuthenticated }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canRegister = health?.registrationAllowed !== false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        onAuthenticated(res.user, res.aiEnabled);
      } else {
        const res = await api.register(email, password, name);
        onAuthenticated(res.user, res.aiEnabled);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo completar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const res = await api.login('atleta@mi-entrenamiento.local', 'Calistenia2026!');
      onAuthenticated(res.user, res.aiEnabled);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo iniciar la sesión de ejemplo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh bg-[#F7F7F5] dark:bg-[#0F1412] flex flex-col justify-between p-4 sm:p-8">
      <div className="max-w-md w-full mx-auto pt-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#1E4D3B] text-white flex items-center justify-center font-bold text-sm">
            ME
          </div>
          <span className="font-semibold text-base tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
            Mi Entrenamiento
          </span>
        </div>
        <PWAInstallButton compact />
      </div>

      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div className="rounded-3xl bg-white dark:bg-[#171F1C] border border-[#E2E6E1] dark:border-[#27332E] p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 text-xs text-[#5B6860] dark:text-[#98A89F]">
            <Lock className="w-3.5 h-3.5" />
            <span>Espacio privado autohospedado</span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
            {mode === 'login' ? 'Inicia sesión en tu práctica' : 'Crea tu cuenta personal'}
          </h1>
          <p className="mt-1.5 text-sm text-[#5B6860] dark:text-[#98A89F]">
            Calistenia suave, movilidad y control conservador de progreso sin rastreadores externos.
          </p>

          {canRegister && (
            <div className="mt-5 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F0F2EF] dark:bg-[#101613]">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  mode === 'login'
                    ? 'bg-white dark:bg-[#1E2924] text-[#17201B] dark:text-[#ECF1ED] shadow-xs'
                    : 'text-[#5B6860] dark:text-[#98A89F]'
                }`}
              >
                Iniciar sesión
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`min-h-[44px] rounded-lg text-sm font-medium transition-colors ${
                  mode === 'register'
                    ? 'bg-white dark:bg-[#1E2924] text-[#17201B] dark:text-[#ECF1ED] shadow-xs'
                    : 'text-[#5B6860] dark:text-[#98A89F]'
                }`}
              >
                Crear cuenta
              </button>
            </div>
          )}

          {!canRegister && (
            <div className="mt-4 rounded-xl bg-[#F0F2EF] dark:bg-[#111815] p-3 text-xs text-[#5B6860] dark:text-[#98A89F]">
              El registro público está desactivado en este servidor privado.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-sm font-medium text-[#2A3630] dark:text-[#D5DFD9] mb-1.5"
                >
                  Nombre o apodo
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Laura"
                  className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base text-[#17201B] dark:text-[#ECF1ED] focus:outline-2 focus:outline-[#1E4D3B]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-sm font-medium text-[#2A3630] dark:text-[#D5DFD9] mb-1.5"
              >
                Correo electrónico
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.local"
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base text-[#17201B] dark:text-[#ECF1ED] focus:outline-2 focus:outline-[#1E4D3B]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-sm font-medium text-[#2A3630] dark:text-[#D5DFD9] mb-1.5"
              >
                Contraseña
              </label>
              <input
                id="auth-password"
                type="password"
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, letra y número"
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-base text-[#17201B] dark:text-[#ECF1ED] focus:outline-2 focus:outline-[#1E4D3B]"
              />
              {mode === 'register' && (
                <p className="mt-1 text-xs text-[#5B6860] dark:text-[#98A89F]">
                  Usa al menos 8 caracteres combinando letras y números.
                </p>
              )}
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
              disabled={submitting}
              className="w-full min-h-[48px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-base hover:opacity-95 disabled:opacity-60 transition-opacity"
            >
              {submitting
                ? 'Ingresando…'
                : mode === 'login'
                  ? 'Iniciar sesión'
                  : 'Crear cuenta y comenzar'}
            </button>
          </form>

          {health?.demoAvailable && (
            <div className="mt-5 pt-5 border-t border-[#E6EAE4] dark:border-[#25312B]">
              <button
                type="button"
                disabled={submitting}
                onClick={handleDemoLogin}
                className="w-full min-h-[46px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] text-sm font-medium text-[#1E4D3B] dark:text-[#A7E3C1] hover:bg-[#F0F4F1] dark:hover:bg-[#1D2823] transition-colors"
              >
                Entrar con cuenta de ejemplo (datos iniciales)
              </button>
              <p className="mt-2 text-[11px] text-center text-[#64736A] dark:text-[#8E9F95]">
                Demo local: atleta@mi-entrenamiento.local · Calistenia2026!
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto pb-4 text-center text-xs text-[#64736A] dark:text-[#8E9F95] flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-4 h-4 shrink-0" />
        <span>Uso personal conservador. No sustituye valoración médica o fisioterapéutica.</span>
      </footer>
    </div>
  );
};
