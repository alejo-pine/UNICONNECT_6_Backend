# Flujo de Abandono de Grupo con Transferencia de Administración

## Resumen Ejecutivo

Implementación completa del flujo que **evita que un admin abandone el grupo sin transferir primero la administración** a otro miembro. Sistema de reglas de negocio robustas con validaciones en capas (repository, use-case, controller).

---

## 📋 Especificación de Endpoints

### 1. GET `/study-groups/:groupId` - Obtener Detalle del Grupo

**Propósito**: Recuperar información completa del grupo, incluyendo nombre de la materia, miembros, solicitudes pendientes y quién es el admin.

**Request**:
```bash
GET /study-groups/550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: localhost:3003
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cálculo Diferencial",
  "createdBy": "user-uuid-admin",
  "members": [
    "user-uuid-admin",
    "user-uuid-student-1",
    "user-uuid-student-2"
  ],
  "pendingRequests": [
    "user-uuid-waiting-1",
    "user-uuid-waiting-2"
  ],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"  // ← EL SUBJECT AHORA SE INCLUYE
  }
}
```

**Códigos de Error**:
- `401`: No autenticado
- `404`: Grupo no existe

**Notas Importantes**:
- El `subject` ahora se incluye en la respuesta
- El `createdBy` identifica al admin actual
- `members` NO incluye solicitudes pendientes
- Usar este endpoint para obtener la lista de miembros disponibles como nuevos admins

---

### 2. POST `/study-groups/:groupId/transfer-admin` - Transferir Administración

**Propósito**: Un admin transfiere la administración del grupo a otro miembro. **ESTE PASO ES OBLIGATORIO antes de abandonar si hay otros miembros**.

**Request**:
```bash
POST /study-groups/550e8400-e29b-41d4-a716-446655440000/transfer-admin HTTP/1.1
Host: localhost:3003
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json

{
  "newAdminUserId": "user-uuid-student-1"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cálculo Diferencial",
  "createdBy": "user-uuid-student-1",  // ← AHORA CAMBIÓ
  "members": [
    "user-uuid-admin",          // ← El admin anterior queda como miembro regular
    "user-uuid-student-1",      // ← NUEVO ADMIN
    "user-uuid-student-2"
  ],
  "pendingRequests": [
    "user-uuid-waiting-1",
    "user-uuid-waiting-2"
  ],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  }
}
```

**Códigos de Error**:
- `400`: `newAdminUserId` faltante o vacío
- `401`: No autenticado
- `403`: Solo el admin actual puede transferir
- `404`: Grupo no existe O usuario no es miembro del grupo
- `409`: El usuario ya es admin del grupo

**Flujo Lógico (en orden)**:
1. ✅ Validar que estés autenticado
2. ✅ Validar que el grupo exista
3. ✅ Validar que **TÚ ERES el admin actual** (group.createdBy === currentUserId)
4. ✅ Validar que el nuevo admin exista como usuario
5. ✅ Validar que el nuevo admin sea miembro del grupo
6. ✅ Validar que no sea ya el admin
7. ✅ Transferir administración en BD
8. ✅ Retornar grupo actualizado con nuevo createdBy

---

### 3. POST `/study-groups/:groupId/leave` - Abandonar Grupo

**Propósito**: Un miembro abandona el grupo. Si eres el admin y hay otros miembros, **será rechazado** (409) hasta que transfieras la administración.

#### Caso A: Usuario NO es Admin → Abandona Directamente

**Request**:
```bash
POST /study-groups/550e8400-e29b-41d4-a716-446655440000/leave HTTP/1.1
Host: localhost:3003
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cálculo Diferencial",
  "createdBy": "user-uuid-admin",
  "members": [
    "user-uuid-admin",
    "user-uuid-student-1"
    // ← user-uuid-student-2 SE HA IDO
  ],
  "pendingRequests": [
    "user-uuid-waiting-1"
  ],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  }
}
```

#### Caso B: Usuario ES Admin y hay otros miembros → RECHAZADO

**Request** (igual que arriba):

**Response** (409 Conflict):
```json
{
  "error": "Conflict",
  "message": "Admin must transfer group administration before leaving while other members exist"
}
```

**Acciones Requeridas**:
1. ❌ NO se puede abandonar
2. ✅ Llamar a `POST /transfer-admin` primero
3. ✅ Elegir nuevo admin de la lista de `members` (obtenida del endpoint de detalle)
4. ✅ **LUEGO** llamar a este endpoint `/leave`

#### Caso C: Usuario ES Admin y es el ÚNICO miembro → Puede Abandonar

