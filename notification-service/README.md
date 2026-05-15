# notification-service

Microservicio centralizado de notificaciones para UniConnect. Implementado con **Node.js + Express + TypeScript + Socket.io** siguiendo **Clean Architecture** y principios **SOLID**.

---

## Estructura del servicio

```
notification-service/
├── src/
│   ├── app.ts                          # Instancia Express
│   ├── server.ts                       # Entry point: HTTP + Socket.io
│   ├── dependencies.ts                 # Inyección de dependencias
│   ├── config/
│   │   └── env.ts                      # Validación y tipado de variables de entorno
│   ├── domain/
│   │   ├── entities/
│   │   │   └── notification.ts         # Entidad principal + tipos
│   │   └── ports/
│   │       └── notificationRepositoryPort.ts  # Interface del repositorio
│   ├── application/
│   │   ├── dto/
│   │   │   ├── serviceResult.ts        # DTO genérico ServiceResult<T>
│   │   │   └── notificationDto.ts      # DTOs request/response
│   │   └── use-cases/
│   │       ├── createNotificationUseCase.ts
│   │       ├── getUserNotificationsUseCase.ts
│   │       └── markNotificationAsReadUseCase.ts
│   ├── infrastructure/
│   │   └── supabaseNotificationRepository.ts  # Implementación concreta (Supabase)
│   ├── interfaces/
│   │   └── http/
│   │       └── notificationController.ts      # Controladores HTTP
│   ├── routes/
│   │   └── notificationRoutes.ts       # Definición de rutas
│   ├── realtime/
│   │   └── socketManager.ts            # Gestión de Socket.io
│   └── utils/
│       ├── controller.ts               # asyncHandler + sendServiceResult
│       ├── eventLogger.ts              # Logger centralizado (Singleton)
│       ├── httpError.ts                # Clase HttpError
│       └── supabaseClient.ts           # Cliente Supabase
├── .dockerignore
├── .env.example
├── Dockerfile
├── fly.toml
├── package.json
└── tsconfig.json
```

---

## Variables de entorno

| Variable | Requerida | Descripción | Ejemplo |
|---|---|---|---|
| `SUPABASE_URL` | ✅ | URL del proyecto Supabase | `https://xxx.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service Role Key de Supabase | `eyJ...` |
| `PORT` | ❌ | Puerto del servidor | `3005` |
| `NODE_ENV` | ❌ | Entorno de ejecución | `development` |
| `CORS_ALLOWED_ORIGINS` | ❌ | Orígenes CORS permitidos (CSV) | `http://localhost:3000` |

> Las variables se configuran con `fly secrets set` en producción, **nunca en fly.toml**.

---

## Comandos disponibles

```bash
# Desarrollo (con hot-reload)
npm run dev

# Compilar TypeScript
npm run build

# Producción
npm start

# Tests
npm test

# Linter
npm run lint
```

---

## Endpoints

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check del servicio |
| `POST` | `/notifications` | Crear nueva notificación |
| `GET` | `/notifications/:userId` | Obtener notificaciones de un usuario |
| `PATCH` | `/notifications/:id/read` | Marcar notificación como leída |

---

## Ejemplos de request/response

### POST /notifications
```json
// Request
{
  "recipientUserId": "abc-123",
  "title": "Solicitud de ingreso",
  "message": "El usuario juan quiere unirse a tu grupo de Cálculo.",
  "type": "SOLICITUD_INGRESO"
}

// Response 201
{
  "data": {
    "id": "uuid-generado",
    "recipientUserId": "abc-123",
    "title": "Solicitud de ingreso",
    "message": "El usuario juan quiere unirse a tu grupo de Cálculo.",
    "type": "SOLICITUD_INGRESO",
    "read": false,
    "createdAt": "2026-05-14T21:00:00.000Z"
  }
}
```

### GET /notifications/:userId
```json
// GET /notifications/abc-123
// Response 200
{
  "data": [
    {
      "id": "uuid-1",
      "recipientUserId": "abc-123",
      "title": "Solicitud de ingreso",
      "message": "...",
      "type": "SOLICITUD_INGRESO",
      "read": false,
      "createdAt": "2026-05-14T21:00:00.000Z"
    }
  ]
}
```

### PATCH /notifications/:id/read
```json
// PATCH /notifications/uuid-1/read
// Response 200
{
  "data": {
    "id": "uuid-1",
    "read": true,
    ...
  }
}
```

---

## Ejecución local

```bash
# 1. Copiar variables de entorno
cp .env.example .env
# Editar .env con tus valores reales de Supabase

# 2. Instalar dependencias
npm install

# 3. Ejecutar en modo desarrollo
npm run dev
# Servidor en: http://localhost:3005
# Socket.io activo en: ws://localhost:3005
```

---

## WebSocket — Conexión desde el cliente

Los clientes se conectan pasando `userId` como query param:

```javascript
import { io } from 'socket.io-client';

const socket = io('https://uniconnect-notification-service.fly.dev', {
  query: { userId: 'abc-123' },
  transports: ['websocket'],
});

socket.on('notification:new', (notification) => {
  console.log('Nueva notificación:', notification);
});
```

---

## Integración con API Gateway

El API Gateway redirige `/notifications/*` a este servicio mediante `NOTIFICATION_SERVICE_URL`:

```bash
# Variable de entorno en el API Gateway
NOTIFICATION_SERVICE_URL=https://uniconnect-notification-service.fly.dev
# o en local:
NOTIFICATION_SERVICE_URL=http://localhost:3005
```

Ejemplo de consumo desde el gateway:
```http
POST https://uniconnect-api-gateway.fly.dev/notifications
GET  https://uniconnect-api-gateway.fly.dev/notifications/:userId
PATCH https://uniconnect-api-gateway.fly.dev/notifications/:id/read
```

---

## Tabla Supabase requerida

```sql
CREATE TABLE notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id UUID NOT NULL REFERENCES profile(id),
  title             TEXT NOT NULL,
  message           TEXT NOT NULL,
  type              TEXT NOT NULL,
  read              BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
```

---

## URL pública (Fly.io)

```
https://uniconnect-notification-service.fly.dev
```

Health check: `GET https://uniconnect-notification-service.fly.dev/health`

---

## Tipos de notificación disponibles

| Tipo | Descripción |
|---|---|
| `SOLICITUD_INGRESO` | Solicitud para unirse a un grupo |
| `MIEMBRO_ACEPTADO` | Solicitud aceptada |
| `MIEMBRO_RECHAZADO` | Solicitud rechazada |
| `NUEVO_MENSAJE` | Nuevo mensaje en un chat |
| `EVENTO_GRUPO` | Evento en un grupo |
| `SISTEMA` | Notificación del sistema |
