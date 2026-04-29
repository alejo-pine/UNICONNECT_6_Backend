# Testing Guide - Flujo de Abandono de Grupo

## Prerrequisitos

```bash
# 1. Social-service debe estar corriendo en puerto 3003
cd social-service
npm start

# 2. Tendrás que reemplazar estos valores en los ejemplos:
# - TOKEN: Tu JWT token válido (de auth-service)
# - ADMIN_ID: UUID del usuario admin
# - STUDENT_ID: UUID del usuario estudiante
# - GROUP_ID: UUID del grupo creado
```

---

## Flujo Completo de Testing

### Paso 1: Crear un Grupo (Como Admin)

```bash
curl -X POST http://localhost:3003/api/study-groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Cálculo Diferencial",
    "description": "Grupo de estudio para Cálculo",
    "subject_id": "subj-uuid-123"
  }'
```

**Respuesta esperada** (201 Created):
```json
{
  "id": "group-uuid-123",
  "name": "Cálculo Diferencial",
  "description": "Grupo de estudio para Cálculo",
  "subject_id": "subj-uuid-123",
  "creator_id": "admin-uuid",
  "created_at": "2026-04-29T12:34:56Z",
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  },
  "is_admin": true,
  "is_member": true
}
```

**Guardar para usar después**:
```bash
export GROUP_ID="group-uuid-123"
export ADMIN_ID="admin-uuid"
```

---

### Paso 2: Agregar Miembros al Grupo

#### 2.1 Estudiante 1 se une al grupo

```bash
# Como STUDENT_1 (con su propio token)
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/join \
  -H "Authorization: Bearer $TOKEN_STUDENT_1" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (200 OK):
```json
{
  "id": "$GROUP_ID",
  "name": "Cálculo Diferencial",
  "is_admin": false,
  "is_member": true
}
```

#### 2.2 Estudiante 2 se une al grupo

```bash
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/join \
  -H "Authorization: Bearer $TOKEN_STUDENT_2" \
  -H "Content-Type: application/json"
```

**Guardar**:
```bash
export STUDENT_1_ID="student1-uuid"
export STUDENT_2_ID="student2-uuid"
```

---

### Paso 3: Obtener Detalle del Grupo (IMPORTANTE: Aquí ves el subject)

```bash
curl -X GET http://localhost:3003/api/study-groups/$GROUP_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (200 OK):
```json
{
  "id": "group-uuid-123",
  "name": "Cálculo Diferencial",
  "createdBy": "admin-uuid",
  "members": [
    "admin-uuid",
    "student1-uuid",
    "student2-uuid"
  ],
  "pendingRequests": [],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"              ← ✅ AQUÍ ESTÁ EL SUBJECT
  }
}
```

---

### Paso 4: Intentar Abandonar (Como Admin) - DEBE FALLAR 409

```bash
# Como ADMIN_ID (con TOKEN del admin)
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/leave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (409 Conflict):
```json
{
  "error": "Conflict",
  "message": "Admin must transfer group administration before leaving while other members exist"
}
```

✅ **Esto es lo esperado** - El admin NO puede abandonar si hay otros miembros sin transferir primero.

---

### Paso 5: Transferir Administración a STUDENT_1

```bash
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/transfer-admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newAdminUserId": "'$STUDENT_1_ID'"
  }'
```

**Respuesta esperada** (200 OK):
```json
{
  "id": "group-uuid-123",
  "name": "Cálculo Diferencial",
  "createdBy": "student1-uuid",          ← ✅ CAMBIÓ A STUDENT_1
  "members": [
    "admin-uuid",
    "student1-uuid",
    "student2-uuid"
  ],
  "pendingRequests": [],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  }
}
```

---

### Paso 6: Ahora Sí Abandonar (Como Admin Original)

```bash
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/leave \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (200 OK):
```json
{
  "id": "group-uuid-123",
  "name": "Cálculo Diferencial",
  "createdBy": "student1-uuid",
  "members": [
    "student1-uuid",
    "student2-uuid"
    // ← admin-uuid YA NO ESTÁ
  ],
  "pendingRequests": [],
  "subject": {
    "id": "subj-uuid-123",
    "name": "Matemáticas I"
  }
}
```

---

## Pruebas de Casos de Error

### Error 1: Intentar Abandonar Sin Ser Miembro

```bash
# Como usuario que NO es miembro
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/leave \
  -H "Authorization: Bearer $TOKEN_RANDOM" \
  -H "Content-Type: application/json"
```

**Respuesta esperada** (404 Not Found):
```json
{
  "error": "Not Found",
  "message": "You are not a member of this group"
}
```

---

### Error 2: Intentar Transferir Sin Ser Admin

```bash
# Como STUDENT_1 (no es admin) intentando transferir a STUDENT_2
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/transfer-admin \
  -H "Authorization: Bearer $TOKEN_STUDENT_1" \
  -H "Content-Type: application/json" \
  -d '{
    "newAdminUserId": "'$STUDENT_2_ID'"
  }'
```

