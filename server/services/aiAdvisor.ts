import { GoogleGenAI, Type } from '@google/genai';
import type {
  AiRecommendationResponse,
  Routine,
  TrainingProfileSummary,
  UserProfile,
  WorkoutSession,
} from '../../src/shared/types.ts';
import { MEDICAL_DISCLAIMER } from '../../src/shared/safety.ts';

const ALLOWED_TYPES = new Set<AiRecommendationResponse['recommendationType']>([
  'mantener',
  'reducir_ronda',
  'aumentar_descanso',
  'elegir_movilidad',
  'consulta_profesional',
]);

export function isAiEnabledOnServer(): boolean {
  return process.env.AI_ENABLED === 'true' && Boolean(process.env.GEMINI_API_KEY?.trim());
}

export async function requestConservativeAiAdvice(params: {
  question: string;
  profile: UserProfile;
  summary: TrainingProfileSummary;
  currentRoutine: Routine | null;
  recentSessions: WorkoutSession[];
  hasRedFlagsReported?: boolean;
}): Promise<AiRecommendationResponse> {
  if (process.env.AI_ENABLED !== 'true') {
    throw new Error('AI_DISABLED');
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('GEMINI_KEY_MISSING');
  }

  // Hard conservative guardrail before calling any model
  const latest = params.recentSessions[0];
  const latestPain = latest ? Math.max(latest.postKneePain, latest.postBackPain) : 0;

  if (params.hasRedFlagsReported) {
    return {
      recommendationType: 'consulta_profesional',
      summary: 'Busca atención médica profesional antes de volver a entrenar.',
      rationale:
        'Se indicaron señales de alerta que requieren evaluación clínica presencial. El asistente no recomienda ejercicios en esta situación.',
      suggestedAdjustments: [
        'Suspende la sesión de hoy.',
        'Consulta con un médico o fisioterapeuta.',
      ],
      safetyNote: 'Busca atención médica profesional.',
      medicalDisclaimer: MEDICAL_DISCLAIMER,
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Only send the disclosed profile, routine, adherence, effort, and pain metrics
  const disclosedContext = {
    perfil: {
      nombre: params.profile.name,
      edad: params.profile.age,
      alturaCm: params.profile.heightCm,
      pesoKg: params.profile.weightKg,
      nivel: params.profile.level,
      objetivo: params.profile.goal,
      zonasSensibles: params.profile.sensitiveZones,
    },
    rutinaActual: params.currentRoutine
      ? {
          titulo: params.currentRoutine.title,
          enfoque: params.currentRoutine.focus,
          rondas: params.currentRoutine.rounds,
          trabajoSeg: params.currentRoutine.defaultWorkSeconds,
          descansoSeg: params.currentRoutine.defaultRestSeconds,
        }
      : null,
    adherencia: {
      sesionesEstaSemana: params.summary.weeklySessions,
      minutosEstaSemana: params.summary.weeklyMinutes,
      rachaSemanas: params.summary.weeklyStreak,
      esfuerzoPromedio: params.summary.avgEffort,
      dolorRodillaPromedio: params.summary.avgPostKneePain,
      dolorEspaldaPromedio: params.summary.avgPostBackPain,
    },
    ultimasSesiones: params.recentSessions.slice(0, 5).map((s) => ({
      rutina: s.routineTitle,
      esfuerzoRpe: s.rpe,
      dolorRodillaPrevio: s.preKneePain,
      dolorRodillaPosterior: s.postKneePain,
      dolorEspaldaPrevio: s.preBackPain,
      dolorEspaldaPosterior: s.postBackPain,
    })),
    consultaUsuario: params.question.slice(0, 500),
  };

  const systemInstruction = `Eres un asistente conservador de calistenia suave y movilidad en español latinoamericano.
Reglas estrictas e inviolables:
1. NUNCA diagnostiques lesiones, enfermedades ni condiciones médicas.
2. NUNCA prescribas medicamentos, suplementos ni tratamientos clínicos o nutricionales.
3. NUNCA afirmes que una lesión está curada ni que el usuario está completamente sano.
4. Solo puedes elegir recommendationType entre: "mantener", "reducir_ronda", "aumentar_descanso", "elegir_movilidad", "consulta_profesional".
5. Si el dolor reportado supera 3/10 o aumentó en la última sesión, sugiere reducir rondas, aumentar descanso, elegir movilidad o descansar.
6. Si el usuario describe dolor intenso, inflamación/calor en rodilla, bloqueo articular, incapacidad de apoyar peso, debilidad marcada o entumecimiento, DEBES responder recommendationType="consulta_profesional" e indicar "Busca atención médica profesional".
7. Mantén todas las respuestas concisas (2-3 frases por campo) y prudentes.`;

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: JSON.stringify(disclosedContext),
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendationType: {
            type: Type.STRING,
            description:
              'Uno de: mantener, reducir_ronda, aumentar_descanso, elegir_movilidad, consulta_profesional',
          },
          summary: {
            type: Type.STRING,
            description: 'Resumen breve en español de la orientación conservadora.',
          },
          rationale: {
            type: Type.STRING,
            description: 'Explicación breve basada en esfuerzo, dolor y adherencia.',
          },
          suggestedAdjustments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista corta de 1 a 3 ajustes prácticos y conservadores.',
          },
          safetyNote: {
            type: Type.STRING,
            description: 'Recordatorio de seguridad o señal para detenerse.',
          },
        },
        required: [
          'recommendationType',
          'summary',
          'rationale',
          'suggestedAdjustments',
          'safetyNote',
        ],
      },
    },
  });

  const rawText = (response.text ?? '').trim();
  let parsed: Partial<AiRecommendationResponse>;
  try {
    parsed = JSON.parse(rawText) as Partial<AiRecommendationResponse>;
  } catch {
    throw new Error('INVALID_AI_JSON');
  }

  let recType: AiRecommendationResponse['recommendationType'] = ALLOWED_TYPES.has(
    parsed.recommendationType as AiRecommendationResponse['recommendationType'],
  )
    ? (parsed.recommendationType as AiRecommendationResponse['recommendationType'])
    : 'mantener';

  // Server-side safety override if recent pain > 3 and model returned 'mantener'
  if (latestPain > 3 && recType === 'mantener') {
    recType = 'elegir_movilidad';
  }

  const adjustments = Array.isArray(parsed.suggestedAdjustments)
    ? parsed.suggestedAdjustments
        .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
        .slice(0, 4)
    : [];

  return {
    recommendationType: recType,
    summary:
      typeof parsed.summary === 'string' && parsed.summary.trim()
        ? parsed.summary.trim()
        : 'Mantén una progresión gradual escuchando tus sensaciones.',
    rationale:
      typeof parsed.rationale === 'string' && parsed.rationale.trim()
        ? parsed.rationale.trim()
        : 'Ajuste basado en tu esfuerzo reciente y tolerancia reportada.',
    suggestedAdjustments:
      adjustments.length > 0
        ? adjustments
        : ['Mantén rango cómodo de movimiento y detente si el dolor supera 3/10.'],
    safetyNote:
      typeof parsed.safetyNote === 'string' && parsed.safetyNote.trim()
        ? parsed.safetyNote.trim()
        : 'Si aparece dolor agudo, inflamación o bloqueo, detente y busca atención médica profesional.',
    medicalDisclaimer: MEDICAL_DISCLAIMER,
  };
}
