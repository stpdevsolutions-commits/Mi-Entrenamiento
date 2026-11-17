import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { evaluatePreWorkoutSafety } from '../shared/safety.ts';
import type { PreCheckInput, Routine, SafetyEvaluation } from '../shared/types.ts';

interface Props {
  open: boolean;
  routine: Routine;
  mobilityRoutine: Routine | null;
  onClose: () => void;
  onProceed: (selectedRoutine: Routine, preCheck: PreCheckInput, evaluation: SafetyEvaluation) => void;
}

const RED_FLAG_LABELS: Array<{ key: keyof PreCheckInput['redFlags']; label: string }> = [
  { key: 'severePain', label: 'Dolor intenso o agudo en reposo' },
  { key: 'swollenHotKnee', label: 'Rodilla inflamada, enrojecida o caliente' },
  { key: 'cannotBearWeight', label: 'Incapacidad de apoyar peso sobre una pierna' },
  { key: 'kneeLocking', label: 'Bloqueo de rodilla o sensación de traba' },
  { key: 'significantWeakness', label: 'Debilidad importante repentina en pierna o brazo' },
  { key: 'numbness', label: 'Entumecimiento u hormigueo nuevo' },
  { key: 'bladderBowelLoss', label: 'Pérdida de control de vejiga o intestino' },
];

