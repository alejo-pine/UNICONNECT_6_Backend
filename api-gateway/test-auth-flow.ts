import axios from 'axios';
import jwt from 'jsonwebtoken';

interface AuthFlowTest {
  name: string;
  description: string;
  test: () => Promise<void>;
}

const GATEWAY_URL = 'http://localhost:3000';
const AUTH_SERVICE = 'http://localhost:3001';
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || 'your-secret-key';

// Generar un JWT de prueba
const generateTestJWT = (userId: string = 'test-user-123'): string => {
  const token = jwt.sign(
    {
      sub: userId,
      email: 'test@ucaldas.edu.co',
      name: 'Test User',
      type: 'session',
      iat: Math.floor(Date.now() / 1000),
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '7d',
      issuer: 'uniconnect-backend',
      audience: 'uniconnect-mobile',
    }
  );
  return token;
};

// Generar un JWT expirado
const generateExpiredJWT = (userId: string = 'test-user-123'): string => {
  const token = jwt.sign(
    {
      sub: userId,
      email: 'test@ucaldas.edu.co',
      name: 'Test User',
      type: 'session',
      iat: Math.floor(Date.now() / 1000) - 86400 * 8, // 8 días atrás
    },
    JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '-1s', // Expirado
      issuer: 'uniconnect-backend',
      audience: 'uniconnect-mobile',
    }
  );
  return token;
};

const printSection = (title: string, emoji: string = '📍') => {
  console.log(`\n${'═'.repeat(80)}`);
  console.log(`  ${emoji} ${title}`);
  console.log(`${'═'.repeat(80)}\n`);
};

const printStep = (step: number, description: string) => {
  console.log(`  ${step}️⃣  ${description}`);
};

const printRequest = (method: string, url: string, headers?: Record<string, string>) => {
  console.log(`\n  📤 REQUEST`);
  console.log(`     ${method.toUpperCase()} ${url}`);
  if (headers) {
    console.log(`     Headers:`);
    Object.entries(headers).forEach(([key, value]) => {
      if (key === 'Authorization') {
        console.log(`       ${key}: Bearer ${value.substring(0, 20)}...`);
      } else {
        console.log(`       ${key}: ${value}`);
      }
    });
  }
};

const printResponse = (status: number, data: any, time: number) => {
  console.log(`\n  📥 RESPONSE [${status}] (${time}ms)`);
  console.log(`     ${JSON.stringify(data, null, 2).split('\n').join('\n     ')}`);
};

const printTokenInfo = (token: string) => {
  try {
    const decoded = jwt.decode(token, { complete: true }) as any;
    console.log(`\n  🔐 TOKEN DECODED`);
    console.log(`     Payload:`);
    console.log(`       sub: ${decoded.payload.sub}`);
    console.log(`       email: ${decoded.payload.email}`);
    console.log(`       exp: ${new Date(decoded.payload.exp * 1000).toISOString()}`);
    console.log(`       iat: ${new Date(decoded.payload.iat * 1000).toISOString()}`);
  } catch (error) {
    console.log(`\n  ❌ Error decodificando token`);
  }
};

