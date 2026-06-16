# Uniconnect Backend

This repository contains the microservices for the Uniconnect project.

## Public URL (Fly.io Deployment)

The backend is deployed on Fly.io. The API Gateway is accessible publicly at the following stable URL:

**Base URL:** `https://uniconnect-api-gateway.fly.dev`

This URL should be used in the frontend and mobile apps to interact with the backend services.

## Microservices

- API Gateway (`uniconnect-api-gateway`)
- Auth Service (`uniconnect-auth-service`)
- Profile Service (`uniconnect-profile-service`)
- Social Service (`uniconnect-social-service`)
- Chat Service (`uniconnect-chat-service`)
- Notification Service (`uniconnect-notification-service`)

## 📖 OpenAPI & Tipos Compartidos

Este proyecto cuenta con una documentación viva basada en OpenAPI 3, tipos de TypeScript y validadores Zod autogenerados.

### 1. Documentación Viva (Swagger UI)
El **API Gateway** unifica la documentación de todos los microservicios.
Para ver la interfaz de Swagger UI con todos los endpoints disponibles:
- Localmente: Ingresa a `http://localhost:3000/docs`

### 2. ¿Cómo actualizar la documentación?
Cada vez que agregues o modifiques un endpoint en un microservicio:
1. Agrega o actualiza los comentarios JSDoc (`@openapi`) sobre el controlador o ruta.
2. Ejecuta el script de generación en el microservicio correspondiente:
   ```bash
   cd [nombre-del-servicio]
   npm run build:openapi
   ```
   *Nota: Este script también se ejecuta automáticamente al hacer `npm run build`.*

### 3. Compartir los tipos con el Frontend (api-types)
Al lado de la carpeta del backend, existe un paquete llamado `api-types`. Este paquete se encarga de convertir todos los archivos `openapi.json` de los microservicios en tipos de TypeScript e interfaces Zod listos para usar en el Frontend.

**Para regenerar y compilar los tipos compartidos:**
1. Ve a la carpeta `api-types`.
2. Ejecuta:
   ```bash
   npm run generate
   npm run build
   ```
3. Los frontends (Dashboard y Mobile) ya tienen instalada esta dependencia. Cuando agregues nuevos endpoints, regenera el paquete y los frontends tendrán las definiciones estáticas actualizadas de inmediato.
