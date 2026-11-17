import type { DayStatus, Routine } from './types.ts';

export const DEFAULT_ROUTINES: Routine[] = [
  {
    id: 'lunes-fuerza-a',
    dayOfWeek: 1,
    dayName: 'Lunes',
    title: 'Lunes · Fuerza A',
    subtitle: 'Base de pierna, empuje suave y estabilidad del tronco',
    focus: 'fuerza',
    isRestDay: false,
    warmupMinutes: 5,
    mainMinutes: 20,
    cooldownMinutes: 5,
    rounds: 2,
    defaultWorkSeconds: 40,
    defaultRestSeconds: 20,
    progressionNote:
      'Dos rondas al inicio; tres desde la tercera semana solo si la recuperación es buena.',
    exercises: [
      {
        id: 'lun-1',
        exerciseId: 'sentadilla-corta-asistida',
        name: 'Sentadilla corta asistida',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'lun-2',
        exerciseId: 'flexiones-pared',
        name: 'Flexiones contra la pared',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'lun-3',
        exerciseId: 'puente-gluteos',
        name: 'Puente de glúteos',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'lun-4',
        exerciseId: 'dead-bug',
        name: 'Dead bug',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'lun-5',
        exerciseId: 'elevacion-lateral-pierna',
        name: 'Elevación lateral de pierna',
        workSeconds: 40,
        restSeconds: 20,
        notes: '20 s por cada lado',
      },
    ],
  },
  {
    id: 'martes-movilidad',
    dayOfWeek: 2,
    dayName: 'Martes',
    title: 'Martes · Movilidad',
    subtitle: 'Soltura lumbar, cadera y apertura postural',
    focus: 'movilidad',
    isRestDay: false,
    warmupMinutes: 5,
    mainMinutes: 20,
    cooldownMinutes: 5,
    rounds: 2,
    defaultWorkSeconds: 45,
    defaultRestSeconds: 15,
    progressionNote: 'Dos vueltas, 20 a 30 segundos por lado, respiración lenta y sin rebotes.',
    exercises: [
      {
        id: 'mar-1',
        exerciseId: 'basculaciones-pelvicas',
        name: 'Basculaciones pélvicas',
        workSeconds: 45,
        restSeconds: 15,
      },
      {
        id: 'mar-2',
        exerciseId: 'rodillas-lado-a-lado',
        name: 'Rodillas de lado a lado',
        workSeconds: 50,
        restSeconds: 15,
        notes: '25 s por cada lado',
      },
      {
        id: 'mar-3',
        exerciseId: 'estiramiento-isquiotibiales',
        name: 'Estiramiento de isquiotibiales tumbado',
        workSeconds: 50,
        restSeconds: 15,
        notes: '25 s por pierna',
      },
      {
        id: 'mar-4',
        exerciseId: 'estiramiento-flexor-cadera',
        name: 'Estiramiento de flexor de cadera de pie',
        workSeconds: 50,
        restSeconds: 15,
        notes: '25 s por lado',
      },
      {
        id: 'mar-5',
        exerciseId: 'estiramiento-pecho-pared',
        name: 'Estiramiento de pecho en pared',
        workSeconds: 50,
        restSeconds: 15,
        notes: '25 s por lado',
      },
      {
        id: 'mar-6',
        exerciseId: 'rotacion-suave-tumbado',
        name: 'Rotación suave tumbado',
        workSeconds: 50,
        restSeconds: 15,
        notes: '25 s por lado',
      },
    ],
  },
  {
    id: 'miercoles-fuerza-b',
    dayOfWeek: 3,
    dayName: 'Miércoles',
    title: 'Miércoles · Fuerza B',
    subtitle: 'Cadena posterior, pantorrillas y control lumbopélvico',
    focus: 'fuerza',
    isRestDay: false,
    warmupMinutes: 5,
    mainMinutes: 20,
    cooldownMinutes: 5,
    rounds: 2,
    defaultWorkSeconds: 40,
    defaultRestSeconds: 20,
    progressionNote: 'Dos o tres rondas según tolerancia y sensación articular del día.',
    exercises: [
      {
        id: 'mie-1',
        exerciseId: 'bisagra-cadera',
        name: 'Bisagra de cadera',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'mie-2',
        exerciseId: 'elevacion-talones',
        name: 'Elevación de talones',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'mie-3',
        exerciseId: 'flexiones-pared',
        name: 'Flexiones contra la pared',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'mie-4',
        exerciseId: 'puente-gluteos',
        name: 'Puente de glúteos con pausa',
        workSeconds: 40,
        restSeconds: 20,
        notes: 'Pausa de 2 segundos arriba en cada repetición',
      },
      {
        id: 'mie-5',
        exerciseId: 'dead-bug',
        name: 'Dead bug o marcha tumbado',
        workSeconds: 40,
        restSeconds: 20,
      },
    ],
  },
  {
    id: 'jueves-recuperacion',
    dayOfWeek: 4,
    dayName: 'Jueves',
    title: 'Jueves · Recuperación activa',
    subtitle: 'Movilidad del martes, equilibrio seguro y caminata suave',
    focus: 'recuperacion',
    isRestDay: false,
    warmupMinutes: 5,
    mainMinutes: 20,
    cooldownMinutes: 5,
    rounds: 1,
    defaultWorkSeconds: 45,
    defaultRestSeconds: 15,
    progressionNote:
      'Movilidad del martes + equilibrio junto a una pared (20 s por lado x2) + 5 minutos de marcha suave.',
    exercises: [
      {
        id: 'jue-1',
        exerciseId: 'basculaciones-pelvicas',
        name: 'Basculaciones pélvicas',
        workSeconds: 45,
        restSeconds: 15,
      },
      {
        id: 'jue-2',
        exerciseId: 'rodillas-lado-a-lado',
        name: 'Rodillas de lado a lado',
        workSeconds: 50,
        restSeconds: 15,
      },
      {
        id: 'jue-3',
        exerciseId: 'estiramiento-isquiotibiales',
        name: 'Estiramiento de isquiotibiales tumbado',
        workSeconds: 50,
        restSeconds: 15,
      },
      {
        id: 'jue-4',
        exerciseId: 'estiramiento-flexor-cadera',
        name: 'Estiramiento de flexor de cadera de pie',
        workSeconds: 50,
        restSeconds: 15,
      },
      {
        id: 'jue-5',
        exerciseId: 'estiramiento-pecho-pared',
        name: 'Estiramiento de pecho en pared',
        workSeconds: 50,
        restSeconds: 15,
      },
      {
        id: 'jue-6',
        exerciseId: 'rotacion-suave-tumbado',
        name: 'Rotación suave tumbado',
        workSeconds: 50,
        restSeconds: 15,
      },
      {
        id: 'jue-7',
        exerciseId: 'equilibrio-una-pierna',
        name: 'Equilibrio a una pierna junto a una pared',
        workSeconds: 40,
        restSeconds: 20,
        notes: '20 s por lado, dos veces',
      },
      {
        id: 'jue-8',
        exerciseId: 'marcha-lateral-suave',
        name: 'Marcha suave de cierre (5 minutos)',
        workSeconds: 300,
        restSeconds: 0,
        notes: 'Paso cómodo en casa o pasillo sin fatiga',
      },
    ],
  },
  {
    id: 'viernes-circuito',
    dayOfWeek: 5,
    dayName: 'Viernes',
    title: 'Viernes · Circuito completo',
    subtitle: 'Integración suave de cuerpo completo sin impacto',
    focus: 'circuito',
    isRestDay: false,
    warmupMinutes: 5,
    mainMinutes: 20,
    cooldownMinutes: 5,
    rounds: 2,
    defaultWorkSeconds: 40,
    defaultRestSeconds: 20,
    progressionNote: 'Dos o tres rondas a ritmo fluido, manteniendo respiración cómoda.',
    exercises: [
      {
        id: 'vie-1',
        exerciseId: 'marcha-lateral-suave',
        name: 'Marcha lateral suave',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'vie-2',
        exerciseId: 'sentadilla-corta-asistida',
        name: 'Sentadilla corta asistida o cambios de peso',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'vie-3',
        exerciseId: 'flexiones-pared',
        name: 'Flexiones contra pared',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'vie-4',
        exerciseId: 'puente-gluteos',
        name: 'Puente de glúteos',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'vie-5',
        exerciseId: 'elevacion-talones',
        name: 'Elevación de talones',
        workSeconds: 40,
        restSeconds: 20,
      },
      {
        id: 'vie-6',
        exerciseId: 'dead-bug',
        name: 'Dead bug',
        workSeconds: 40,
        restSeconds: 20,
      },
    ],
  },
  {
    id: 'sabado-descanso',
    dayOfWeek: 6,
    dayName: 'Sábado',
    title: 'Sábado · Descanso o caminata suave',
    subtitle: 'Recuperación del tejido y descanso general',
    focus: 'descanso',
    isRestDay: true,
    warmupMinutes: 0,
    mainMinutes: 20,
    cooldownMinutes: 0,
    rounds: 1,
    defaultWorkSeconds: 40,
    defaultRestSeconds: 20,
    progressionNote: 'Día de descanso. Si te sientes con energía, realiza una caminata tranquila de 15 a 25 minutos.',
    exercises: [],
  },
  {
    id: 'domingo-descanso',
    dayOfWeek: 7,
    dayName: 'Domingo',
    title: 'Domingo · Descanso o caminata suave',
    subtitle: 'Preparación tranquila para la semana',
    focus: 'descanso',
    isRestDay: true,
    warmupMinutes: 0,
    mainMinutes: 20,
    cooldownMinutes: 0,
    rounds: 1,
    defaultWorkSeconds: 40,
    defaultRestSeconds: 20,
    progressionNote: 'Descanso completo o caminata opcional suave al aire libre.',
    exercises: [],
  },
];

