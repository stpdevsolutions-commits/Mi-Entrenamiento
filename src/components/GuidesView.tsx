import React, { useMemo, useState } from 'react';
import { ChevronRight, Film, X } from 'lucide-react';
import type { Exercise, ExerciseZone } from '../shared/types.ts';
import { ExerciseIllustration } from './ExerciseIllustration.tsx';

interface Props {
  exercises: Exercise[];
  onGuideViewed: (exercise: Exercise) => void;
  onSaveVideoUrl: (exerciseId: string, videoUrl: string | null) => Promise<void>;
}

const ZONE_FILTERS: Array<{ id: 'todas' | ExerciseZone; label: string }> = [
  { id: 'todas', label: 'Todas' },
  { id: 'piernas', label: 'Piernas' },
  { id: 'cadera', label: 'Cadera' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'tronco', label: 'Tronco' },
  { id: 'movilidad', label: 'Movilidad' },
  { id: 'cuerpo_completo', label: 'Cuerpo completo' },
];

const ZONE_NAMES: Record<ExerciseZone, string> = {
  piernas: 'Piernas',
  cadera: 'Cadera',
  espalda: 'Espalda',
  tronco: 'Tronco',
  movilidad: 'Movilidad',
  cuerpo_completo: 'Cuerpo completo',
};

