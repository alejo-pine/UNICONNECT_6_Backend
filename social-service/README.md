# Social Service - Microservice

Microservice extracted from the monolithic backend containing social functionality: study groups and events management.

## Environment Variables

Copy from your main backend `.env` file and adjust the port:

```
PORT=3003
SUPABASE_URL=https://your-supabase-url.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_JWT_SECRET=your_jwt_secret
NODE_ENV=development
```

### Run integration tests:
```bash
npm run test:integration
```

## Guía OpenAPI y Tipos Compartidos (US-DEV01)

El backend expone documentación viva en `/docs` generada desde anotaciones Swagger JSDoc.

### ¿Cómo agregar un nuevo endpoint y actualizar el Frontend?

1. **Agrega el endpoint** en el backend (ej. `social-service/src/.../controller.ts`).
2. **Documenta el endpoint** usando sintaxis JSDoc `@openapi` sobre la declaración de la ruta (ej. en `studyGroupRoutes.ts`):
   ```js
   /**
    * @openapi
    * /study-groups/new-feature:
    *   post:
    *     summary: Mi nuevo feature
    * ...
    */
   ```
3. **Genera el nuevo contrato:** Corre `npm run build` o `npm run build:openapi` en el backend. Esto actualizará `docs/openapi.json`.
4. **Regenera los tipos del Frontend:** Ve a `C:\uniconnect_frontend\UNICONNECT_6_Frontend\api-types` y ejecuta:
   ```bash
   npm run generate
   npm run build
   ```
5. **Úsalos en Dashboard/Mobile:** En tu código React, importa los tipos o esquemas Zod directamente de la librería compartida:
   ```ts
   import { components } from 'uniconnect-api-types';
   type NewFeatureResponse = components["schemas"]["NewFeatureDto"];
   ```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Production

```bash
npm start
```

## API Endpoints

### Study Groups
- `GET /groups` - List all study groups
- `GET /groups?limit=50` - List all study groups with limit
- `GET /groups/by-subject/:subjectId` - Get available groups for a subject (requires auth)
- `GET /groups/my-groups` - Get user's study groups (requires auth)
- `POST /groups` - Create new study group (requires auth)
- `POST /groups/:groupId/join` - Join a study group (requires auth)
- `POST /groups/:groupId/leave` - Leave a study group (requires auth)

### Events
- `GET /events` - List all events
- `GET /events?limit=20` - List events with limit
- `GET /events/:id` - Get event details

### Health
- `GET /health` - Health check endpoint

## Architecture

```
src/
├── config/              # Environment and database configuration
├── middleware/          # Express middleware (auth, etc.)
├── utils/              # Utility functions
├── shared/             # Shared types and interfaces
├── study-groups/       # Study groups module
│   ├── application/    # Use cases and DTOs
│   ├── domain/         # Entities and ports
│   ├── infrastructure/ # Repositories
│   └── interfaces/     # HTTP controllers and routes
├── events/             # Events module
│   ├── application/    # Use cases
│   ├── domain/         # Entities and ports
│   ├── infrastructure/ # Repositories
│   └── interfaces/     # HTTP controllers and routes
└── server.ts           # Main entry point
```

## Database

Uses Supabase with the following tables:
- `study_group` - Study groups
- `group_member` - Group memberships
- `event` - Events
- `profile_subject` - User enrollments
- `subject` - Subjects/Courses
- `notifications` - Persisted user notifications

---

## Patrones de Diseño

Consulta la documentación específica de cada patrón implementado en el microservicio:

- [📘 Patrón Observer — Eventos de Dominio de Grupos de Estudio](./docs/OBSERVER_PATTERN.md)


