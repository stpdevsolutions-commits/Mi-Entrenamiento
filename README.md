# Mi Entrenamiento

Aplicación web progresiva (PWA) privada, móvil primero y en español para seguir rutinas de calistenia suave y movilidad, controlar automáticamente intervalos de trabajo, descanso y rondas, consultar guías visuales originales y registrar progreso y molestias de forma conservadora.

> **Aviso importante:** Esta aplicación es para uso personal y orientación de entrenamiento. No diagnostica lesiones ni sustituye la valoración de un médico o fisioterapeuta.

---

## Arquitectura

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + `vite-plugin-pwa`
- **Backend:** Node.js + Express + TypeScript (`server.ts`)
- **Base de datos:** SQLite (`better-sqlite3`) persistida en `/data/mi-entrenamiento.db`, con migraciones SQL en `server/db/migrations/` y capa de repositorio aislada en `server/db/repository.ts` para facilitar una migración futura a PostgreSQL.
- **Privacidad:** Sin analítica, sin publicidad, sin píxeles ni rastreadores. Sesiones privadas con contraseña hash (`scrypt` + sal aleatoria por usuario) y cookies `HttpOnly` firmadas con HMAC-SHA256.
- **IA opcional:** Desactivada por defecto (`AI_ENABLED=false`). Solo se comunica con Gemini desde el backend cuando se habilita explícitamente en el servidor y el usuario acepta la pantalla de consentimiento.

---

## 1. Iniciar en desarrollo

1. Copia el archivo de ejemplo de variables de entorno:

```bash
cp .env.example .env
```

2. Instala dependencias y ejecuta pruebas unitarias:

```bash
npm install
npm test
```

3. Inicia el servidor de desarrollo (Express + Vite en el puerto `3000`):

```bash
npm run dev
```

Abre `http://localhost:3000`. Si `SEED_DEMO_DATA=true`, tendrás disponible la cuenta de ejemplo (`atleta@mi-entrenamiento.local` / `Calistenia2026!`) o podrás crear tu cuenta personal.

---

## 2. Generar compilación de producción

```bash
npm run lint
npm run build
NODE_ENV=production npm start
```

Esto compila la interfaz optimizada y el Service Worker en `dist/` y sirve la aplicación completa desde Express en el puerto `3000`.

---

## 3. Desplegar con Docker Compose

1. Crea un archivo `.env` junto a `docker-compose.yml` con tu secreto de sesión:

```bash
cat <<'EOF' > .env
SESSION_SECRET=reemplaza-esto-con-64-caracteres-aleatorios-seguros
ALLOW_REGISTRATION=true
SINGLE_USER_MODE=true
SEED_DEMO_DATA=false
AI_ENABLED=false
EOF
```

2. Levanta el contenedor:

```bash
docker compose up -d --build
```

3. Crea tu cuenta personal desde el navegador. Luego cambia `ALLOW_REGISTRATION=false` en tu `.env` y reinicia el contenedor para bloquear cualquier registro externo:

```bash
docker compose up -d
```

La base de datos quedará persistida en `./data/mi-entrenamiento.db` en tu servidor.

---

## 4. Configurar HTTPS mediante proxy inverso

Las PWA en iPhone Safari (Service Worker y pantalla de inicio) **requieren HTTPS** en producción (salvo `localhost`).

### Opción A: Caddy (HTTPS automático con Let's Encrypt)

Archivo `Caddyfile`:

```caddyfile
entreno.tudominio.com {
    reverse_proxy 127.0.0.1:3000
}
```

### Opción B: Nginx + Certbot

```nginx
server {
    listen 443 ssl http2;
    server_name entreno.tudominio.com;

    ssl_certificate /etc/letsencrypt/live/entreno.tudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/entreno.tudominio.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Asegúrate de mantener `TRUST_PROXY=true` en tu `.env` para que Express reconozca `X-Forwarded-Proto: https` y emita cookies con el atributo `Secure`.

---

## 5. Copias de seguridad de SQLite

Como la base usa modo WAL (`mi-entrenamiento.db`, `-wal` y `-shm`), evita copiar el archivo en caliente con `cp` mientras hay escrituras activas. Usa el comando de respaldo en línea de SQLite o `VACUUM INTO`:

```bash
# Respaldo consistente sin detener el servidor:
sqlite3 ./data/mi-entrenamiento.db ".backup './backups/mi-entrenamiento-$(date +%F).db'"
```

También puedes exportar todos tus datos personales, rutinas, historial de sesiones y registros de peso directamente desde la pestaña **Perfil → Exportar todos mis datos (JSON)**.

---

## 6. Migración futura a PostgreSQL

Para pasar de SQLite a PostgreSQL en el futuro:

1. Convierte `server/db/migrations/001_initial.sql` (cambiando `INTEGER PRIMARY KEY AUTOINCREMENT` por `SERIAL PRIMARY KEY` y manteniendo los mismos nombres de tablas y columnas).
2. Implementa la interfaz `DataRepository` (`server/db/repository.ts`) usando `pg` / `postgres`.
3. Inyecta la nueva clase en `server.ts` sin modificar las rutas REST ni el frontend.

---

## 7. Lista de comprobación para probar la PWA en Safari de iPhone

- [ ] Abrir la URL HTTPS en **Safari** de iPhone (no en navegador embebido ni Chrome iOS).
- [ ] Tocar el botón **Compartir** (cuadrado con flecha hacia arriba) y seleccionar **Añadir a pantalla de inicio**.
- [ ] Verificar que el icono de `Mi Entrenamiento` (`apple-touch-icon.png` 180×180) y el nombre corto **Entrenar** aparecen en la pantalla de inicio.
- [ ] Abrir la app desde el icono de inicio y comprobar que abre en modo independiente (`display: standalone`) sin barra de direcciones de Safari.
- [ ] Activar el Modo Avión en el iPhone y verificar que cargan la interfaz, las rutinas guardadas, el temporizador y las guías de ejercicios ya abiertas.
- [ ] Iniciar una sesión en el temporizador, bloquear la pantalla o cambiar a otra app durante 15–30 segundos y regresar a **Mi Entrenamiento**; confirmar que el tiempo restante avanzó con exactitud según las marcas de tiempo reales.
- [ ] Probar el botón **Silenciar / Activar avisos** dentro del temporizador y comprobar botones grandes cómodos para el pulgar y contraste legible en modo claro y oscuro.