export const PreWorkoutCheckModal: React.FC<Props> = ({
  open,
  routine,
  mobilityRoutine,
  onClose,
  onProceed,
}) => {
  const [energy, setEnergy] = useState(4);
  const [kneePain, setKneePain] = useState(1);
  const [backPain, setBackPain] = useState(1);
  const [note, setNote] = useState('');
  const [redFlags, setRedFlags] = useState<PreCheckInput['redFlags']>({
    severePain: false,
    swollenHotKnee: false,
    cannotBearWeight: false,
    kneeLocking: false,
    significantWeakness: false,
    numbness: false,
    bladderBowelLoss: false,
  });

  const input: PreCheckInput = useMemo(
    () => ({ energy, kneePain, backPain, note, redFlags }),
    [energy, kneePain, backPain, note, redFlags],
  );

  const evaluation = useMemo(() => evaluatePreWorkoutSafety(input), [input]);

  if (!open) return null;

  const toggleFlag = (key: keyof PreCheckInput['redFlags']) => {
    setRedFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="precheck-title"
    >
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#171F1C] border border-[#E2E6E1] dark:border-[#27332E] p-5 sm:p-6 max-h-[92dvh] overflow-y-auto shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#5B6860] dark:text-[#98A89F]">
              Chequeo previo · {routine.title}
            </p>
            <h2 id="precheck-title" className="text-xl font-bold text-[#17201B] dark:text-[#ECF1ED]">
              ¿Cómo te sientes hoy?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar chequeo previo"
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5B6860] hover:bg-[#EEF2EE] dark:text-[#98A89F] dark:hover:bg-[#24302A]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm font-medium mb-2">
              <label htmlFor="pre-energy">Energía actual</label>
              <span className="font-mono-tabular text-[#1E4D3B] dark:text-[#6EE7B7]">
                {energy} / 5
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label="Energía de 1 a 5">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setEnergy(val)}
                  className={`min-h-[46px] rounded-xl font-mono-tabular font-semibold text-sm border transition-colors ${
                    energy === val
                      ? 'bg-[#1E4D3B] text-white border-[#1E4D3B] dark:bg-[#6EE7B7] dark:text-[#0F1412] dark:border-[#6EE7B7]'
                      : 'border-[#D4DDD7] dark:border-[#2C3A33] text-[#2A3630] dark:text-[#D5DFD9]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-medium mb-1.5">
              <label htmlFor="pre-knee">Dolor de rodillas (0 = nada, 10 = máximo)</label>
              <span className="font-mono-tabular font-semibold">{kneePain} / 10</span>
            </div>
            <input
              id="pre-knee"
              type="range"
              min={0}
              max={10}
              step={1}
              value={kneePain}
              onChange={(e) => setKneePain(Number(e.target.value))}
              className="w-full h-10 accent-[#1E4D3B]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm font-medium mb-1.5">
              <label htmlFor="pre-back">Dolor de espalda (0 = nada, 10 = máximo)</label>
              <span className="font-mono-tabular font-semibold">{backPain} / 10</span>
            </div>
            <input
              id="pre-back"
              type="range"
              min={0}
              max={10}
              step={1}
              value={backPain}
              onChange={(e) => setBackPain(Number(e.target.value))}
              className="w-full h-10 accent-[#1E4D3B]"
            />
          </div>

          <div>
            <label htmlFor="pre-note" className="block text-sm font-medium mb-1.5">
              Nota opcional del día
            </label>
            <input
              id="pre-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej. Dormí poco, algo de rigidez al levantarme"
              className="w-full min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3.5 text-sm"
            />
          </div>

          <details className="rounded-2xl border border-[#DCE3DD] dark:border-[#2B3832] bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
            <summary className="cursor-pointer text-sm font-medium text-[#17201B] dark:text-[#ECF1ED] list-none flex items-center justify-between">
              <span>Señales de alerta (marcar solo si están presentes)</span>
              <span className="text-xs text-[#5B6860] dark:text-[#98A89F]">Ver lista</span>
            </summary>
            <div className="mt-3 space-y-2.5">
              {RED_FLAG_LABELS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-3 min-h-[38px] text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={redFlags[item.key]}
                    onChange={() => toggleFlag(item.key)}
                    className="w-5 h-5 rounded accent-rose-600 shrink-0"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </details>

          {evaluation.blocked ? (
            <div
              role="alert"
              className="rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 p-4 text-rose-900 dark:text-rose-100"
            >
              <div className="flex items-center gap-2 font-bold text-base">
                <ShieldAlert className="w-5 h-5 shrink-0" />
                <span>{evaluation.headline}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed">{evaluation.guidance}</p>
            </div>
          ) : evaluation.status === 'recuperacion' ? (
            <div
              role="status"
              className="rounded-2xl bg-amber-50 dark:bg-amber-950/45 border border-amber-300 dark:border-amber-800 p-4 text-amber-950 dark:text-amber-100"
            >
              <div className="flex items-center gap-2 font-semibold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{evaluation.headline}</span>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed">{evaluation.guidance}</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-[#EEF5F0] dark:bg-[#172821] border border-[#CFE0D5] dark:border-[#2A4236] p-4 text-[#173A2C] dark:text-[#C5EBD6]">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{evaluation.headline}</span>
              </div>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed">{evaluation.guidance}</p>
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2.5">
          {evaluation.blocked ? (
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[48px] rounded-xl bg-rose-700 text-white font-semibold text-sm hover:bg-rose-800 transition-colors"
            >
              Entendido, pausar por hoy
            </button>
          ) : (
            <>
              {evaluation.suggestMobilityOnly &&
                mobilityRoutine &&
                mobilityRoutine.id !== routine.id && (
                  <button
                    type="button"
                    onClick={() => onProceed(mobilityRoutine, input, evaluation)}
                    className="w-full min-h-[48px] rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] font-semibold text-sm"
                  >
                    Elegir {mobilityRoutine.title} (recomendado hoy)
                  </button>
                )}

              <button
                type="button"
                onClick={() => onProceed(routine, input, evaluation)}
                className={`w-full min-h-[48px] rounded-xl font-semibold text-sm transition-opacity ${
                  evaluation.suggestMobilityOnly &&
                  mobilityRoutine &&
                  mobilityRoutine.id !== routine.id
                    ? 'border border-[#D4DDD7] dark:border-[#2C3A33] text-[#2A3630] dark:text-[#D5DFD9]'
                    : 'bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412]'
                }`}
              >
                {evaluation.suggestMobilityOnly
                  ? `Continuar suave con ${routine.title}`
                  : `Comenzar ${routine.title}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
