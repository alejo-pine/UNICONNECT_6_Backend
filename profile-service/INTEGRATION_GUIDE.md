# Integration Guide - Profile Service

This guide explains how to integrate the extracted **profile-service** microservice with the existing monolithic backend.

## Quick Start

### 1. Setup Profile Service

```bash
cd profile-service
npm install
cp .env.example .env
# Edit .env with your Supabase credentials
npm run dev
```

Service will run on `http://localhost:3002`

### 2. Update Monolith

Remove profile-related routes from the main backend:

```typescript
// In src/server.ts, remove or comment out:
// import profilesRouter from './routes/profiles/index';
// import profileSubjectsRouter from './routes/profile-subjects/profileSubjectsRoutes';
// 
// app.use('/profiles', authMiddleware, profilesRouter);
// app.use('/profile-subjects', authMiddleware, profileSubjectsRouter);
```

### 3. Update Client Configuration

Create a service registry or configuration file:

```typescript
// config/services.ts
export const SERVICES = {
  monolith: {
    baseUrl: process.env.MONOLITH_URL || 'http://localhost:3000',
  },
  profileService: {
    baseUrl: process.env.PROFILE_SERVICE_URL || 'http://localhost:3002',
  },
};

// Usage in API calls:
const getProfile = async (id: string) => {
  const response = await fetch(
    `${SERVICES.profileService.baseUrl}/profiles/${id}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

## Port Configuration

### Default Ports
- **Monolith**: 3000
- **Profile Service**: 3002

### Custom Ports
Edit `.env` file in profile-service:
```env
PORT=3002
```

## Database Sharing

Both services use the **same Supabase database**:

```
Monolith (3000)  ┐
                 ├─→ Supabase (same project)
Profile Service  ┘
```

**Important**: Ensure environment variables match:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_AVATARS_BUCKET`

## API Endpoint Mapping

### Before Extraction (Monolith)
```
GET    http://localhost:3000/profiles
GET    http://localhost:3000/profiles/:id
GET    http://localhost:3000/profiles/:id/public
PUT    http://localhost:3000/profiles/:id
POST   http://localhost:3000/profiles/:id/avatar
GET    http://localhost:3000/profile-subjects/:profile_id
POST   http://localhost:3000/profile-subjects
DELETE http://localhost:3000/profile-subjects
```

### After Extraction (Microservice)
```
GET    http://localhost:3002/profiles
GET    http://localhost:3002/profiles/:id
GET    http://localhost:3002/profiles/:id/public
PUT    http://localhost:3002/profiles/:id
POST   http://localhost:3002/profiles/:id/avatar
GET    http://localhost:3002/profile-subjects/:profile_id
POST   http://localhost:3002/profile-subjects
DELETE http://localhost:3002/profile-subjects
```

**API responses remain identical** - No changes to request/response format

## Docker Deployment

### Build Docker Image

Create `Dockerfile` in profile-service root:

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build

# Expose port
EXPOSE 3002

# Start server
CMD ["npm", "start"]
```

### Build and Run

```bash
# Build image
docker build -t profile-service:latest .

# Run container
docker run -p 3002:3002 \
  -e SUPABASE_URL=<your-url> \
  -e SUPABASE_SERVICE_ROLE_KEY=<your-key> \
  -e PORT=3002 \
  profile-service:latest
```

### Docker Compose (with Monolith)

```yaml
version: '3.8'

services:
  monolith:
    build:
      context: ./UNICONNECT_2_BACKEND
    ports:
      - "3000:3000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - PORT=3000

  profile-service:
    build:
      context: ./profile-service
    ports:
      - "3002:3002"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - PORT=3002
    depends_on:
      - monolith

volumes:
  supabase_data:
```

## Kubernetes Deployment

### ConfigMap for Shared Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: supabase-config
data:
  SUPABASE_URL: "https://your-project.supabase.co"
  SUPABASE_AVATARS_BUCKET: "avatars"
```

### Secret for Sensitive Data

```bash
kubectl create secret generic supabase-credentials \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=your-key
```

### Profile Service Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: profile-service
  labels:
    app: profile-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: profile-service
  template:
    metadata:
      labels:
        app: profile-service
    spec:
      containers:
      - name: profile-service
        image: your-registry/profile-service:latest
        ports:
        - containerPort: 3002
        envFrom:
        - configMapRef:
            name: supabase-config
        - secretRef:
            name: supabase-credentials
        env:
        - name: PORT
          value: "3002"
        - name: NODE_ENV
          value: "production"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: profile-service
  labels:
    app: profile-service
spec:
  type: ClusterIP
  ports:
  - protocol: TCP
    port: 3002
    targetPort: 3002
  selector:
    app: profile-service
```

### Apply to Kubernetes

```bash
kubectl apply -f configmap.yaml
kubectl apply -f secret.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
```

## Load Balancing

If using multiple instances, configure a load balancer:

