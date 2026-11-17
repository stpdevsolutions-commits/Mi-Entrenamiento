import React, { useState } from 'react';
import { Download, Share, Smartphone, WifiOff, X } from 'lucide-react';
import { usePWAInstall } from '../utils/usePWAInstall.ts';
import { useOnlineStatus } from '../utils/useOnlineStatus.ts';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div
      role="status"
      className="bg-amber-50 dark:bg-amber-950/70 border-b border-amber-200 dark:border-amber-800 px-4 py-2 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-center gap-2"
    >
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Modo sin conexión: tus rutinas guardadas, temporizador y guías vistas siguen disponibles.</span>
    </div>
  );
};

export const IPhoneInstallModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
    >
      <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#171F1C] border border-[#E2E6E1] dark:border-[#2A3630] p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1E4D3B]/10 dark:bg-[#6EE7B7]/15 text-[#1E4D3B] dark:text-[#6EE7B7] flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ios-install-title" className="text-lg font-semibold text-[#17201B] dark:text-[#ECF1ED]">
                Instalar en iPhone (Safari)
              </h2>
              <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                Acceso directo a pantalla completa y modo sin conexión
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar instrucciones para iPhone"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5B6860] hover:bg-[#EEF2EE] dark:text-[#98A89F] dark:hover:bg-[#24302A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mt-5 space-y-3 text-sm text-[#2A3630] dark:text-[#D5DFD9]">
          <li className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F7F5] dark:bg-[#111815]">
            <span className="w-6 h-6 rounded-lg bg-[#1E4D3B] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              1
            </span>
            <span>
              Abre esta aplicación en <strong>Safari</strong> (iOS no permite instalar desde otros navegadores).
            </span>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F7F5] dark:bg-[#111815]">
            <span className="w-6 h-6 rounded-lg bg-[#1E4D3B] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              2
            </span>
            <span className="flex items-center gap-1.5 flex-wrap">
              Toca el botón <Share className="w-4 h-4 inline text-[#1E4D3B] dark:text-[#6EE7B7]" />{' '}
              <strong>Compartir</strong> en la barra inferior de Safari.
            </span>
          </li>
          <li className="flex items-start gap-3 p-3 rounded-2xl bg-[#F7F7F5] dark:bg-[#111815]">
            <span className="w-6 h-6 rounded-lg bg-[#1E4D3B] text-white text-xs font-semibold flex items-center justify-center shrink-0">
              3
            </span>
            <span>
              Desliza hacia abajo y elige <strong>Añadir a pantalla de inicio</strong>, luego confirma con{' '}
              <strong>Añadir</strong>.
            </span>
          </li>
        </ol>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full min-h-[48px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-sm hover:opacity-95 transition-opacity"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#1E4D3B] px-4 py-2 text-sm font-medium text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] hover:opacity-95 transition-opacity whitespace-nowrap shrink-0"
      >
        <Download className="w-4 h-4" />
        <span>{compact ? 'Instalar' : 'Instalar aplicación'}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowIOSGuide(true)}
        className="min-h-[44px] inline-flex items-center gap-2 rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] px-3.5 py-2 text-xs sm:text-sm font-medium text-[#1E4D3B] dark:text-[#A7E3C1] hover:bg-[#EEF2EE] dark:hover:bg-[#1E2924] transition-colors whitespace-nowrap shrink-0"
      >
        <Smartphone className="w-4 h-4" />
        <span>{isIOS ? 'Instalar en iPhone' : 'Instalar app'}</span>
      </button>
      <IPhoneInstallModal open={showIOSGuide} onClose={() => setShowIOSGuide(false)} />
    </>
  );
};
