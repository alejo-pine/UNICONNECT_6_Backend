# Real-time Study Groups Setup ✅

## Summary

Real-time updates for study group requests (accept/reject) are fully implemented and operational.

### ✅ Completed

1. **Backend Event Bus** (`social-service/src/realtime/studyGroupRealtime.ts`)
   - EventEmitter-based event bus for all study group updates
   - Constants: `STUDY_GROUP_UPDATED_EVENT`, `STUDY_GROUP_JOIN_EVENT`, etc.

2. **Socket.IO Server** (`social-service/src/infrastructure/socket/studyGroupSocketServer.ts`)
   - Integrated with HTTP server in `social-service/src/server.ts`
   - Runs on port **3003**
   - Handles room management: `study-group:{groupId}`
   - Validates user membership before allowing room join

3. **Accept/Reject Endpoints Integration**
   - `acceptStudyGroupRequest` emits event to realtime bus
   - `rejectStudyGroupRequest` emits event to realtime bus
   - Payload includes: `{ groupId, members[], pendingRequests[], action }`

4. **API Gateway Proxy** (`api-gateway/src/realtime/socketProxy.ts`)
   - ✅ HTTP Polling proxy working: **`http://localhost:3000/socket.io`**
   - ✅ WebSocket upgrade handler configured (ready for browser clients)
   - Routes all Socket.IO traffic to `social-service:3003`

## Testing

### HTTP Polling Handshake (Confirmed Working)
```bash
curl -s "http://localhost:3000/socket.io/?EIO=4&transport=polling" | head -c 120

# Response:
# 0{"sid":"HzbCgM9WhNrV89p8AAAF","upgrades":["websocket"],"pingInterval":25000,...}
```

## Frontend Integration

### Installation
```bash
npm install socket.io-client
```

### Client Code

```typescript
import { io, Socket } from 'socket.io-client';

// Initialize Socket.IO client connecting through API Gateway
const socket: Socket = io('http://localhost:3000', {
  // Authentication: Send JWT token and user ID
  auth: {
    'x-user-id': currentUserId,        // e.g., 'user-uuid-12345'
    'Authorization': `Bearer ${token}` // Your JWT token
  },
  // Optional: Use long-polling if WebSocket has issues
  transports: ['websocket', 'polling'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Listen for connection
socket.on('connect', () => {
  console.log('✅ Connected to real-time server:', socket.id);
  
  // Join room for a study group
  socket.emit('study-group:join', { groupId: 'group-uuid-here' });
});

// Listen for real-time study group updates
socket.on('study-group:updated', (payload: {
  groupId: string;
  members: Array<{ id: string; name: string }>;
  pendingRequests: Array<{ id: string; name: string }>;
  action: 'request_accepted' | 'request_rejected';
}) => {
  console.log('🔄 Study group updated:', payload);
  
  // Update UI with new data
  if (payload.action === 'request_accepted') {
    console.log(`✅ ${payload.pendingRequests[0]?.name} accepted to group`);
  } else if (payload.action === 'request_rejected') {
    console.log(`❌ Request rejected`);
  }
  
  // Update local state
  setStudyGroupDetail({
    groupId: payload.groupId,
    members: payload.members,
    pendingRequests: payload.pendingRequests
  });
});

// Leave room when component unmounts
socket.on('disconnect', () => {
  console.log('❌ Disconnected from real-time server');
});

// Cleanup
onBeforeUnmount(() => {
  socket.emit('study-group:leave', { groupId: 'group-uuid-here' });
  socket.disconnect();
});
```

### Flow Example

1. **User A** is admin of study group and opens the manage requests page
   ```typescript
   socket.emit('study-group:join', { groupId: '6a5bd16d-...' });
   ```

2. **User B** submitted a join request. Admin clicks "Accept"
   - Backend calls `acceptStudyGroupRequest` endpoint
   - Endpoint emits event: `studyGroupRealtimeBus.emit(STUDY_GROUP_UPDATED_EVENT, {...})`
   - Socket.IO broadcasts to room `study-group:6a5bd16d-...`
   - **User A's page updates in real-time** via `study-group:updated` event

3. **User C** connected but not member of group tries to join
   - Socket.IO validates membership → denies room access
   - No data leakage

## Architecture

```
Frontend (browser)
    ↓ Socket.IO handshake
API Gateway (port 3000)
    ↓ HTTP proxy /socket.io
Social Service (port 3003)
    ↓ Socket.IO server + Observer pattern
Study Group Use-Cases (accept/reject)
    ↓ emit to EventBus
Study Group Realtime Bus
    ↓ broadcast to rooms
Socket.IO rooms (study-group:{groupId})
    ↓ WebSocket/polling
Connected clients (receive update)
```

## Key Files

- **Event Bus**: [social-service/src/realtime/studyGroupRealtime.ts](social-service/src/realtime/studyGroupRealtime.ts)
- **Socket Server**: [social-service/src/infrastructure/socket/studyGroupSocketServer.ts](social-service/src/infrastructure/socket/studyGroupSocketServer.ts)
- **API Gateway Proxy**: [api-gateway/src/realtime/socketProxy.ts](api-gateway/src/realtime/socketProxy.ts)
- **Accept Use-Case**: [social-service/src/study-groups/application/use-cases/acceptStudyGroupRequestUseCase.ts](social-service/src/study-groups/application/use-cases/acceptStudyGroupRequestUseCase.ts)
- **Reject Use-Case**: [social-service/src/study-groups/application/use-cases/rejectStudyGroupRequestUseCase.ts](social-service/src/study-groups/application/use-cases/rejectStudyGroupRequestUseCase.ts)

## Running the Services

### Development

**Terminal 1 - Social Service**
```bash
cd social-service
npm start
# Runs on http://localhost:3003
```

**Terminal 2 - API Gateway**
```bash
cd api-gateway
npm start
# Runs on http://localhost:3000
# Proxies /socket.io to social-service:3003
```

### Production Considerations

1. **CORS**: Configure allowed origins in Socket.IO server
2. **Authentication**: Verify JWT tokens in Socket.IO handshake middleware
3. **Scaling**: Use Socket.IO with Redis adapter for multi-instance deployments
4. **Load Balancer**: Configure sticky sessions or use WebSocket-aware load balancer

## Events Reference

### Server → Client
- **`study-group:updated`**: Emitted when group state changes (accept/reject)
  ```json
  {
    "groupId": "uuid",
    "members": [{ "id": "uuid", "name": "John" }],
    "pendingRequests": [{ "id": "uuid", "name": "Jane" }],
    "action": "request_accepted" | "request_rejected"
  }
  ```

### Client → Server
- **`study-group:join`**: Join room for a group
  ```json
  { "groupId": "uuid" }
  ```
- **`study-group:leave`**: Leave room for a group
  ```json
  { "groupId": "uuid" }
  ```

---

**Status**: ✅ Ready for frontend integration
**Last Updated**: 2026-04-28