**Respuesta esperada** (403 Forbidden):
```json
{
  "error": "Forbidden",
  "message": "Forbidden: only admin can transfer administration"
}
```

---

### Error 3: Transferir a No-Miembro

```bash
# Como ADMIN intentando transferir a alguien que NO es miembro
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/transfer-admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newAdminUserId": "random-user-uuid"
  }'
```

**Respuesta esperada** (404 Not Found):
```json
{
  "error": "Not Found",
  "message": "User is not a member of this group"
}
```

---

### Error 4: Transferir a Sí Mismo

```bash
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/transfer-admin \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "newAdminUserId": "'$ADMIN_ID'"
  }'
```

**Respuesta esperada** (409 Conflict):
```json
{
  "error": "Conflict",
  "message": "User is already the group admin"
}
```

---

### Error 5: Sin Token de Autenticación

```bash
curl -X POST http://localhost:3003/api/study-groups/$GROUP_ID/leave \
  -H "Content-Type: application/json"
  # ← Sin Authorization header
```

**Respuesta esperada** (401 Unauthorized):
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

---

## Postman Collection

Aquí está el JSON para importar en Postman:

```json
{
  "info": {
    "name": "Study Groups - Leave & Transfer Admin",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Create Group",
      "request": {
        "method": "POST",
        "url": "{{BASE_URL}}/api/study-groups",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Cálculo Diferencial\",\n  \"description\": \"Grupo de estudio para Cálculo\",\n  \"subject_id\": \"{{SUBJECT_ID}}\"\n}"
        }
      }
    },
    {
      "name": "2. Get Group Detail (includes subject)",
      "request": {
        "method": "GET",
        "url": "{{BASE_URL}}/api/study-groups/{{GROUP_ID}}",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          }
        ]
      }
    },
    {
      "name": "3. Transfer Admin",
      "request": {
        "method": "POST",
        "url": "{{BASE_URL}}/api/study-groups/{{GROUP_ID}}/transfer-admin",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          },
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"newAdminUserId\": \"{{STUDENT_1_ID}}\"\n}"
        }
      }
    },
    {
      "name": "4. Leave Group",
      "request": {
        "method": "POST",
        "url": "{{BASE_URL}}/api/study-groups/{{GROUP_ID}}/leave",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{ADMIN_TOKEN}}"
          }
        ]
      }
    }
  ],
  "variable": [
    {
      "key": "BASE_URL",
      "value": "http://localhost:3003"
    },
    {
      "key": "ADMIN_TOKEN",
      "value": ""
    },
    {
      "key": "GROUP_ID",
      "value": ""
    },
    {
      "key": "STUDENT_1_ID",
      "value": ""
    },
    {
      "key": "SUBJECT_ID",
      "value": ""
    }
  ]
}
```

---

## Script Automatizado (Bash)

Si deseas automatizar todo el flujo:

```bash
#!/bin/bash

set -e

BASE_URL="http://localhost:3003"
ADMIN_TOKEN="$1"
SUBJECT_ID="$2"

echo "🚀 Iniciando flujo de testing..."

# Crear grupo
echo "1. Creando grupo..."
GROUP_RESPONSE=$(curl -s -X POST $BASE_URL/api/study-groups \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"Test Group $(date +%s)\", \"description\": \"Test\", \"subject_id\": \"$SUBJECT_ID\"}")

GROUP_ID=$(echo $GROUP_RESPONSE | jq -r '.id')
echo "   ✅ Grupo creado: $GROUP_ID"

# Obtener detalle (verificar subject)
echo "2. Obteniendo detalle del grupo..."
DETAIL=$(curl -s -X GET "$BASE_URL/api/study-groups/$GROUP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

SUBJECT_NAME=$(echo $DETAIL | jq -r '.subject.name')
echo "   ✅ Subject encontrado: $SUBJECT_NAME"

# Intentar abandonar sin transferir
echo "3. Intentando abandonar (debe fallar con 409)..."
LEAVE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/study-groups/$GROUP_ID/leave" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

HTTP_CODE=$(echo "$LEAVE_RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "409" ]; then
  echo "   ✅ Correctamente rechazado (409)"
else
  echo "   ❌ Error: Se esperaba 409, se obtuvo $HTTP_CODE"
fi

echo ""
echo "✅ Flujo de testing completado"
```

---

## Verificación Clave

**Confirma que en la respuesta de `GET /study-groups/:groupId` aparece**:

```json
"subject": {
  "id": "subj-uuid",
  "name": "Nombre de la Materia"  ← ✅ DEBE ESTAR PRESENTE
}
```

Si no aparece el subject, verifica:
1. ✅ La materia existe en BD (tabla `subject`)
2. ✅ El grupo tiene un `subject_id` válido que hace referencia a esa materia
3. ✅ El repositorio está cargando `subject!subject_id(id, name)` en la query

---

**Status**: ✅ Ready para testing manual o automatizado