export function jsDayToWeekdayNumber(jsDay: number): number {
  return jsDay === 0 ? 7 : jsDay;
}

export function getRecommendedRoutineForDay(
  routines: Routine[],
  jsDay: number,
  dayStatus: DayStatus,
): { recommended: Routine; nextWorkout: Routine } {
  const todayNum = jsDayToWeekdayNumber(jsDay);
  const byDay = new Map(routines.map((r) => [r.dayOfWeek, r]));
  const todayRoutine = byDay.get(todayNum) ?? routines[0];
  const mobilityRoutine =
    routines.find((r) => r.focus === 'movilidad') ??
    routines.find((r) => r.focus === 'recuperacion') ??
    todayRoutine;

  const recommended =
    dayStatus === 'recuperacion' && todayRoutine.focus !== 'movilidad' && !todayRoutine.isRestDay
      ? mobilityRoutine
      : todayRoutine;

  // Next active workout after today
  let nextWorkout = todayRoutine;
  for (let offset = 1; offset <= 7; offset++) {
    const candidateDay = ((todayNum - 1 + offset) % 7) + 1;
    const candidate = byDay.get(candidateDay);
    if (candidate && !candidate.isRestDay) {
      nextWorkout = candidate;
      break;
    }
  }

  return { recommended, nextWorkout };
}
