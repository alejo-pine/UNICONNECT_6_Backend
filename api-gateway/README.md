# API Gateway

Lightweight API Gateway for Uniconnect microservices. Routes requests to auth-service, profile-service, and social-service.

## Quick Start

```bash
npm install
npm run dev
```

Gateway listens on `http://localhost:3000`

## Scripts

- `npm run dev` - Start with hot reload (development)
- `npm run build` - Build TypeScript to dist/
- `npm start` - Run production build

## Environment Variables

```
PORT=3000
NODE_ENV=development
AUTH_SERVICE_URL=http://localhost:3001
PROFILE_SERVICE_URL=http://localhost:3002
SOCIAL_SERVICE_URL=http://localhost:3003
```

Copy `.env.example` to `.env` and configure as needed.

## API Routes

| Route | Service | Port |
|-------|---------|------|
| `GET /health` | Gateway | 3000 |
| `/auth/*` | auth-service | 3001 |
| `/profiles/*` | profile-service | 3002 |
| `/profile-subjects/*` | profile-service | 3002 |
| `/groups/*` | social-service | 3003 |
| `/events/*` | social-service | 3003 |

## Running All Services

```bash
# Terminal 1: API Gateway (port 3000)
cd api-gateway
npm install
npm run dev

# Terminal 2: Auth Service (port 3001)
cd ../auth-service
npm install
npm run dev

# Terminal 3: Profile Service (port 3002)
cd ../profile-service
npm install
npm run dev

# Terminal 4: Social Service (port 3003)
cd ../social-service
npm install
npm run dev
```

Then access the gateway at `http://localhost:3000`

## Features

✅ Request forwarding to microservices  
✅ Query string support  
✅ Header preservation (Authorization, Content-Type, etc.)  
✅ Request logging middleware  
✅ Error handling (500 on connection failure)  
✅ CORS enabled  
✅ Security headers (Helmet)  
✅ Graceful shutdown (SIGTERM/SIGINT)  

## Example Requests

### Health Check
```bash
curl http://localhost:3000/health
```

### Auth Sync (proxied to auth-service)
```bash
curl -X POST http://localhost:3000/auth/sync \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get User Profiles (proxied to profile-service)
```bash
curl http://localhost:3000/profiles \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Study Groups (proxied to social-service)
```bash
curl http://localhost:3000/groups \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Events (proxied to social-service)
```bash
curl http://localhost:3000/events \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Project Structure

```
api-gateway/
├── src/
│   ├── app.ts                 # Express app setup
│   ├── server.ts              # Server entry point
│   ├── config/
│   │   └── services.ts        # Service URLs & validation
│   ├── middleware/
│   │   └── logger.ts          # Request logging
│   └── routes/
│       └── proxyRoutes.ts     # Proxy request handlers
├── dist/                      # Compiled TypeScript
├── package.json
├── tsconfig.json
├── .env                       # Environment config
├── .env.example               # Config template
├── .gitignore
└── README.md                  # This file
```

## How It Works

1. Client sends request to gateway: `GET /profiles/123`
2. Gateway identifies the service: `profile-service`
3. Gateway forwards to: `http://localhost:3002/profiles/123`
4. Gateway returns response from service to client
5. All headers (Authorization, etc.) are preserved

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 3000
lsof -i :3000
# Kill process
kill -9 <PID>
```

### Service Connection Error
- Verify services are running on correct ports
- Check `.env` URLs match actual service ports
- Review console logs for detailed error messages

### CORS Errors
- Gateway has CORS enabled by default
- Check that client origin is allowed

### Slow Response
- Check if target microservice is running
- Review network connectivity
- Check service logs for errors

## Performance

- **Health check**: < 5ms
- **Proxy request**: depends on target service + network latency
- **Max JSON body size**: 100kb (default Express)

## Security

- ✅ Helmet security headers
- ✅ CORS configured
- ✅ Error messages don't leak internals
- ✅ Supports JWT auth headers
- ✅ URL validation for service endpoints
