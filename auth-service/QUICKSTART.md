# Auth-Service Quick Start Guide

Get the auth-service running in 5 minutes.

## 1. Setup (2 min)

```bash
cd auth-service
npm install
cp .env.example .env
```

## 2. Configure (1 min)

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
SUPABASE_JWT_SECRET=your-secret-here
PORT=3001
NODE_ENV=development
ALLOWED_DOMAIN=ucaldas.edu.co
```

Copy these from the main backend's `.env` file - they should be the same.

## 3. Run (1 min)

```bash
npm run dev
```

You should see:
```
[auth-service] JWKS inicializado
[auth-service] Servidor escuchando en puerto 3001
[auth-service] Entorno: development
```

## 4. Test (1 min)

### Health Check
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2026-04-19T10:30:00.000Z"
}
```

### Auth Status
```bash
curl http://localhost:3001/auth/status
```

### Get Your Info (with valid token)
```bash
curl http://localhost:3001/auth/me \
  -H "Authorization: Bearer YOUR_SESSION_TOKEN"
```

## 5. Integration

Update your main backend's auth routes to use auth-service. See [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) for detailed steps.

## Common Issues

### ❌ Error: Cannot find module 'tsx'
```bash
npm install tsx -D
```

### ❌ Error: SUPABASE_URL is not defined
Check that `.env` file exists and has all required variables.

### ❌ Port 3001 already in use
Change PORT in `.env` or kill the process:
```bash
lsof -i :3001
kill -9 <PID>
```

### ❌ CORS errors
Verify `CORS_ALLOWED_ORIGINS` in `.env` includes your frontend URL.

## Endpoints Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /health | ❌ | Service health |
| GET | /auth/status | ❌ | Auth service status |
| POST | /auth/sync | Auth0 | Sync user profile |
| GET | /auth/me | Session | Get current user |
| POST | /auth/logout | Session | Logout user |

## Next Steps

- Read [README.md](./README.md) for complete documentation
- Read [INTEGRATION_GUIDE.md](../INTEGRATION_GUIDE.md) for integration with main backend
- See [AUTH_SERVICE_SUMMARY.md](../AUTH_SERVICE_SUMMARY.md) for technical overview

---

Need help? Check the full [README.md](./README.md)
