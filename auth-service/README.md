# Auth Service Microservice

A standalone authentication microservice for the Uniconnect platform. This service handles:

- JWT token validation and decoding
- User authentication with institutional email verification
- Auth0 OAuth integration
- Session token generation
- User profile synchronization

## Architecture

This microservice follows a clean architecture pattern with clear separation of concerns:

```
src/
├── config/              # Configuration (env, database settings)
├── domain/              # Core business logic
│   ├── entities/        # Data models
│   └── ports/           # Repository interfaces
├── application/         # Use cases and business logic
│   ├── dto/             # Data transfer objects
│   └── use-cases/       # Business operations
├── infrastructure/      # External integrations (Supabase)
├── interfaces/http/     # HTTP controllers and routes
├── middleware/          # Express middleware (auth, JWT validation)
├── utils/               # Utility functions (JWT, JWKS, logger)
├── routes/              # Express route definitions
├── app.ts               # Express app configuration
└── server.ts            # Server startup and initialization
```

## Installation

1. Clone the repository and navigate to auth-service:
```bash
cd auth-service
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables (see Configuration section)

## Configuration

The following environment variables are required:

### Supabase Configuration
- `SUPABASE_URL`: Your Supabase project URL (must be HTTPS)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key for backend operations
- `SUPABASE_JWT_SECRET`: Secret key used to sign JWT tokens

### Application Settings
- `PORT`: Port to run the service on (default: 3001)
- `NODE_ENV`: Environment (development, production, test)
- `ALLOWED_DOMAIN`: Institutional email domain (e.g., ucaldas.edu.co)
- `BACKEND_PUBLIC_URL`: Public URL of the backend (optional)

### CORS Configuration
- `CORS_ALLOWED_ORIGINS`: Comma-separated list of allowed origins (default: http://localhost:3001)

### Auth0 Configuration (Optional)
- `AUTH0_DOMAIN`: Auth0 domain (e.g., dev-4y4ixca0s1czf015.us.auth0.com)
- `AUTH0_ISSUER`: Auth0 issuer URL (e.g., https://dev-4y4ixca0s1czf015.us.auth0.com/)
- `AUTH0_AUDIENCE`: Auth0 API audience identifier
- `AUTH0_ALLOWED_REDIRECT_URIS`: Comma-separated list of redirect URIs

### Other Settings
- `REQUIRE_AUTH_SYNC_TOKEN`: Whether to require token for sync endpoint (default: false)

## API Endpoints

### Status Endpoint
```http
GET /auth/status
```
Returns service status without authentication.

**Response (200 OK):**
```json
{
  "data": {
    "message": "Auth service operacional",
    "timestamp": "2026-04-19T10:30:00.000Z"
  }
}
```

### Sync Auth Profile
```http
POST /auth/sync
Authorization: Bearer {AUTH0_TOKEN}
Content-Type: application/json
```
Synchronizes Auth0 user information with the local profile database.

**Response (200/201 OK):**
```json
{
  "data": {
    "profile": {
      "id": "uuid",
      "auth0_id": "auth0|123456",
      "email": "user@ucaldas.edu.co",
      "name": "John Doe"
    },
    "sessionToken": "eyJhbGciOiJIUzI1NiIs...",
    "created": false
  }
}
```

### Get Current User
```http
GET /auth/me
Authorization: Bearer {SESSION_TOKEN}
```
Returns information about the authenticated user.

**Response (200 OK):**
```json
{
  "data": {
    "id": "user-uuid",
    "email": "user@ucaldas.edu.co"
  }
}
```

### Logout
```http
POST /auth/logout
Authorization: Bearer {SESSION_TOKEN}
Content-Type: application/json
```
Logs out the user (stateless confirmation).

**Response (200 OK):**
```json
{
  "data": {
    "message": "Sesión cerrada exitosamente"
  }
}
```

### Health Check
```http
GET /health
```
Returns service health status.

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2026-04-19T10:30:00.000Z"
}
```

## Development

### Running in Development Mode
```bash
npm run dev
```

This will start the server with hot reload using tsx.

### Building
```bash
npm run build
```

Compiles TypeScript to JavaScript in the `dist` directory.

### Running Production Build
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

## Error Handling

The service uses consistent error responses:

```json
{
  "error": "Error message",
  "statusCode": 400,
  "details": {} // Only in development
}
```

Common error codes:
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User lacks required permissions (e.g., non-institutional email)
- `415 Unsupported Media Type`: Content-Type is not application/json
- `500 Internal Server Error`: Unexpected server error

## Authentication Flow

### OAuth Flow with Auth0
1. Client obtains Auth0 token through Auth0's OAuth flow
2. Client sends token to `POST /auth/sync` endpoint
3. Service validates token with Auth0 and fetches user info
4. Service syncs user with local database (create if new, update if exists)
5. Service generates a session token signed with Supabase JWT secret
6. Session token is returned to client for subsequent requests

### Token Validation
Tokens are validated using either:
- **HS256 (HMAC)**: Using Supabase JWT secret for tokens generated by the service
- **ES256 (ECDSA)**: Using public keys from Supabase JWKS endpoint for Auth0/external tokens

## Security

- CORS is configured to allow only specified origins
- Helmet middleware adds security headers
- Rate limiting is applied to prevent abuse (100 requests per 15 minutes)
- Institutional email domain verification for authenticated users
- JWT tokens are validated and verified before processing
- JWKS keys are cached for performance but refreshed automatically

## Database Schema

The service expects a `profile` table in Supabase with at least these columns:
- `id` (uuid, primary key)
- `auth0_id` (text)
- `email` (text)
- `name` (text)
- `avatar_url` (text, optional)
- `career` (text, optional)
- `semester` (integer, optional)
- `phone_number` (text, optional)
- `created_at` (timestamp)

## Troubleshooting

### JWKS Initialization Warning
If you see: "Advertencia inicializando JWKS: ..."
- This is a warning, not an error. JWKS keys will be fetched on first use.
- Ensure `SUPABASE_URL` is correctly set.

### Token Validation Errors
- Verify the token is properly formatted: `Bearer {token}`
- Check that the token hasn't expired
- For Auth0 tokens, ensure Auth0 is properly configured

### Domain Restriction
- Users must have an email ending with the `ALLOWED_DOMAIN`
- For development, you can set `ALLOWED_DOMAIN=localhost` or `ALLOWED_DOMAIN=.local`

## License

ISC