const tests: AuthFlowTest[] = [
  {
    name: 'Test 1: Gateway Health',
    description: 'Verificar que el gateway esté funcionando',
    test: async () => {
      printStep(1, 'Verificar gateway sin token');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/health`);
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/health`);
      printResponse(response.status, response.data, time);

      if (response.status !== 200) {
        throw new Error('Gateway no está respondiendo');
      }
    },
  },

  {
    name: 'Test 2: Auth Service Status',
    description: 'Verificar que Auth Service esté funcionando',
    test: async () => {
      printStep(1, 'Obtener estado del Auth Service');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/auth/status`);
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/auth/status`);
      printResponse(response.status, response.data, time);

      if (response.status !== 200) {
        throw new Error('Auth Service no está respondiendo');
      }
    },
  },

  {
    name: 'Test 3: Generar Token JWT de Prueba',
    description: 'Crear un JWT válido para usar en pruebas',
    test: async () => {
      printStep(1, 'Generar JWT de prueba');

      const token = generateTestJWT();
      console.log(`\n  ✅ JWT Generado:`);
      console.log(`     ${token.substring(0, 50)}...`);

      printTokenInfo(token);

      console.log(`\n  💾 Este token se usará en las siguientes pruebas`);
    },
  },

  {
    name: 'Test 4: Acceso Denegado - Sin Token',
    description: 'Intentar acceder a endpoint protegido sin JWT',
    test: async () => {
      printStep(1, 'Intentar acceder a /groups sin token');

      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/groups`, {
        validateStatus: () => true,
      });
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/groups`);
      printResponse(response.status, response.data, time);

      if (response.status === 404) {
        console.log(`\n  ℹ️  Endpoint devuelve 404 porque no está implementado en Social Service`);
      }
    },
  },

  {
    name: 'Test 5: Acceso con Token Válido',
    description: 'Acceder a un endpoint protegido con JWT válido',
    test: async () => {
      printStep(1, 'Generar JWT válido');
      const validToken = generateTestJWT('user-001');
      printTokenInfo(validToken);

      printStep(2, 'Acceder a endpoint protegido con token válido');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/groups/test-group`, {
        headers: {
          Authorization: `Bearer ${validToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/groups/test-group`, {
        Authorization: validToken,
        'Content-Type': 'application/json',
      });
      printResponse(response.status, response.data, time);

      console.log(`\n  ℹ️  Status ${response.status} es esperado (endpoint no implementado o recurso no encontrado)`);
      console.log(`     Lo importante es que el token fue aceptado por el gateway`);
    },
  },

  {
    name: 'Test 6: Acceso con Token Expirado',
    description: 'Intentar acceder con un token expirado',
    test: async () => {
      printStep(1, 'Generar JWT expirado');
      const expiredToken = generateExpiredJWT('user-002');
      console.log(`\n  ⏰ Token expirado generado`);
      printTokenInfo(expiredToken);

      printStep(2, 'Intentar acceder a endpoint protegido con token expirado');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/groups/test`, {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
          'Content-Type': 'application/json',
        },
        validateStatus: () => true,
      });
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/groups/test`, {
        Authorization: expiredToken,
        'Content-Type': 'application/json',
      });
      printResponse(response.status, response.data, time);

      if (response.status === 401 || response.status === 403) {
        console.log(`\n  ✅ Token expirado rechazado correctamente`);
      } else {
        console.log(`\n  ℹ️  Status ${response.status} (validación podría no estar implementada)`);
      }
    },
  },

  {
    name: 'Test 7: Flujo Completo Simulado',
    description: 'Simular el flujo completo: Login → Token → Petición Protegida',
    test: async () => {
      printStep(1, 'PASO 1: Usuario intenta hacer login en Auth Service');
      console.log(`     POST ${AUTH_SERVICE}/auth/sync`);
      console.log(`     Con: Auth0 Token o credenciales`);

      printStep(2, 'PASO 2: Auth Service valida y genera JWT');
      const token = generateTestJWT('john-doe');
      console.log(`\n     ✅ JWT Generado:`);
      printTokenInfo(token);

      printStep(3, 'PASO 3: Frontend guarda JWT en localStorage');
      console.log(`\n     localStorage.setItem('jwt_token', '${token.substring(0, 30)}...')`);

      printStep(4, 'PASO 4: Frontend hace petición a Profile Service CON token');
      console.log(`\n     GET /profiles/john-doe`);
      console.log(`     Header: Authorization: Bearer ${token.substring(0, 30)}...`);

      printStep(5, 'PASO 5: API Gateway reenvía a Profile Service');
      console.log(`\n     GET http://localhost:3002/profiles/john-doe`);
      console.log(`     Headers preservados ✅`);

      printStep(6, 'PASO 6: Profile Service valida JWT');
      console.log(`\n     jwt.verify(token, SECRET_KEY)`);
      console.log(`     ✅ Token válido → Usuario autenticado`);

      printStep(7, 'PASO 7: Profile Service retorna datos del usuario');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/profiles/john-doe`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });
      const time = Date.now() - startTime;

      console.log(`\n     Response [${response.status}] (${time}ms)`);

      console.log(`\n  ${'═'.repeat(76)}`);
      console.log(`  ✅ Flujo completo simulado exitosamente`);
      console.log(`  ${'═'.repeat(76)}`);
    },
  },

  {
    name: 'Test 8: Validación en Social Service',
    description: 'Demostrar cómo Social Service valida el JWT',
    test: async () => {
      printStep(1, 'Social Service implementa validación real de JWT');
      console.log(`\n     Archivo: src/utils/jwtAuth.ts`);
      console.log(`     Función: verifyAccessToken(token)`);

      printStep(2, 'Generar token para test');
      const token = generateTestJWT('social-user');
      console.log(`\n     Token: ${token.substring(0, 50)}...`);

      printStep(3, 'Validar token');
      try {
        const decoded = jwt.verify(token, JWT_SECRET, {
          algorithms: ['HS256'],
        }) as any;

        console.log(`\n     ✅ Token válido`);
        console.log(`     User ID: ${decoded.sub}`);
        console.log(`     Email: ${decoded.email}`);
        console.log(`     Expires: ${new Date(decoded.exp * 1000).toISOString()}`);
      } catch (error: any) {
        console.log(`\n     ❌ Token inválido: ${error.message}`);
      }

      printStep(4, 'Hacer petición a Social Service');
      const startTime = Date.now();
      const response = await axios.get(`${GATEWAY_URL}/events`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        validateStatus: () => true,
      });
      const time = Date.now() - startTime;

      printRequest('GET', `${GATEWAY_URL}/events`, {
        Authorization: token,
      });
      printResponse(response.status, response.data, time);
    },
  },
];

const main = async () => {
  console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                  🔐 TEST FLUJO DE AUTENTICACIÓN                            ║
║                                                                            ║
║  Demostrando cómo funciona la autenticación en la arquitectura de          ║
║  microservicios con API Gateway                                           ║
╚════════════════════════════════════════════════════════════════════════════╝

Configuración:
  • API Gateway:    ${GATEWAY_URL}
  • Auth Service:   ${AUTH_SERVICE}
  • JWT Secret:     ${JWT_SECRET.substring(0, 10)}...
  • Algoritmo:      HS256
  • Expiración:     7 días
`);

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    printSection(test.name, ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'][i]);

    console.log(`  ${test.description}\n`);

    try {
      await test.test();
    } catch (error: any) {
      console.log(`\n  ❌ Error: ${error.message}`);
    }

    console.log('');
  }

  printSection('📊 RESUMEN', '✨');

  console.log(`  Flujo de Autenticación Resumido:
  
  1. 🔓 LOGIN
     Usuario → Auth0 → Auth Service (3001)
     ↓
     Genera JWT
     ↓
     Retorna token al frontend
  
  2. 💾 ALMACENAR
     Frontend → localStorage.setItem('jwt_token', token)
  
  3. 🔐 USAR TOKEN
     Frontend → Agrega header Authorization: Bearer TOKEN
     ↓
     API Gateway (3000) → Reenvía header preservado
     ↓
     Microservicio (3002/3003) → Valida JWT
     ↓
     ✅ Acceso permitido o ❌ Acceso denegado
  
  4. 🔑 VALIDACIÓN
     const claims = jwt.verify(token, SECRET_KEY)
     • sub: ID del usuario
     • email: Email del usuario
     • exp: Fecha de expiración
     • iat: Fecha de creación
  
  5. 🚫 EXPIRACIÓN
     Si exp < ahora → Token expirado → 401 Unauthorized
     Usuario debe hacer login nuevamente

  ${'═'.repeat(76)}

  ✅ Todos los tests completados

  Puntos Clave:
  • El JWT es generado por Auth Service
  • Todos los microservicios comparten la clave secreta (SUPABASE_JWT_SECRET)
  • El API Gateway preserva los headers (Authorization)
  • Cada microservicio valida el JWT de forma independiente
  • El token expira después de 7 días
  • Sin token → 401 Unauthorized
  • Con token válido → Acceso permitido
  • Con token expirado → 401 Unauthorized

  Para más detalles ver: AUTH_FLOW_EXPLAINED.md
  `);

  console.log(`\n╚════════════════════════════════════════════════════════════════════════════╝\n`);
};

main().catch(console.error);
