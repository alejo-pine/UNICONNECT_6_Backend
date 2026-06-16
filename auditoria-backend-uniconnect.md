# Auditoria de Codigo — Backend UniConnect
**Instrucciones para el equipo:** Pega este prompt completo en la IA de tu preferencia (ChatGPT, Gemini, Copilot, etc.). Luego, en el mismo chat, pega el codigo fuente de los archivos que se indican. La IA generara el reporte. Guarda ese reporte como texto y subelo a la plataforma.

---

## PROMPT DE AUDITORIA — BACKEND

Actua como un arquitecto de software senior con especialidad en Node.js, Express y bases de datos relacionales. Tu tarea es realizar una auditoria de codigo rigurosa y detallada del backend del proyecto **UniConnect**, desarrollado por estudiantes universitarios de Ingenieria de Software.

### Contexto del proyecto
UniConnect es una plataforma universitaria construida con:
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js
- **Base de datos:** SQLite con la libreria better-sqlite3 (acceso sincrono)
- **Arquitectura:** API REST monolitica, un solo archivo de rutas (index.js) y un modulo de acceso a datos (db.js)
- **Sprint evaluado:** [COMPLETAR: Sprint 3 / Sprint 4]
- **Historias de usuario implementadas:** [COMPLETAR: ej. US-INF01, US-INF02, US-W01, ...]
- **Configuracion del equipo:** [COMPLETAR: Equipo completo / Pareja / Individual]
- **Integrantes:** [COMPLETAR: nombres]

### Archivos a auditar
El equipo debe pegar el contenido de los siguientes archivos relevantes a las HU implementadas:
- Rutas del backend relacionadas con las HU asignadas (fragmentos de `index.js`)
- Funciones de acceso a datos relacionadas (fragmentos de `db.js`)
- Cualquier archivo de logica adicional (middlewares, helpers, jobs, seeds)

> **Importante:** Pega solo el codigo relevante a las HU asignadas a tu equipo/pareja/persona. No es necesario pegar el archivo completo si es muy extenso.

---

## CRITERIOS DE EVALUACION (100 puntos)

Evalua cada criterio con una nota de 0 a la maxima indicada. Sé muy riguroso: una implementacion basica o parcial no merece mas del 50% de los puntos de ese criterio. Para obtener puntaje alto se requiere evidencia clara y consciente del patron o principio.

---

### 1. PATRONES DE DISENO (40 puntos — criterio principal)

Evalua la presencia, correcta implementacion y justificacion de los siguientes patrones. Para cada patron encontrado, indica: donde se aplica, si esta bien implementado, y que mejoras necesita.

#### 1.1 Patron Repository / Data Access Object (10 pts)
- Las funciones de acceso a datos estan aisladas en `db.js` con responsabilidades claras?
- Existe separacion real entre logica de negocio (routes/index.js) y acceso a datos (db.js)?
- Las consultas SQL estan encapsuladas en funciones con nombres semanticos?
- Se usan Prepared Statements para todas las consultas (evita SQL injection)?
- Las funciones exportadas siguen una interfaz consistente (mismo patron de parametros y retorno)?

**Penalizar duramente si:** la logica SQL esta mezclada con la logica de negocio en las rutas, o si las queries se construyen concatenando strings.

#### 1.2 Patron Middleware / Chain of Responsibility (8 pts)
- Se usan middlewares de Express para validacion, autenticacion y autorizacion?
- Los middlewares son funciones puras con responsabilidad unica?
- La cadena de middlewares es coherente y ordenada (`req → validate → auth → handler`)?
- Se reutilizan middlewares entre rutas similares en lugar de duplicar logica?

**Penalizar si:** la validacion y autenticacion se hacen dentro del handler de la ruta en lugar de separarse como middleware.

#### 1.3 Patron Singleton (6 pts)
- La conexion a la base de datos (instancia de `better-sqlite3`) se crea una sola vez y se reutiliza?
- El modulo `db.js` exporta funciones que usan una unica instancia de la BD?
- Se evita crear multiples conexiones en diferentes partes del codigo?

#### 1.4 Patron Factory / Builder para respuestas y objetos (6 pts)
- Existen funciones helper para construir objetos de respuesta estandarizados?
- Se utilizan funciones de normalizacion/transformacion de datos (ej. `normalizeRow`, `hydrateStory`)?
- Los objetos de respuesta siguen una estructura consistente (mismo formato para todos los endpoints)?
- Se evita la construccion ad-hoc de objetos dentro de cada handler?

#### 1.5 Patron Strategy / Polimorfismo en logica de negocio (5 pts)
- Existen diferentes estrategias de calculo, filtrado o procesamiento que esten desacopladas?
- Se usan funciones de orden superior para variar comportamiento sin modificar la funcion principal?
- El codigo evita grandes bloques `if/else` o `switch` que podrian reemplazarse con estrategias?

#### 1.6 Patron Observer / Event-Driven (5 pts)
- Se usan mecanismos de eventos o callbacks para desacoplar acciones (ej. node-cron para tareas programadas, nodemailer para notificaciones)?
- Los efectos secundarios (envio de correos, logs, actualizaciones en cascada) estan desacoplados del flujo principal?
- Si no hay implementacion observable, penaliza con 0.

---

### 2. PRINCIPIOS SOLID (20 puntos)

