import type { Exercise } from './types.ts';

export const DEFAULT_EXERCISES: Exercise[] = [
  {
    id: 'sentadilla-corta-asistida',
    name: 'Sentadilla corta asistida',
    zone: 'piernas',
    illustrationKey: 'squat',
    altText:
      'Ilustración lineal de una persona realizando una sentadilla corta con las manos apoyadas ligeramente en el respaldo de una silla para estabilidad.',
    objective:
      'Fortalecer cuádriceps y glúteos en un rango cómodo y seguro sin sobrecargar las rodillas.',
    instructions: [
      'Colócate frente al respaldo de una silla firme o una encimera, con los pies al ancho de los hombros.',
      'Apoya suavemente las yemas de los dedos para equilibrarte, sin colgarte del soporte.',
      'Lleva la cadera hacia atrás y flexiona las rodillas solo un cuarto o un tercio del recorrido, manteniendo los talones en el suelo.',
      'Sube empujando desde toda la planta del pie hasta quedar erguido sin bloquear bruscamente las rodillas.',
    ],
    breathing: 'Inhala al bajar despacio y exhala de forma continua al subir.',
    commonMistakes: [
      'Dejar que las rodillas se junten hacia adentro al bajar.',
      'Despegar los talones del piso o bajar demasiado rápido.',
      'Encorvar la zona lumbar hacia adelante.',
    ],
    regression:
      'Reduce la profundidad a unos pocos centímetros o realiza una sentadilla sentándote y levantándote suavemente de una silla alta.',
    whenToStop:
      'Detente si aparece dolor punzante en la rótula, sensación de bloqueo o molestia superior a 3/10.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'flexiones-pared',
    name: 'Flexiones contra la pared',
    zone: 'tronco',
    illustrationKey: 'wall-pushup',
    altText:
      'Ilustración lineal de una persona de pie inclinada hacia una pared realizando una flexión de brazos con la espalda alineada.',
    objective:
      'Activar pecho, hombros y estabilizadores del tronco con carga articular muy baja.',
    instructions: [
      'Ponte de pie frente a una pared a un paso corto de distancia, con los pies al ancho de caderas.',
      'Apoya las palmas a la altura del pecho o ligeramente más abajo, un poco más anchas que los hombros.',
      'Dobla los codos formando una flecha suave hacia abajo (cerca de 45 grados) mientras acercas el pecho a la pared en bloque.',
      'Empuja la pared de manera controlada para regresar a la posición inicial sin encoger los hombros.',
    ],
    breathing: 'Inhala al acercarte a la pared y exhala al empujar.',
    commonMistakes: [
      'Abrir demasiado los codos a 90 grados forzando los hombros.',
      'Dejar caer la cadera o arquear la zona lumbar.',
      'Subir los hombros hacia las orejas.',
    ],
    regression:
      'Acércate unos centímetros más a la pared y reduce el rango de flexión de codos.',
    whenToStop:
      'Suspende el ejercicio si notas pinzamiento en el hombro, hormigueo en manos o dolor en muñecas.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'puente-gluteos',
    name: 'Puente de glúteos',
    zone: 'cadera',
    illustrationKey: 'glute-bridge',
    altText:
      'Ilustración lineal de una persona boca arriba sobre una colchoneta con rodillas flexionadas elevando suavemente la pelvis en línea con el torso.',
    objective:
      'Fortalecer glúteos e isquiotibiales dando soporte a la cadera y protegiendo la zona lumbar.',
    instructions: [
      'Acuéstate boca arriba sobre una esterilla con las rodillas flexionadas y los pies apoyados al ancho de caderas.',
      'Activa suavemente el abdomen para acercar la zona lumbar al suelo sin tensión excesiva.',
      'Empuja con los talones y eleva la pelvis hasta alinear hombros, cadera y rodillas, sin hiperextender la espalda.',
      'Baja vértebra por vértebra de forma controlada antes de iniciar la siguiente repetición.',
    ],
    breathing: 'Exhala mientras subes la pelvis e inhala al descender.',
    commonMistakes: [
      'Arquear en exceso la espalda baja al llegar arriba.',
      'Colocar los pies demasiado lejos generando calambre en isquiotibiales.',
      'Dejar que las rodillas se abran o se cierren sin control.',
    ],
    regression:
      'Eleva la pelvis solo unos centímetros manteniendo el foco en apretar suavemente los glúteos.',
    whenToStop:
      'Detente si aparece dolor lumbar agudo, calambre persistente o molestia que supera 3/10.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'dead-bug',
    name: 'Dead bug',
    zone: 'tronco',
    illustrationKey: 'dead-bug',
    altText:
      'Ilustración lineal de una persona tumbada boca arriba extendiendo lentamente un brazo y la pierna contraria mientras mantiene la espalda neutra.',
    objective:
      'Mejorar la estabilidad profunda del abdomen sin flexionar ni comprimir la columna lumbar.',
    instructions: [
      'Acuéstate boca arriba con la cabeza apoyada, rodillas flexionadas a 90 grados sobre la cadera y brazos apuntando al techo.',
      'Mantén una presión suave y constante del abdomen para que la espalda baja no se despegue del suelo.',
      'Extiende lentamente una pierna hacia adelante (o toca el suelo con el talón) mientras bajas el brazo contrario hacia atrás.',
      'Regresa al centro con control y alterna de lado sin prisa.',
    ],
    breathing: 'Exhala suavemente durante la extensión de brazo y pierna; inhala al volver al centro.',
    commonMistakes: [
      'Arquear la zona lumbar al bajar demasiado la pierna.',
      'Contener la respiración.',
      'Mover brazos y piernas demasiado rápido perdiendo el control del centro.',
    ],
    regression:
      'Realiza únicamente marcha tumbado: deja los brazos apoyados en el piso y baja un talón alternando suavemente.',
    whenToStop:
      'Detente si la espalda baja duele, se arquea sin control o aparece molestia en la ingle.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'elevacion-lateral-pierna',
    name: 'Elevación lateral de pierna',
    zone: 'cadera',
    illustrationKey: 'side-leg-raise',
    altText:
      'Ilustración lineal de una persona recostada de lado elevando suavemente la pierna superior en línea recta.',
    objective:
      'Fortalecer el glúteo medio para estabilizar la pelvis y alinear mejor las rodillas al caminar.',
    instructions: [
      'Recuéstate de lado con la pierna inferior ligeramente flexionada para ganar estabilidad y la cabeza apoyada en el brazo.',
      'Mantén la cadera perpendicular al suelo, sin dejarte caer hacia atrás.',
      'Eleva la pierna superior extendida unos 25 a 35 cm con el pie apuntando al frente.',
      'Desciende despacio en 2 a 3 segundos sin dejar caer la pierna.',
    ],
    breathing: 'Exhala al elevar la pierna e inhala al bajar.',
    commonMistakes: [
      'Girar la cadera hacia atrás y apuntar la punta del pie hacia el techo.',
      'Subir demasiado alto compensando con la cintura.',
    ],
    regression:
      'Realízalo de pie apoyado ligeramente en una pared, separando la pierna hacia un lado en un rango corto.',
    whenToStop:
      'Detente si sientes chasquido doloroso en la cadera o molestia en la zona lumbar lateral.',
    defaultDurationSec: 40,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'basculaciones-pelvicas',
    name: 'Basculaciones pélvicas',
    zone: 'espalda',
    illustrationKey: 'pelvic-tilt',
    altText:
      'Ilustración lineal de una persona boca arriba con rodillas dobladas realizando un movimiento suave de inclinación pélvica.',
    objective:
      'Descomprimir la zona lumbar y recuperar movilidad suave entre la pelvis y la columna baja.',
    instructions: [
      'Acuéstate boca arriba con rodillas flexionadas y pies apoyados cómodamente en el suelo.',
      'Al exhalar, inclina suavemente la pelvis para apoyar por completo la zona lumbar contra la esterilla.',
      'Al inhalar, regresa despacio a una curva natural y cómoda sin forzar el arco.',
      'Repite el balanceo lento y fluido sin despegar los glúteos del piso.',
    ],
    breathing: 'Exhala al aplanar la espalda contra el suelo e inhala al relajar hacia neutro.',
    commonMistakes: [
      'Empujar fuerte con los pies levantando la cadera como en un puente.',
      'Hacer el movimiento de golpe o forzando el cuello.',
    ],
    regression: 'Reduce la amplitud al mínimo movimiento cómodo que no provoque dolor.',
    whenToStop:
      'Detente si cualquier fase del balanceo produce dolor irradiado hacia glúteo o pierna.',
    defaultDurationSec: 45,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'rodillas-lado-a-lado',
    name: 'Rodillas de lado a lado',
    zone: 'movilidad',
    illustrationKey: 'knee-sway',
    altText:
      'Ilustración lineal de una persona tumbada boca arriba dejando caer suavemente ambas rodillas juntas hacia un costado.',
    objective:
      'Lubricar la cadera y movilizar con suavidad la columna lumbar en rotación.',
    instructions: [
      'Túmbate boca arriba con las rodillas flexionadas, los pies juntos y los brazos abiertos en cruz cómoda.',
      'Deja caer lentamente ambas rodillas juntas hacia un lado hasta sentir un estiramiento suave.',
      'Mantén ambos hombros apoyados en la esterilla.',
      'Regresa al centro y repite hacia el lado contrario a ritmo tranquilo.',
    ],
    breathing: 'Exhala al dejar caer las rodillas hacia un lado e inhala al volver al centro.',
    commonMistakes: [
      'Forzar las rodillas hasta el suelo levantando el hombro contrario.',
      'Rebotar rápido de un lado a otro.',
    ],
    regression:
      'Coloca una almohada o cojín a cada lado para limitar el rango y descansar las rodillas.',
    whenToStop: 'Detente si sientes pinchazo lumbar o tirón agudo en la ingle.',
    defaultDurationSec: 50,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'estiramiento-isquiotibiales',
    name: 'Estiramiento de isquiotibiales tumbado',
    zone: 'piernas',
    illustrationKey: 'hamstring-stretch',
    altText:
      'Ilustración lineal de una persona boca arriba sosteniendo suavemente la parte posterior de un muslo con la pierna elevada.',
    objective:
      'Aliviar tensión posterior del muslo sin flexionar ni cargar la columna lumbar.',
    instructions: [
      'Acuéstate boca arriba con una pierna doblada (pie en el piso) para proteger la espalda.',
      'Eleva la otra pierna tomando suavemente la parte trasera del muslo con ambas manos o usando una toalla.',
      'Extiende la rodilla hasta sentir un estiramiento suave y tolerable en la parte posterior del muslo, nunca dolor.',
      'Sostén 20 a 30 segundos respirando profundo y cambia de pierna.',
    ],
    breathing: 'Respiración lenta y abdominal, soltando tensión en cada exhalación.',
    commonMistakes: [
      'Jalar la pierna con fuerza intentando bloquear la rodilla por completo.',
      'Levantar la cabeza y tensar el cuello hacia adelante.',
    ],
    regression: 'Mantén una flexión suave de rodilla o usa una cinta/toalla larga para no alcanzar con tensión.',
    whenToStop:
      'Detente si aparece hormigueo, corriente eléctrica detrás de la rodilla o dolor en la pantorrilla.',
    defaultDurationSec: 50,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'estiramiento-flexor-cadera',
    name: 'Estiramiento de flexor de cadera de pie',
    zone: 'cadera',
    illustrationKey: 'hip-flexor',
    altText:
      'Ilustración lineal de una persona en zancada corta de pie junto a una silla estirando suavemente la parte frontal de la cadera.',
    objective:
      'Soltar la rigidez frontal de la cadera provocada por pasar muchas horas sentado.',
    instructions: [
      'Ponte de pie junto a una silla o pared para apoyarte y da un paso corto hacia atrás con una pierna.',
      'Flexiona muy levemente la rodilla delantera mientras activas el glúteo de la pierna trasera.',
      'Inclina suavemente la pelvis hacia adelante (metiendo un poco la cola) hasta sentir un alargamiento suave al frente de la cadera atrasada.',
      'Sostén 20 a 30 segundos por lado manteniendo el torso erguido.',
    ],
    breathing: 'Inhala expandiendo el pecho y exhala manteniendo la pelvis estable.',
    commonMistakes: [
      'Arquear la espalda baja hacia atrás en lugar de mover la pelvis.',
      'Dar una zancada demasiado larga que incomode la rodilla.',
    ],
    regression: 'Acorta la distancia del paso y apóyate con firmeza en una mesa o pared.',
    whenToStop: 'Detente si notas molestia en la zona lumbar o en la rodilla delantera.',
    defaultDurationSec: 50,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'estiramiento-pecho-pared',
    name: 'Estiramiento de pecho en pared',
    zone: 'movilidad',
    illustrationKey: 'wall-chest',
    altText:
      'Ilustración lineal de una persona de pie apoyando el antebrazo contra una pared y girando suavemente el torso para abrir el pecho.',
    objective:
      'Abrir la parte frontal de hombros y pectoral para mejorar la postura erguida.',
    instructions: [
      'Colócate de costado junto a una pared o marco de puerta.',
      'Apoya la palma o el antebrazo en la pared a la altura del hombro.',
      'Gira suavemente el torso en dirección contraria a la pared hasta notar una apertura agradable en el pecho.',
      'Sostén 20 a 30 segundos por cada lado sin forzar el hombro.',
    ],
    breathing: 'Respira profundo hacia las costillas superiores y relaja los hombros.',
    commonMistakes: [
      'Subir el codo muy por encima del hombro provocando pinzamiento.',
      'Girar con demasiada fuerza.',
    ],
    regression: 'Coloca la mano más abajo (por debajo del hombro) y gira apenas unos grados.',
    whenToStop: 'Detente si sientes adormecimiento en dedos o dolor en la parte delantera del hombro.',
    defaultDurationSec: 50,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'rotacion-suave-tumbado',
    name: 'Rotación suave tumbado',
    zone: 'espalda',
    illustrationKey: 'lying-twist',
    altText:
      'Ilustración lineal de una persona acostada de lado abriendo el brazo superior hacia el lado contrario en una rotación torácica suave.',
    objective:
      'Movilizar la columna dorsal (espalda media) reduciendo rigidez de hombros y espalda.',
    instructions: [
      'Acuéstate de lado con las rodillas flexionadas hacia adelante formando un ángulo cómodo.',
      'Extiende ambos brazos al frente a la altura del pecho, palma con palma.',
      'Abre lentamente el brazo superior dibujando un arco hacia el lado contrario siguiendo la mano con la mirada.',
      'Respira un par de segundos donde llegues cómodo y regresa despacio; cambia de lado.',
    ],
    breathing: 'Inhala al preparar y exhala suavemente al abrir el pecho.',
    commonMistakes: [
      'Dejar que la rodilla superior se levante perdiendo el foco dorsal.',
      'Forzar el brazo hasta tocar el piso si el hombro tira.',
    ],
    regression: 'Coloca una almohada debajo de la cabeza y entre las rodillas, y reduce el giro.',
    whenToStop: 'Detente si aparece dolor en hombro o molestia lumbar.',
    defaultDurationSec: 50,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'bisagra-cadera',
    name: 'Bisagra de cadera',
    zone: 'cadera',
    illustrationKey: 'hip-hinge',
    altText:
      'Ilustración lineal de una persona de pie con rodillas semidobladas llevando la cadera hacia atrás y manteniendo la espalda recta.',
    objective:
      'Enseñar a mover desde la cadera en lugar de doblar la espalda al agacharse o cargar peso.',
    instructions: [
      'Ponte de pie con los pies al ancho de caderas y un desbloqueo muy ligero en las rodillas.',
      'Coloca las manos en los pliegues de la cadera o deslízalas por tus muslos.',
      'Empuja los glúteos hacia atrás como si quisieras cerrar una puerta con la cadera, manteniendo pecho abierto y columna larga.',
      'Cuando sientas tensión suave en la parte trasera del muslo, aprieta glúteos y vuelve erguido.',
    ],
    breathing: 'Inhala al llevar la cadera atrás y exhala al volver arriba.',
    commonMistakes: [
      'Redondear la espalda hacia adelante en vez de empujar la cadera atrás.',
      'Doblar demasiado las rodillas convirtiéndolo en sentadilla.',
    ],
    regression: 'Practica de espaldas a una pared (a 15 cm) buscando tocarla suavemente con los glúteos.',
    whenToStop: 'Detente si la zona lumbar se carga o duele más de 3/10.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'elevacion-talones',
    name: 'Elevación de talones',
    zone: 'piernas',
    illustrationKey: 'calf-raise',
    altText:
      'Ilustración lineal de una persona de pie junto a una pared elevándose suavemente sobre la punta de los pies.',
    objective:
      'Fortalecer gemelos, sóleo y estabilidad de tobillo para proteger rodillas al caminar.',
    instructions: [
      'Ponte de pie frente a una pared o silla apoyando ligeramente los dedos para mantener el equilibrio.',
      'Eleva los talones de forma continua repartiendo el peso entre el dedo gordo y el centro del antepié.',
      'Haz una pausa breve de 1 segundo arriba manteniendo tobillos alineados.',
      'Desciende despacio en 2 a 3 segundos hasta apoyar por completo los talones.',
    ],
    breathing: 'Exhala al subir e inhala al descender controlado.',
    commonMistakes: [
      'Dejar caer los tobillos hacia afuera.',
      'Rebotar rápido aprovechando el impulso.',
    ],
    regression: 'Haz el movimiento sentado en una silla elevando talones para activar sin carga corporal.',
    whenToStop: 'Detente si aparece molestia en el tendón de Aquiles o calambre plantar.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
  {
    id: 'equilibrio-una-pierna',
    name: 'Equilibrio a una pierna junto a una pared',
    zone: 'cuerpo_completo',
    illustrationKey: 'single-leg-balance',
    altText:
      'Ilustración lineal de una persona de pie cerca de una pared sosteniéndose suavemente en una pierna con la otra ligeramente elevada.',
    objective:
      'Entrenar equilibrio, propiocepción de tobillo y estabilidad de cadera con seguridad.',
    instructions: [
      'Colócate de lado junto a una pared o silla firme para poder tocarla si lo necesitas.',
      'Traslada el peso hacia una pierna manteniendo la rodilla ligeramente suave (sin bloquear).',
      'Despega apenas el otro pie del suelo y sostén la postura erguida durante 20 segundos.',
      'Apoya el pie con calma y cambia de lado.',
    ],
    breathing: 'Mantén una respiración constante y tranquila, mirando un punto fijo al frente.',
    commonMistakes: [
      'Dejar caer la cadera del lado elevado.',
      'Aguantar la respiración por concentración.',
    ],
    regression: 'Deja la punta del pie contrario tocando ligeramente el piso como apoyo mínimo.',
    whenToStop: 'Detente si sientes inestabilidad riesgosa o dolor en tobillo o rodilla de apoyo.',
    defaultDurationSec: 40,
    bilateral: true,
    customVideoUrl: null,
  },
  {
    id: 'marcha-lateral-suave',
    name: 'Marcha lateral suave',
    zone: 'cuerpo_completo',
    illustrationKey: 'lateral-march',
    altText:
      'Ilustración lineal de una persona dando pasos laterales suaves y controlados en posición erguida.',
    objective:
      'Activar la circulación, coordinación y musculatura lateral de cadera sin impacto.',
    instructions: [
      'Colócate erguido con espacio para dar 2 o 3 pasos hacia cada costado.',
      'Da un paso lateral suave y controlado manteniendo las puntas de los pies hacia el frente.',
      'Acerca el otro pie sin juntar del todo las rodillas ni dar saltos.',
      'Alterna hacia un lado y hacia el otro manteniendo un ritmo cómodo.',
    ],
    breathing: 'Respira de forma fluida y natural acompañando el ritmo del paso.',
    commonMistakes: [
      'Cruzar los pies o moverse demasiado rápido.',
      'Inclinar el torso bruscamente hacia los lados.',
    ],
    regression: 'Realiza pasos laterales más cortos junto a una encimera o mesa para tener referencia.',
    whenToStop: 'Detente si aparece falta de aire excesiva, mareo o dolor articular.',
    defaultDurationSec: 40,
    bilateral: false,
    customVideoUrl: null,
  },
];