**Request** (igual):

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cálculo Diferencial",
  "createdBy": "user-uuid-admin",
  "members": [],  // ← VACÍO
  "pendingRequests": [
    "user-uuid-waiting-1"
  ],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  }
}
```

**Códigos de Error**:
- `400`: GroupId faltante o vacío
- `401`: No autenticado
- `403`: No perteneces al grupo (usado para ambigüedad de grupo inexistente vs. no miembro)
- `404`: Grupo no existe (primero revisa si existe, luego si eres miembro)
- `409`: **Conflicto de negocio** → Admin sin transferir, o admin quiere abandonar con otros miembros

---

## 🔄 Flujo de Negocio Completo

### Escenario: Admin quiere abandonar grupo con 3 miembros

```
1. Admin abre la UI de "Mis Grupos"
   └─ Llama: GET /study-groups/:groupId
   └─ Obtiene: members = [admin, student1, student2]
              subject = { name: "Matemáticas I" }

2. Admin hace clic en "Abandonar Grupo"
   └─ Llama: POST /study-groups/:groupId/leave
   └─ RESPUESTA: 409 Conflict
      "Debes transferir administración primero"
   └─ Frontend muestra modal: "Elige nuevo admin"

3. Admin selecciona "student1" como nuevo admin
   └─ Llama: POST /study-groups/:groupId/transfer-admin
      Body: { newAdminUserId: "student1-uuid" }
   └─ RESPUESTA: 200 OK
      createdBy: "student1-uuid"
   └─ Frontend muestra: "Administración transferida a student1"

4. Admin intenta abandonar de nuevo
   └─ Llama: POST /study-groups/:groupId/leave
   └─ RESPUESTA: 200 OK
      members = [student1, student2]  // admin ya no está
   └─ Frontend muestra: "¡Te has ido del grupo!"
```

---

## 🛡️ Validaciones por Capa

### Repository Layer (`supabaseStudyGroupRepository.ts`)

✅ `findDetailById(groupId)` - Carga grupo + members + pending requests + subject
✅ `isMember(profileId, groupId)` - Valida que usuario sea miembro
✅ `userExists(profileId)` - Valida que usuario exista en sistema
✅ `transferAdmin(groupId, newAdminId)` - Actualiza `creator_id` en BD
✅ `removeMember(profileId, groupId)` - Elimina miembro de tabla `group_member`

### Use-Case Layer

**LeaveStudyGroupUseCase**:
1. Valida groupId no vacío
2. Valida grupo existe → 404
3. Valida usuario es miembro → 404 (ambiguo a propósito)
4. **SI es admin**:
   - Carga detalle del grupo (members)
   - Cuenta otros miembros
   - SI hay otros → lanza HttpError(409)
   - SI es único → permite salir
5. Llama `removeMember()` en repository
6. Emite evento a realtime bus (para actualizaciones en vivo)

**TransferStudyGroupAdminUseCase**:
1. Valida groupId no vacío → 400
2. Valida newAdminUserId no vacío → 400
3. Valida grupo existe → 404
4. Valida TÚ eres admin → 403
5. Valida nuevo admin NO es admin actual → 409
6. Valida nuevo admin existe en sistema → 404
7. Valida nuevo admin es miembro del grupo → 404
8. Llama `transferAdmin()` en repository
9. Retorna grupo actualizado

### Controller Layer

- Extrae parámetros con validación de tipo (string, trim, etc.)
- Obtiene userId del JWT token
- Pasa a use-case
- Retorna respuesta formateada con status correcto

---

## 📱 Ejemplos de Implementación en Frontend

### React Component: Abandonar Grupo

```typescript
import { useState } from 'react';
import axios from 'axios';

interface GroupDetail {
  id: string;
  name: string;
  createdBy: string;
  members: string[];
  subject?: { name: string };
}

