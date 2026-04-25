import axios from 'axios';

interface TestResult {
  step: string;
  status?: number;
  error?: string;
  response?: any;
  success: boolean;
}

const results: TestResult[] = [];

const GATEWAY_URL = 'http://localhost:3000';
const AUTH_SERVICE = 'http://localhost:3001';

// Token de prueba (válido para testing)
const TEST_AUTH0_TOKEN = process.env.TEST_AUTH0_TOKEN || 'test-token-placeholder';

const testEndpoint = async (
  name: string,
  url: string,
  method: 'GET' | 'POST' = 'GET',
  token?: string
) => {
  console.log(`\n📤 ${method} ${url}`);
  console.log(`   Token: ${token ? token.substring(0, 30) + '...' : 'No incluido'}`);

  try {
    const response = await axios({
      method,
      url,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json', // ✅ AGREGADO
      },
      validateStatus: () => true,
    });

    console.log(`   📥 Status: ${response.status}`);
    console.log(`   📄 Response:`, JSON.stringify(response.data, null, 2));

    results.push({
      step: name,
      status: response.status,
      response: response.data,
      success: response.status < 400,
    });

    return response;
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
    results.push({
      step: name,
      error: error.message,
      success: false,
    });
  }
};

const main = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       🔐 Validación del Contrato de Auth Service                ║
╚══════════════════════════════════════════════════════════════════╝

URLs:
  • Gateway: ${GATEWAY_URL}
  • Auth Service: ${AUTH_SERVICE}
`);

  // Test 1: Verificar que Auth Service responde
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TEST 1: Verificar Auth Service`);
  console.log(`${'═'.repeat(70)}`);

  await testEndpoint(
    'Auth Status (sin token)',
    `${GATEWAY_URL}/auth/status`
  );

  // Test 2: Endpoint /sync sin token
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TEST 2: /auth/sync sin token (debería retornar 401)`);
  console.log(`${'═'.repeat(70)}`);

  await testEndpoint(
    'Sync sin token',
    `${GATEWAY_URL}/auth/sync`,
    'POST'
  );

  // Test 3: Endpoint /sync con token de prueba
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TEST 3: /auth/sync con token de prueba`);
  console.log(`${'═'.repeat(70)}`);

  await testEndpoint(
    'Sync con token',
    `${GATEWAY_URL}/auth/sync`,
    'POST',
    TEST_AUTH0_TOKEN
  );

  // Test 4: Verificar la estructura de respuesta esperada
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TEST 4: Análisis del Contrato`);
  console.log(`${'═'.repeat(70)}`);

  const syncResponse = results.find(r => r.step === 'Sync con token');

  if (syncResponse && syncResponse.response) {
    console.log(`\n✅ Estructura de Respuesta Actual:`);
    console.log(JSON.stringify(syncResponse.response, null, 2));

    console.log(`\n📋 Campos Presentes:`);
    const data = syncResponse.response.data || syncResponse.response;
    console.log(`  • sessionToken: ${data.sessionToken ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  • userId: ${data.userId ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  • email: ${data.email ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  • profile: ${data.profile ? '✅ SÍ' : '❌ NO'}`);
    console.log(`  • created: ${data.created !== undefined ? '✅ SÍ' : '❌ NO'}`);

    console.log(`\n⚠️  PROBLEMA:`);
    console.log(`  La respuesta está anidada en { data: {...} }`);
    console.log(`  El frontend probablemente espera: { sessionToken, userId, email }`);
  }

  // Resumen
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`RESUMEN`);
  console.log(`${'═'.repeat(70)}\n`);

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Tests ejecutados: ${results.length}`);
  console.log(`✅ Pasados: ${passed}`);
  console.log(`❌ Fallidos: ${failed}\n`);

  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    console.log(`${icon} ${r.step}`);
    if (r.status) console.log(`   Status: ${r.status}`);
    if (r.error) console.log(`   Error: ${r.error}`);
  });

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`RECOMENDACIÓN`);
  console.log(`${'═'.repeat(70)}\n`);

  console.log(`La respuesta actual es:`);
  console.log(`{
  "data": {
    "profile": { ... },
    "sessionToken": "...",
    "created": true/false
  }
}\n`);

  console.log(`Para que funcione con el frontend esperado, el controlador`);
  console.log(`debería retornar:`);
  console.log(`{
  "sessionToken": "...",
  "userId": "...",
  "email": "...",
  "name": "...",
  "created": true/false
}\n`);

  console.log(`O el frontend debería acceder a: response.data.sessionToken`);
};

main().catch(console.error);
