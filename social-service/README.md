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