export const LeaveGroupModal = ({ groupId, onClose }: Props) => {
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const currentUserId = useCurrentUser().id;

  // 1. Obtener detalle del grupo
  const loadGroup = async () => {
    try {
      const res = await axios.get(`/api/study-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setGroup(res.data);
    } catch (err) {
      setError('No se pudo cargar el grupo');
    }
  };

  // 2. Intentar abandonar
  const handleLeave = async () => {
    setLoading(true);
    try {
      await axios.post(`/api/study-groups/${groupId}/leave`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onClose(); // ✅ Éxito
    } catch (err: any) {
      if (err.response?.status === 409) {
        // ❌ Admin sin transferir
        setError('Debes transferir administración primero');
        return;
      }
      setError(err.response?.data?.message || 'Error al abandonar grupo');
    }
    setLoading(false);
  };

  // 3. Transferir administración
  const handleTransferAdmin = async (newAdminId: string) => {
    try {
      const res = await axios.post(
        `/api/study-groups/${groupId}/transfer-admin`,
        { newAdminUserId: newAdminId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGroup(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al transferir administración');
    }
  };

  const isAdmin = group?.createdBy === currentUserId;
  const canLeave = !isAdmin || group?.members.length <= 1;

  return (
    <div className="modal">
      <h2>Abandonar Grupo: {group?.name}</h2>
      <p>Materia: {group?.subject?.name}</p>

      {isAdmin && group && group.members.length > 1 && (
        <>
          <p style={{ color: 'red' }}>
            ⚠️ Eres el admin y hay {group.members.length - 1} miembros más.
            Debes transferir administración primero.
          </p>
          <select
            onChange={(e) => handleTransferAdmin(e.target.value)}
            defaultValue=""
          >
            <option value="">-- Selecciona nuevo admin --</option>
            {group.members
              .filter(m => m !== currentUserId)
              .map(memberId => (
                <option key={memberId} value={memberId}>
                  {memberId}  {/* En real, mostrar nombre del usuario */}
                </option>
              ))}
          </select>
        </>
      )}

      <button
        onClick={handleLeave}
        disabled={!canLeave || loading}
      >
        {loading ? 'Abandonando...' : 'Abandonar Grupo'}
      </button>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button onClick={onClose}>Cancelar</button>
    </div>
  );
};
```

---

## 🔧 Detalles Técnicos

### Orden de Verificaciones en `leaveStudyGroupUseCase`

```typescript
async execute(command: LeaveStudyGroupCommand) {
  // 1. Validar entrada
  if (!command.groupId.trim()) {
    throw new HttpError(400, ...);  // 400 Bad Request
  }

  // 2. Validar grupo existe
  const group = await this.studyGroupRepository.findById(command.groupId);
  if (!group) {
    throw new HttpError(404, ...);  // 404 Not Found
  }

  // 3. Validar usuario es miembro
  const isMember = await this.studyGroupRepository.isMember(
    command.profileId, 
    command.groupId
  );
  if (!isMember) {
    throw new HttpError(404, ...);  // 404 (NO 403, para no revelar si grupo existe)
  }

  // 4. SI es admin, validar que puede salir
  if (group.creatorId === command.profileId) {
    const detail = await this.studyGroupRepository.findDetailById(command.groupId);
    const otherMembers = detail.members.filter(m => m !== command.profileId);
    
    if (otherMembers.length > 0) {
      throw new HttpError(
        409, 
        'Admin must transfer group administration before leaving'
      );  // 409 Conflict
    }
  }

  // 5. Ejecutar salida
  await this.studyGroupRepository.removeMember(command.profileId, command.groupId);

  // 6. Emitir evento realtime (estudiantes conectados reciben actualización)
  studyGroupRealtimeBus.emit(STUDY_GROUP_UPDATED_EVENT, {
    groupId: command.groupId,
    members: detail.members,
    action: 'member_left'
  });
}
```

---

## 📊 Matriz de Respuestas

| Escenario | Endpoint | Usuario | Status | Mensaje |
|-----------|----------|---------|--------|---------|
| Usuario normal quiere salir | `/leave` | no-admin | 200 | OK |
| Admin único quiere salir | `/leave` | admin (único) | 200 | OK |
| Admin con otros miembros quiere salir | `/leave` | admin | 409 | Debes transferir primero |
| Admin transfiere a miembro válido | `/transfer-admin` | admin | 200 | OK |
| Admin intenta transferir a sí mismo | `/transfer-admin` | admin | 409 | Ya eres admin |
| Intenta transferir a no-miembro | `/transfer-admin` | admin | 404 | Usuario no es miembro |
| Usuario no-autenticado | Cualquiera | - | 401 | Auth required |
| Grupo inexistente | Cualquiera | - | 404 | Group not found |

---

## 🔐 Seguridad

✅ **Token JWT requerido** en Authorization header
✅ **Validación de propiedad**: Solo admin puede transferir
✅ **Validación de membresía**: No se puede transferir a no-miembros
✅ **Error ambiguo 404** para "grupo no existe" y "no eres miembro" (no revela si grupo existe)
✅ **Deduplicación automática** de miembros (Set en queries)
✅ **Transacciones implícitas** (Supabase maneja consistency)

---

## 🚀 Próximos Pasos

1. **Frontend**: Implementar modal de selección de nuevo admin
2. **Real-time**: Los miembros conectados ven en vivo cuando hay cambios (Socket.IO)
3. **Notificaciones**: Notificar al usuario nuevo admin de su promoción
4. **Auditoría**: Registrar quién transfirió administración a quién y cuándo

---

**Status**: ✅ Implementado y compilado sin errores
**Última actualización**: 2026-04-29