#### 2.1 Single Responsibility Principle (5 pts)
- Cada funcion tiene una sola razon para cambiar?
- Los handlers de rutas delegan a funciones especializadas en lugar de hacer todo?
- `db.js` solo maneja acceso a datos (no tiene logica de negocio)?
- `index.js` solo maneja el enrutamiento HTTP (no tiene SQL)?

#### 2.2 Open/Closed Principle (4 pts)
- Se puede agregar nueva funcionalidad (nuevas rutas, nuevos tipos de datos) sin modificar el codigo existente?
- Se usan configuraciones, constantes y mapas para extender comportamiento?

#### 2.3 Liskov Substitution + Interface Segregation (4 pts)
- Las funciones que reciben objetos como parametros no asumen mas propiedades de las necesarias?
- Se usan interfaces minimas (parametros claros, no objetos gigantes)?

#### 2.4 Dependency Inversion (7 pts)
- Las rutas dependen de abstracciones (funciones exportadas) y no de implementaciones concretas de la BD?
- Es posible cambiar la implementacion de la BD sin modificar las rutas?
- Se inyectan dependencias (como el email del usuario o el session token) en lugar de acceder a globals?

---

### 3. CALIDAD DE CODIGO (15 puntos)

#### 3.1 Nomenclatura y legibilidad (5 pts)
- Los nombres de funciones, variables y constantes son descriptivos y en ingles o espanol consistente?
- Se usan nombres que expresan intencion (`getUserById` vs `getU`)?
- Se evitan abreviaciones no estandar?

#### 3.2 Principio DRY — No te repitas (5 pts)
- Existe logica duplicada que deberia estar en una funcion comun?
- Se reutilizan funciones de validacion, transformacion y consulta?

#### 3.3 Complejidad y mantenibilidad (5 pts)
- Las funciones tienen menos de 30 lineas en promedio?
- La complejidad ciclomatica es baja (pocos niveles de anidamiento)?
- Se usan early returns para reducir la profundidad del codigo?

---

### 4. SEGURIDAD (15 puntos)

#### 4.1 Validacion de entrada (6 pts)
- Todos los parametros de ruta (`req.params`), query (`req.query`) y body (`req.body`) se validan antes de usarse?
- Se valida el tipo, rango y formato de cada entrada?
- Se sanitizan los datos antes de persistirlos?

#### 4.2 Autenticacion y autorizacion (6 pts)
- Todos los endpoints protegidos verifican sesion/token antes de ejecutar logica?
- Se distingue correctamente entre autenticacion (quien eres) y autorizacion (que puedes hacer)?
- No existen endpoints que devuelvan datos sensibles sin autenticacion?

#### 4.3 Manejo de errores y exposicion de informacion (3 pts)
- Los errores no exponen stack traces o detalles internos al cliente?
- Se usan codigos HTTP correctos (400, 401, 403, 404, 500)?

---

### 5. ARQUITECTURA Y ESTRUCTURA (10 puntos)

#### 5.1 Separacion de capas (5 pts)
- Existe una separacion clara entre capa de presentacion (HTTP), logica de negocio y acceso a datos?
- Si existe alguna capa de servicio o helper, esta bien delimitada?

#### 5.2 Consistencia de la API REST (5 pts)
- Los endpoints siguen convencion REST (GET para leer, POST para crear, PUT/PATCH para actualizar, DELETE para eliminar)?
- Los nombres de los recursos son sustantivos en plural?
- Las respuestas siguen un formato JSON consistente?

---

## FORMATO DE SALIDA REQUERIDO

Genera el reporte en el siguiente formato markdown exacto. No agregues nada fuera de esta estructura:

```
# Reporte de Auditoria — Backend UniConnect
**Sprint:** [Sprint N]
**Equipo:** [nombre del grupo]
**Historias auditadas:** [lista de US-IDs]
**Fecha:** [fecha actual]
**IA utilizada:** [nombre de la IA]

---

## Puntuacion Total: XX / 100

| Categoria                   | Puntaje | Maximo |
|-----------------------------|---------|--------|
| Patrones de Diseno          |         | 40     |
| Principios SOLID            |         | 20     |
| Calidad de Codigo           |         | 15     |
| Seguridad                   |         | 15     |
| Arquitectura y Estructura   |         | 10     |
| **TOTAL**                   |         | **100**|

---

## 1. Patrones de Diseno (X/40)

### Repository / DAO (X/10)
**Hallazgos:**
[descripcion de lo encontrado, con ejemplos de codigo si aplica]

**Fortalezas:**
- [punto 1]

**Debilidades:**
- [punto 1]

**Recomendaciones:**
- [accion concreta 1]

[repetir para cada patron]

---

## 2. Principios SOLID (X/20)
[misma estructura]

---

## 3. Calidad de Codigo (X/15)
[misma estructura]

---

## 4. Seguridad (X/15)
[misma estructura]

---

## 5. Arquitectura (X/10)
[misma estructura]

---

## Resumen Ejecutivo
[Parrafo de 5-8 oraciones describiendo el estado general del codigo, los patrones mas relevantes encontrados o ausentes, y la madurez tecnica del equipo.]

## Top 5 Mejoras Prioritarias
1. [la mas critica primero]
2.
3.
4.
5.

## Conclusion
[Nota final sobre si el equipo demuestra comprension de los patrones de diseno y principios de arquitectura limpia. Sé honesto y riguroso.]
```

---

**AHORA PEGA EL CODIGO A CONTINUACION DE ESTE MENSAJE**
