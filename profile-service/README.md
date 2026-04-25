# Profile Service Microservice

Profile service extracted from the monolithic UNICONNECT backend.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_AVATARS_BUCKET=avatars
PORT=3002
NODE_ENV=development
```

3. Run the development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

5. Start the production server:
```bash
npm start
```

## API Endpoints

### Profiles

- `GET /profiles` - Get all profiles
- `GET /profiles/:id` - Get profile by ID
- `GET /profiles/:id/public` - Get public profile information
- `PUT /profiles/:id` - Update profile
- `POST /profiles/:id/avatar` - Upload avatar for profile
- `PUT /profiles/:id/avatar` - Update avatar for profile
- `PATCH /profiles/:id/avatar` - Patch avatar for profile

### Profile Subjects

- `GET /profile-subjects/:profile_id` - Get subjects for a profile
- `POST /profile-subjects` - Add subject to profile (requires `profile_id` and `subject_id` in body)
- `DELETE /profile-subjects` - Remove subject from profile (requires `profile_id` and `subject_id` in body)

## Environment Variables

- `SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for API access
- `SUPABASE_AVATARS_BUCKET`: Name of the Supabase storage bucket for avatars (default: `avatars`)
- `PORT`: Port on which the service runs (default: `3002`)
- `NODE_ENV`: Environment (`development`, `production`, `test`)

## Database

This service uses Supabase as the database. Ensure the following tables exist:

- `profile` - User profile information
- `profile_subject` - Relationship between profiles and subjects
- `subject` - Subject information

## Authentication

All endpoints except `/health` require JWT authentication via the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

**Note:** The current authentication middleware is a placeholder. Implement proper JWT validation in production.

## Project Structure

```
src/
├── profiles/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   └── ports/
│   ├── infrastructure/
│   └── interfaces/
│       └── http/
├── profile-subjects/
│   ├── application/
│   │   ├── dto/
│   │   └── use-cases/
│   ├── domain/
│   │   ├── entities/
│   │   └── ports/
│   ├── infrastructure/
│   └── interfaces/
│       └── http/
├── config/
│   ├── env.ts
│   └── supabaseClient.ts
├── middleware/
│   └── authMiddleware.ts
├── shared/
│   ├── application/
│   └── http/
├── utils/
│   ├── controller.ts
│   ├── eventLogger.ts
│   ├── httpError.ts
├── app.ts
└── server.ts
```

## Notes

- This service uses Clean Architecture with Domain-Driven Design principles
- All database queries use Supabase
- Avatar uploads are stored in Supabase Storage
- Error handling and logging are centralized through the EventLogger utility