### Nginx Configuration

```nginx
upstream profile_service {
    server localhost:3002;
    server localhost:3003;
    server localhost:3004;
}

server {
    listen 80;
    server_name api.uniconnect.local;

    location /profiles {
        proxy_pass http://profile_service;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Host $host;
    }

    location /profile-subjects {
        proxy_pass http://profile_service;
        proxy_set_header Authorization $http_authorization;
        proxy_set_header Host $host;
    }
}
```

## Testing the Integration

### 1. Start Both Services

```bash
# Terminal 1 - Monolith
cd UNICONNECT_2_BACKEND
npm run dev

# Terminal 2 - Profile Service
cd profile-service
npm run dev
```

### 2. Test Profile Service Health

```bash
curl http://localhost:3002/health
# Response: {"status":"ok","service":"profile-service"}
```

### 3. Test Profile Endpoint

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  http://localhost:3002/profiles
```

### 4. Verify Other Monolith Endpoints

```bash
curl http://localhost:3000/study-groups
curl http://localhost:3000/subjects
# Monolith endpoints should still work
```

## Monitoring & Logging

### Service Logs

Profile Service:
```bash
# Development
npm run dev

# Production (with Docker)
docker logs -f profile-service
```

### Health Checks

```bash
# Check profile service
curl http://localhost:3002/health

# Check with interval
watch -n 5 'curl http://localhost:3002/health'
```

### Metrics to Monitor

1. **Response Time**: `/profiles` should respond in < 200ms
2. **Error Rate**: Monitor 4xx and 5xx responses
3. **Database Connections**: Verify Supabase connection is stable
4. **Avatar Upload Success**: Track file upload completion rates
5. **Uptime**: Monitor service availability

## Gradual Migration Strategy

### Phase 1: Shadow Mode (1-2 weeks)
- Both services running
- Monolith still primary
- Mirror requests to profile-service
- Monitor logs for discrepancies

### Phase 2: Canary Deployment (1 week)
- Route 10% of profile traffic to microservice
- Monitor error rates and performance
- Gradually increase traffic: 10% → 25% → 50%

### Phase 3: Full Migration (1 day)
- Route 100% of profile traffic to microservice
- Remove profile routes from monolith
- Keep monolith available for rollback

### Phase 4: Rollback Ready (1 week)
- Monitor microservice stability
- Verify no issues with data consistency
- Prepare to add more services or scale

## Common Integration Issues

### Issue: JWT Token Format Mismatch
**Solution**: Ensure monolith and microservice use the same JWT format and validation

### Issue: Database Connection Errors
**Solution**: Verify SUPABASE_SERVICE_ROLE_KEY is correct for the environment

### Issue: CORS Errors
**Solution**: Profile service has CORS enabled for all origins. For production, configure specific origins in `app.ts`

### Issue: Avatar URL Not Accessible
**Solution**: Check Supabase Storage bucket permissions and SUPABASE_AVATARS_BUCKET name

### Issue: Service Registry Not Finding Profile Service
**Solution**: Ensure service name matches exactly in registry: `profile-service` or `profileService`

## Performance Optimization

### Caching Strategy

Add Redis caching for frequently accessed profiles:

```typescript
// TODO: Implement in use-cases
const getCachedProfile = async (id: string) => {
  const cached = await redis.get(`profile:${id}`);
  if (cached) return JSON.parse(cached);
  
  const profile = await repository.findById(id);
  await redis.setex(`profile:${id}`, 3600, JSON.stringify(profile));
  return profile;
};
```

### Database Query Optimization

- Add indices on `profile.id`, `profile_subject.profile_id`
- Consider pagination for large profile lists
- Use database query caching

## Security Considerations

### 1. API Key Security
- Never commit `.env` files
- Use environment variables in production
- Rotate SUPABASE_SERVICE_ROLE_KEY regularly

### 2. JWT Validation
- Implement proper JWT signature verification
- Add token expiration checks
- Implement token refresh mechanism

### 3. CORS Configuration
- Update CORS origins for production
- Only allow trusted domains

### 4. Rate Limiting
- Add rate limiting to prevent abuse
- Use express-rate-limit or similar

### 5. Input Validation
- Validate all input parameters
- Sanitize file uploads
- Check file size limits

## Maintenance

### Regular Tasks

- Monitor service health (daily)
- Review error logs (daily)
- Check database usage (weekly)
- Update dependencies (monthly)
- Security patches (as needed)

### Update Profile Service

```bash
# Pull latest changes
git pull origin dev

# Install dependencies
npm install

# Build
npm run build

# Test
npm run test

# Deploy
npm start
```

## Support & Documentation

For detailed documentation:
- See `README.md` in profile-service for API details
- See `REFACTORING_SUMMARY.md` for architecture overview
- Check original monolith code for business logic details

---

**Last Updated**: April 2026
**Version**: 1.0.0
