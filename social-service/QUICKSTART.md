# Quick Start Guide - Social Service Microservice

## 🚀 5-Minute Setup

### 1. Navigate to the microservice directory
```bash
cd social-service
```

### 2. Copy environment variables
```bash
cp .env.example .env
```

### 3. Update `.env` with your Supabase credentials
```bash
# Get these values from your monolith backend .env
SUPABASE_URL=your_url_here
SUPABASE_SERVICE_ROLE_KEY=your_key_here
SUPABASE_JWT_SECRET=your_secret_here
PORT=3003
NODE_ENV=development
```

### 4. Install dependencies
```bash
npm install
```

### 5. Start the service
```bash
npm run dev
```

You should see:
```
✅ JWKS initialized
✅ Database connection verified
✅ Social-service running on port 3003
```

### 6. Verify it's working
```bash
curl http://localhost:3003/health
# Should return: {"status":"ok"}
```

---

## 📚 Available Endpoints

### Public Endpoints (No Auth Required)

```bash
# Get all study groups (paginated)
curl http://localhost:3003/groups

# Get all study groups with custom limit
curl http://localhost:3003/groups?limit=30

# Get all events (paginated)
curl http://localhost:3003/events

# Get events with custom limit
curl http://localhost:3003/events?limit=10

# Get event details
curl http://localhost:3003/events/{eventId}
```

### Protected Endpoints (Auth Required)

Add `-H "Authorization: Bearer {YOUR_JWT_TOKEN}"` header

```bash
# Get your study groups
curl -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3003/groups/my-groups

# Get available groups for a subject
curl -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3003/groups/by-subject/{subjectId}

# Create a study group
curl -X POST \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Advanced Calculus Study Group",
    "description": "Let'\''s master calculus together!",
    "subject_id": "MATH101"
  }' \
  http://localhost:3003/groups

# Join a study group
curl -X POST \
  -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3003/groups/{groupId}/join

# Leave a study group
curl -X POST \
  -H "Authorization: Bearer JWT_TOKEN" \
  http://localhost:3003/groups/{groupId}/leave
```

---

## 🔍 Testing with Real JWT Token

### Option 1: Get token from your monolith
```bash
# From your monolith backend, get a valid JWT token
# Copy it and use in requests above
```

### Option 2: Use your existing test user
```bash
# If you have a test user from the frontend/mobile app
# Get their JWT token and use it
```

---

## 📊 Database Tables Used

The microservice accesses these existing tables (no schema changes):

| Table | Purpose |
|-------|---------|
| `study_group` | Store study groups |
| `group_member` | Store group memberships |
| `event` | Store events |
| `profile_subject` | User course enrollments |
| `subject` | Course/Subject info |
| `profile` | User profiles (for organizer names) |

---

## 🛠️ Available NPM Scripts

```bash
npm run dev        # Start with hot reload (development)
npm run build      # Compile TypeScript to JavaScript
npm start          # Run compiled version (production)
npm run lint       # Check code style with ESLint
```

---

## 🐛 Troubleshooting

### "Failed to connect to database"
- ✅ Check `.env` file has correct SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- ✅ Verify Supabase instance is running
- ✅ Check network connectivity

### "Token de autenticacion requerido" (401)
- ✅ Make sure you're sending valid JWT in Authorization header
- ✅ Token format should be: `Bearer {token}`
- ✅ Token should not be expired

### "Port already in use"
- ✅ Change PORT in .env to different port (e.g., 3004)
- ✅ Or kill process using port: `lsof -ti:3003 | xargs kill -9` (macOS/Linux)

### CORS Issues
- If calling from frontend, add CORS middleware to `server.ts` (not included by default for security)

---

## 📚 Architecture Overview

The microservice follows **Clean Architecture** with layers:

1. **HTTP Layer** (`interfaces/`) - Controllers, Routes
2. **Application Layer** (`application/`) - Use Cases, DTOs
3. **Domain Layer** (`domain/`) - Entities, Repository Interfaces
4. **Infrastructure Layer** (`infrastructure/`) - Supabase Repository Implementations

Each module (study-groups, events) is independently deployable.

---

## 🔐 Security Notes

- JWT verification uses existing Supabase secrets
- All protected routes require valid Bearer token
- Uses both HS256 (Supabase) and ES256 (Auth0) algorithms
- JWKS keys are cached for performance

---

## 📞 Next Steps

1. **Install and run**: `npm install && npm run dev`
2. **Test endpoints**: Try the public endpoints first
3. **Get JWT token**: Use a token from your monolith or mobile app
4. **Test protected routes**: Try endpoints with Authorization header
5. **Deploy**: Build with `npm run build` and deploy `dist/` folder

---

## 📖 Additional Resources

- See [EXTRACTION_SUMMARY.md](./EXTRACTION_SUMMARY.md) for complete architecture
- See [README.md](./README.md) for full documentation
- See `.env.example` for all environment variables

