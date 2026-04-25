# UniConnect Backend

API REST para **UniConnect**, una plataforma universitaria que conecta estudiantes de la Universidad de Caldas. Construida con Node.js, Express 5 y TypeScript, utilizando Supabase como backend-as-a-service (PostgreSQL + Auth).

## Tech Stack

| Tecnología | Versión | Propósito |
|---|---|---|
| Node.js | 24.x | Runtime |
| Express | 5.2 | Framework HTTP |
| TypeScript | 5.9 | Tipado estático (strict mode) |
| Supabase | 2.97 | Base de datos (PostgreSQL) y autenticación |
| JWT (ES256) | — | Verificación de tokens vía JWKS |

**Otras dependencias:** helmet, cors, express-rate-limit, dotenv.

## Arquitectura

El proyecto sigue una arquitectura en capas:

```
Request → Middleware (Auth) → Route → Controller → Service → Repository → Supabase
```

```
src/
├── config/          # Validación de entorno y conexión a BD
├── controllers/     # Lógica HTTP (req/res)
├── middlewares/     # Middleware de autenticación JWT
├── repositories/    # Acceso a datos (queries Supabase)
├── routes/          # Definición de rutas Express
├── services/        # Lógica de negocio
├── types/           # Interfaces TypeScript compartidas
├── utils/           # Clientes (Supabase, JWKS)
├── app.ts           # Instancia Express
└── server.ts        # Entry point (middleware stack, rutas, inicio)
```

## Requisitos previos

- Node.js ≥ 18
- npm
- Proyecto en [Supabase](https://supabase.com) con las tablas del esquema configuradas

## Instalación

```bash
git clone <repo-url>
cd Backend
npm install
```

## Variables de entorno

Crear un archivo `.env` en la raíz del proyecto:

```env
PORT=3001
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
SUPABASE_JWT_SECRET=<jwt-secret>
ALLOWED_DOMAIN=ucaldas.edu.co
NODE_ENV=development
```

| Variable | Requerida | Descripción |
|---|---|---|
| `PORT` | No | Puerto del servidor (default: `3000`) |
| `SUPABASE_URL` | Sí | URL del proyecto Supabase (debe iniciar con `https://`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Sí | Service role key de Supabase (mín. 20 caracteres) |
| `SUPABASE_JWT_SECRET` | Sí | Secreto JWT de Supabase (mín. 20 caracteres) |
| `ALLOWED_DOMAIN` | Sí | Dominio de correo permitido para autenticación |
| `NODE_ENV` | No | Entorno: `development`, `production` o `test` |

La validación ocurre al iniciar la aplicación. Si alguna variable requerida falta o es inválida, el proceso termina con un mensaje descriptivo.

## Scripts

```bash
npm run dev      # Servidor en modo desarrollo (hot reload con tsx)
npm run build    # Compilar TypeScript a dist/
npm start        # Ejecutar build de producción
npm run lint     # Ejecutar ESLint
```

## Endpoints

### Públicos

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/health` | Health check del servidor |
| `GET` | `/api/auth/status` | Estado del servicio de autenticación |
| `POST` | `/api/auth/sync` | Sincroniza o crea el perfil en la tabla `profile` usando `auth0_id` |

`POST /api/auth/sync` ahora también retorna `needsOnboarding` para que el frontend decida si debe mostrar el flujo de onboarding.

### Protegidos (requieren Bearer token)

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/profiles` | Listar todos los perfiles |
| `GET` | `/api/profiles/:id` | Obtener perfil por ID |
| `PUT` | `/api/profiles/:id` | Actualizar perfil por ID |
| `GET` | `/api/materias` | Listar todas las materias |
| `GET` | `/api/materias/:id` | Obtener materia por ID |
| `GET` | `/api/onboarding/status` | Consultar estado de onboarding del usuario autenticado |
| `POST` | `/api/onboarding/complete` | Marcar onboarding como completado (`{ "skipped": true|false }`) |

### Autenticación

Todas las rutas bajo `/api` (excepto `/api/auth`) requieren un token JWT en el header:

```
Authorization: Bearer <token>
```

El token es emitido por **Supabase Auth** (Google OAuth 2.0) y verificado con claves públicas ES256 obtenidas del endpoint JWKS de Supabase. Solo se permiten correos con dominio `@ucaldas.edu.co`.

### Formato de respuesta

**Éxito:**
```json
{
  "data": { ... }
}
```

**Error:**
```json
{
  "error": "Mensaje descriptivo",
  "statusCode": 404
}
```

## Esquema de base de datos

| Tabla | Descripción |
|---|---|
| `perfil` | Perfiles de usuario (vinculado a `auth.users`) |
| `materia` | Catálogo de materias |
| `evento` | Eventos creados por usuarios |
| `grupo_estudio` | Grupos de estudio por materia |
| `recurso` | Recursos compartidos por materia |
| `perfil_materia` | Relación N:M entre perfiles y materias |
| `miembros_grupo` | Relación N:M entre grupos y miembros |
| `profile` | Incluye campos de onboarding (`onboarding_required`, `onboarding_completed_at`, `onboarding_skipped_at`) |

Para habilitar onboarding ejecuta el script SQL:

```bash
supabase/onboarding_schema.sql
```

## Seguridad

- **Helmet** — Headers HTTP seguros
- **CORS** — Configurado por entorno (desarrollo: `*`, producción: `FRONTEND_URL`)
- **Rate limiting** — 100 peticiones por IP cada 15 minutos
- **JWT ES256** — Verificación asimétrica con claves públicas JWKS
- **Validación de dominio** — Solo correos `@ucaldas.edu.co`

## Flujo de inicio

1. Validación de variables de entorno
2. Carga de claves públicas JWKS desde Supabase
3. Verificación de conexión a base de datos
4. Servidor escucha en el puerto configurado
