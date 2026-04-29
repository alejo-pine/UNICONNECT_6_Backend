# QUICK START - Frontend Integration

## ¿Qué Necesitas Saber?

### 1. El Subject Ahora Se Incluye en la Respuesta

```javascript
// GET /study-groups/:groupId
// RESPUESTA:
{
  id: "group-id",
  name: "Cálculo",
  createdBy: "admin-id",
  members: ["admin-id", "student-1", "student-2"],
  pendingRequests: [],
  subject: {           // ← NUEVO
    id: "subj-id",
    name: "Matemáticas I"
  }
}
```

---

### 2. Flujo de Abandonar Grupo

```javascript
const handleLeaveGroup = async (groupId) => {
  try {
    // Obtener detalle para ver si eres admin
    const group = await axios.get(`/api/study-groups/${groupId}`);
    const currentUserId = getCurrentUser().id;
    
    const isAdmin = group.createdBy === currentUserId;
    const hasOtherMembers = group.members.length > 1;

    // SI eres admin y hay otros miembros → necesitas transferir primero
    if (isAdmin && hasOtherMembers) {
      // Mostrar modal de selección de nuevo admin
      const newAdminId = await showSelectNewAdminModal(
        group.members.filter(m => m !== currentUserId),
        group.subject.name  // ← Puedes usar esto en el modal
      );
      
      // Transferir administración
      await axios.post(
        `/api/study-groups/${groupId}/transfer-admin`,
        { newAdminUserId: newAdminId }
      );
    }
    
    // Ahora sí abandonar
    await axios.post(`/api/study-groups/${groupId}/leave`);
    
    // ✅ Éxito - recargar grupos
    refetchGroups();
    
  } catch (error) {
    if (error.response?.status === 409) {
      // Admin sin transferir
      showError("Debes transferir administración primero");
    } else if (error.response?.status === 403) {
      showError("No perteneces a este grupo");
    } else if (error.response?.status === 404) {
      showError("Grupo no encontrado");
    }
  }
};
```

---

### 3. Componente Selectivo para Nuevo Admin

```jsx
const SelectNewAdminModal = ({ group, onConfirm, onCancel }) => {
  const currentUserId = getCurrentUser().id;
  const otherMembers = group.members.filter(m => m !== currentUserId);
  
  return (
    <Modal title="Transferir Administración del Grupo">
      <p>Eres el admin. Debes elegir a alguien más para administrar:</p>
      <p style={{fontSize: '14px', color: '#666'}}>
        📚 Materia: {group.subject.name}
      </p>
      
      <select onChange={(e) => setSelectedMember(e.target.value)}>
        <option value="">-- Selecciona nuevo admin --</option>
        {otherMembers.map(memberId => (
          <option key={memberId} value={memberId}>
            {getMemberName(memberId)}
          </option>
        ))}
      </select>
      
      <button onClick={() => onConfirm(selectedMember)}>
        Transferir y Abandonar
      </button>
      <button onClick={onCancel}>Cancelar</button>
    </Modal>
  );
};
```

---

### 4. Códigos HTTP a Manejar

| Status | Significado | Acción |
|--------|-------------|--------|
| **200** | Éxito | Recargar grupos |
| **400** | Parámetro inválido | Mostrar error (no debería pasar) |
| **401** | No autenticado | Redirigir a login |
| **403** | No eres admin (para transfer) | Mostrar "Solo admin puede transferir" |
| **404** | Grupo/usuario no existe o no eres miembro | Mostrar error genérico |
| **409** | Admin sin transferir antes de salir | Mostrar modal de transferencia |

---

### 5. Flujo Resumido

```
┌─────────────────────────────────────────────────────────────┐
│  Usuario hace clic en "Abandonar Grupo"                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─► GET /study-groups/:id
                 │    ├─ Obtener grupo
                 │    └─ Verificar si eres admin
                 │
         ┌───────┴─────────────────────────────┐
         │                                     │
    ¿Eres admin?                         ¿Eres admin?
         │                                     │
         NO                                    SÍ
         │                                     │
         │                            ┌────────┴──────────────┐
         │                            │                       │
         │                     ¿Hay otros miembros?   ¿Eres único miembro?
         │                            │                       │
         │                         SÍ │ NO                  SÍ
         │                         │  └─────────────────────►│
         │                         │                         │
         └────────────┬────────────┴─────────────────────┬───┘
                      │                                   │
                 POST /leave (éxito)               POST /leave (éxito)
                      │                                   │
                      └─► Mostrar "¡Te fuiste!"◄─────────┘
         
         Error 409: Mostrar modal de transferencia
            │
            ├─► Usuario selecciona nuevo admin
            │
            ├─► POST /transfer-admin
            │
            └─► POST /leave (ahora sí funciona)
```