export const GuidesView: React.FC<Props> = ({
  exercises,
  onGuideViewed,
  onSaveVideoUrl,
}) => {
  const [zoneFilter, setZoneFilter] = useState<'todas' | ExerciseZone>('todas');
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [videoDraft, setVideoDraft] = useState('');
  const [savingVideo, setSavingVideo] = useState(false);
  const [videoMessage, setVideoMessage] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (zoneFilter === 'todas') return exercises;
    return exercises.filter((ex) => ex.zone === zoneFilter);
  }, [exercises, zoneFilter]);

  const openDetail = (ex: Exercise) => {
    setSelected(ex);
    setVideoDraft(ex.customVideoUrl ?? '');
    setVideoMessage(null);
    onGuideViewed(ex);
  };

  const handleVideoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    setSavingVideo(true);
    setVideoMessage(null);
    try {
      await onSaveVideoUrl(selected.id, videoDraft.trim() || null);
      setSelected({ ...selected, customVideoUrl: videoDraft.trim() || null });
      setVideoMessage('Enlace de video guardado en tu cuenta privada.');
    } catch (err) {
      setVideoMessage(err instanceof Error ? err.message : 'No se pudo guardar el enlace.');
    } finally {
      setSavingVideo(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 pb-28 space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17201B] dark:text-[#ECF1ED]">
          Guía visual de ejercicios
        </h1>
        <p className="text-sm text-[#5B6860] dark:text-[#98A89F]">
          Ilustraciones propias paso a paso, respiración, regresiones y señales para detenerte.
        </p>
      </div>

      {/* Zone Filters */}
      <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filtrar por zona">
        {ZONE_FILTERS.map((f) => {
          const active = zoneFilter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setZoneFilter(f.id)}
              className={`min-h-[44px] px-4 rounded-xl text-sm font-medium whitespace-nowrap shrink-0 border transition-colors ${
                active
                  ? 'bg-[#1E4D3B] text-white border-[#1E4D3B] dark:bg-[#6EE7B7] dark:text-[#0F1412] dark:border-[#6EE7B7]'
                  : 'bg-white dark:bg-[#171F1C] border-[#DCE3DD] dark:border-[#2B3832] text-[#2A3630] dark:text-[#D5DFD9]'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Exercises Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((ex) => (
          <button
            key={ex.id}
            type="button"
            onClick={() => openDetail(ex)}
            className="text-left rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-4 hover:border-[#1E4D3B]/50 dark:hover:border-[#6EE7B7]/50 transition-colors flex flex-col gap-3"
          >
            <ExerciseIllustration
              illustrationKey={ex.illustrationKey}
              altText={ex.altText}
              className="w-full h-36"
            />
            <div className="flex items-start justify-between gap-2 w-full">
              <div>
                <div className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                  {ZONE_NAMES[ex.zone]} · {ex.defaultDurationSec}s base
                </div>
                <h2 className="mt-0.5 text-base font-bold text-[#17201B] dark:text-[#ECF1ED]">
                  {ex.name}
                </h2>
              </div>
              <ChevronRight className="w-5 h-5 text-[#5B6860] shrink-0 mt-1" />
            </div>
            <p className="text-xs text-[#5B6860] dark:text-[#98A89F] line-clamp-2">
              {ex.objective}
            </p>
          </button>
        ))}
      </div>

      {/* Exercise Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="guide-detail-title"
        >
          <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#171F1C] border border-[#DCE3DD] dark:border-[#2B3832] p-5 sm:p-6 max-h-[92dvh] overflow-y-auto space-y-5 shadow-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-[#5B6860] dark:text-[#98A89F]">
                  {ZONE_NAMES[selected.zone]}
                  {selected.bilateral ? ' · Trabajo bilateral (ambos lados)' : ''}
                </p>
                <h2
                  id="guide-detail-title"
                  className="text-xl sm:text-2xl font-bold text-[#17201B] dark:text-[#ECF1ED]"
                >
                  {selected.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar guía del ejercicio"
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#5B6860] hover:bg-[#EEF2EE] dark:hover:bg-[#24302A]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ExerciseIllustration
              illustrationKey={selected.illustrationKey}
              altText={selected.altText}
              className="w-full h-52"
            />
            <p className="text-[11px] text-[#5B6860] dark:text-[#98A89F]">
              Descripción visual: {selected.altText}
            </p>

            {selected.customVideoUrl && (
              <div className="rounded-2xl overflow-hidden border border-[#DCE3DD] dark:border-[#2B3832] bg-black">
                <video
                  src={selected.customVideoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full max-h-64"
                >
                  Tu navegador no admite reproducción directa de este video.
                </video>
              </div>
            )}

            <div className="space-y-4 text-sm">
              <div>
                <h3 className="font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">Objetivo</h3>
                <p className="mt-1 text-[#2A3630] dark:text-[#D5DFD9]">{selected.objective}</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
                  Instrucciones paso a paso
                </h3>
                <ol className="mt-1.5 space-y-1.5 list-decimal list-inside text-[#2A3630] dark:text-[#D5DFD9]">
                  {selected.instructions.map((step, i) => (
                    <li key={i}>{step}</li>
                  ))}
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">Respiración</h3>
                <p className="mt-1 text-[#2A3630] dark:text-[#D5DFD9]">{selected.breathing}</p>
              </div>

              <div>
                <h3 className="font-semibold text-[#1E4D3B] dark:text-[#6EE7B7]">
                  Errores comunes
                </h3>
                <ul className="mt-1.5 space-y-1 list-disc list-inside text-[#2A3630] dark:text-[#D5DFD9]">
                  {selected.commonMistakes.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-[#F7F7F5] dark:bg-[#111815] p-3.5">
                  <h3 className="font-semibold text-xs text-[#1E4D3B] dark:text-[#6EE7B7]">
                    Regresión (más suave)
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-[#2A3630] dark:text-[#D5DFD9]">
                    {selected.regression}
                  </p>
                </div>
                <div className="rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 p-3.5">
                  <h3 className="font-semibold text-xs text-rose-800 dark:text-rose-200">
                    Cuándo detenerse
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-rose-900 dark:text-rose-100">
                    {selected.whenToStop}
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Self-Hosted MP4 / Authorized Link */}
            <form
              onSubmit={handleVideoSave}
              className="pt-4 border-t border-[#E6EAE4] dark:border-[#25312B] space-y-2.5"
            >
              <label
                htmlFor="video-url-input"
                className="flex items-center gap-1.5 text-xs font-semibold text-[#17201B] dark:text-[#ECF1ED]"
              >
                <Film className="w-4 h-4" />
                <span>Video propio MP4 o enlace autorizado (opcional)</span>
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="video-url-input"
                  type="text"
                  value={videoDraft}
                  onChange={(e) => setVideoDraft(e.target.value)}
                  placeholder="/videos/sentadilla.mp4 o https://tu-servidor/video.mp4"
                  className="flex-1 min-h-[44px] rounded-xl border border-[#D4DDD7] dark:border-[#2C3A33] bg-[#FBFBF9] dark:bg-[#101613] px-3 text-sm"
                />
                <button
                  type="submit"
                  disabled={savingVideo}
                  className="min-h-[44px] px-4 rounded-xl bg-[#1E4D3B] text-white dark:bg-[#6EE7B7] dark:text-[#0F1412] text-sm font-medium whitespace-nowrap"
                >
                  {savingVideo ? 'Guardando…' : 'Guardar video'}
                </button>
              </div>
              {videoMessage && (
                <p className="text-xs text-[#1E4D3B] dark:text-[#6EE7B7]">{videoMessage}</p>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
