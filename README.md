# AtlasCases

Plataforma de casos clínicos: el profesional sanitario redacta casos reales
anonimizados con ayuda de una IA, se indexan en una biblioteca y se explotan
como analítica agregada para clientes.

Stack: **Next.js 16 · React 19 · TypeScript · Tailwind 4 · Zustand · Recharts**.

> Prototipo funcional. Los datos viven **en memoria** (no hay base de datos aún)
> y la IA usa una base de conocimiento propia y limitada (dermatología). Ver
> [`docs/ARQUITECTURA.md`](docs/ARQUITECTURA.md).

## Desarrollo local

```bash
npm install
npm run dev
# http://localhost:3000
```

Login demo (sin credenciales reales): elige "Profesional Sanitario" (crear/ver
casos) o "Cliente Farma" (analytics).

## Build de producción

```bash
npm run build
npm run start   # sirve el build en el puerto 3000
```

## Despliegue con Docker / Dokploy

El repo incluye un `Dockerfile` multi-stage que produce la salida
**standalone** de Next (imagen mínima). En Dokploy:

1. Crea una aplicación de tipo **Dockerfile** apuntando a este repositorio
   (rama `main`).
2. Dokploy detecta el `Dockerfile` y construye la imagen automáticamente.
3. **Puerto de la aplicación: `3000`** (el contenedor expone y escucha en 3000).
4. Añade tu dominio y activa HTTPS.

Construir/probar la imagen a mano:

```bash
docker build -t atlascases .
docker run -p 3000:3000 atlascases
```

## Variables de entorno

**Hoy la aplicación NO requiere ninguna variable de entorno** (es un prototipo
sin backend, sin base de datos y sin claves de API).

Ya vienen fijadas en el `Dockerfile` y no hace falta tocarlas:

| Variable | Valor | Para qué |
|----------|-------|----------|
| `NODE_ENV` | `production` | Modo producción |
| `PORT` | `3000` | Puerto en el que escucha Next |
| `HOSTNAME` | `0.0.0.0` | Que escuche en todas las interfaces (necesario en contenedor) |
| `NEXT_TELEMETRY_DISABLED` | `1` | Desactiva la telemetría de Next |

Para el futuro (cuando se conecten servicios reales) harán falta, por ejemplo:

- `ANTHROPIC_API_KEY` — cuando se conecte el motor de IA real (Claude).
- `DATABASE_URL` — cuando se añada persistencia (base de datos).

Ninguna es necesaria para arrancar la versión actual.