---

### 6. Ejemplo Completo en React

```jsx
import { useState } from 'react';
import axios from 'axios';

export const GroupCard = ({ groupId }) => {
  const [loading, setLoading] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [group, setGroup] = useState(null);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState('');
  
  const handleLeaveClick = async () => {
    setLoading(true);
    try {
      // 1. Obtener detalle del grupo
      const res = await axios.get(`/api/study-groups/${groupId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      
      const currentUserId = getCurrentUserId();
      const isAdmin = res.data.createdBy === currentUserId;
      const otherMembers = res.data.members.filter(m => m !== currentUserId);
      
      // 2. Si admin con otros miembros → mostrar modal
      if (isAdmin && otherMembers.length > 0) {
        setGroup(res.data);
        setShowTransferModal(true);
        return;
      }
      
      // 3. Si no es admin o es único miembro → salir directamente
      await attemptLeave();
      
    } catch (error) {
      showError('Error al cargar grupo: ' + error.message);
    }
    setLoading(false);
  };
  
  const handleTransferAndLeave = async () => {
    if (!selectedNewAdmin) {
      showError('Selecciona un nuevo admin');
      return;
    }
    
    try {
      // Transferir
      await axios.post(
        `/api/study-groups/${groupId}/transfer-admin`,
        { newAdminUserId: selectedNewAdmin },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      // Salir
      await attemptLeave();
      
    } catch (error) {
      showError(error.response?.data?.message || 'Error al transferir');
    }
  };
  
  const attemptLeave = async () => {
    try {
      await axios.post(
        `/api/study-groups/${groupId}/leave`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      
      showSuccess('¡Te has ido del grupo!');
      setShowTransferModal(false);
      // Recargar lista de grupos
      refetchGroups();
      
    } catch (error) {
      if (error.response?.status === 409) {
        showError('Debes transferir administración primero');
      } else {
        throw error;
      }
    }
  };
  
  return (
    <>
      <div className="group-card">
        <h3>{group?.name}</h3>
        <p>📚 {group?.subject?.name}</p>
        <button onClick={handleLeaveClick} disabled={loading}>
          {loading ? 'Cargando...' : 'Abandonar Grupo'}
        </button>
      </div>
      
      {showTransferModal && group && (
        <div className="modal">
          <h3>Transferir Administración</h3>
          <p>Materia: <strong>{group.subject.name}</strong></p>
          <p>Eres el admin y hay {group.members.length - 1} miembros más.</p>
          <p>Elige quién será el nuevo administrador:</p>
          
          <select
            value={selectedNewAdmin}
            onChange={(e) => setSelectedNewAdmin(e.target.value)}
          >
            <option value="">-- Selecciona --</option>
            {group.members
              .filter(m => m !== getCurrentUserId())
              .map(memberId => (
                <option key={memberId} value={memberId}>
                  {getMemberDisplayName(memberId)}
                </option>
              ))}
          </select>
          
          <div className="modal-actions">
            <button onClick={handleTransferAndLeave}>
              Transferir y Abandonar
            </button>
            <button onClick={() => setShowTransferModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </>
  );
};
```

---

## Puntos Clave

✅ **El subject ahora está en la respuesta** - Úsalo para mostrar la materia en el modal
✅ **Manejo de 409** - Cuando admin intenta salir sin transferir
✅ **Selección de nuevo admin** - De la lista de `members` (sin pending requests)
✅ **Dos pasos** - Primero transferir, luego salir
✅ **Usuarios conectados ven cambios en vivo** - vía Socket.IO real-time

---

## URLs de Referencia

- **Detalle Completo**: [LEAVE_GROUP_FLOW.md](./LEAVE_GROUP_FLOW.md)
- **Testing Manual**: [TESTING_GUIDE.md](./TESTING_GUIDE.md)
- **Real-time Setup**: [REALTIME_SETUP.md](./REALTIME_SETUP.md)

