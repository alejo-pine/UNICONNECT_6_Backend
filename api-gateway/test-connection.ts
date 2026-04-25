import axios from 'axios';

interface TestResult {
  name: string;
  url: string;
  status: '✅' | '❌';
  statusCode?: number;
  message: string;
  responseTime: number;
}

const tests: TestResult[] = [];

const testEndpoint = async (
  name: string,
  url: string,
  method: 'GET' | 'POST' = 'GET',
  data?: any
): Promise<TestResult> => {
  const startTime = Date.now();
  try {
    const response = await axios({
      method,
      url,
      data,
      timeout: 5000,
      validateStatus: () => true,
    });
    const responseTime = Date.now() - startTime;

    return {
      name,
      url,
      status: response.status < 500 ? '✅' : '❌',
      statusCode: response.status,
      message: `Response: ${response.status}`,
      responseTime,
    };
  } catch (error: any) {
    const responseTime = Date.now() - startTime;
    return {
      name,
      url,
      status: '❌',
      message: `Error: ${error.message}`,
      responseTime,
    };
  }
};

const main = async () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║          🧪 API Gateway Connection Test                   ║
╚═══════════════════════════════════════════════════════════╝
`);

  console.log('Testing Gateway & Microservices Connection...\n');

  // Test Gateway Health
  console.log('1️⃣  Testing API Gateway (Port 3000)...');
  const gatewayHealth = await testEndpoint(
    'Gateway Health',
    'http://localhost:3000/health'
  );
  tests.push(gatewayHealth);

  console.log(`   ${gatewayHealth.status} ${gatewayHealth.message} (${gatewayHealth.responseTime}ms)\n`);

  // Test Auth Service through Gateway
  console.log('2️⃣  Testing Auth Service via Gateway (→ 3001)...');
  const authHealth = await testEndpoint(
    'Auth Service Health',
    'http://localhost:3000/auth/health'
  );
  tests.push(authHealth);
  console.log(`   ${authHealth.status} ${authHealth.message} (${authHealth.responseTime}ms)\n`);

  const authStatus = await testEndpoint(
    'Auth Service Status',
    'http://localhost:3000/auth/status'
  );
  tests.push(authStatus);
  console.log(`   ${authStatus.status} ${authStatus.message} (${authStatus.responseTime}ms)\n`);

  // Test Profile Service through Gateway
  console.log('3️⃣  Testing Profile Service via Gateway (→ 3002)...');
  const profilesTest = await testEndpoint(
    'Profiles Endpoint',
    'http://localhost:3000/profiles'
  );
  tests.push(profilesTest);
  console.log(`   ${profilesTest.status} ${profilesTest.message} (${profilesTest.responseTime}ms)\n`);

  // Test Social Service through Gateway
  console.log('4️⃣  Testing Social Service via Gateway (→ 3003)...');
  const groupsTest = await testEndpoint(
    'Groups Endpoint',
    'http://localhost:3000/groups'
  );
  tests.push(groupsTest);
  console.log(`   ${groupsTest.status} ${groupsTest.message} (${groupsTest.responseTime}ms)\n`);

  const eventsTest = await testEndpoint(
    'Events Endpoint',
    'http://localhost:3000/events'
  );
  tests.push(eventsTest);
  console.log(`   ${eventsTest.status} ${eventsTest.message} (${eventsTest.responseTime}ms)\n`);

  // Test Direct Service Access
  console.log('5️⃣  Testing Direct Service Access (Not via Gateway)...\n');

  const authServiceDirect = await testEndpoint(
    'Auth Service Direct',
    'http://localhost:3001/health'
  );
  tests.push(authServiceDirect);
  console.log(`   Auth (3001):    ${authServiceDirect.status} ${authServiceDirect.message} (${authServiceDirect.responseTime}ms)`);

  const profileServiceDirect = await testEndpoint(
    'Profile Service Direct',
    'http://localhost:3002/health'
  );
  tests.push(profileServiceDirect);
  console.log(`   Profile (3002): ${profileServiceDirect.status} ${profileServiceDirect.message} (${profileServiceDirect.responseTime}ms)`);

  const socialServiceDirect = await testEndpoint(
    'Social Service Direct',
    'http://localhost:3003/health'
  );
  tests.push(socialServiceDirect);
  console.log(`   Social (3003):  ${socialServiceDirect.status} ${socialServiceDirect.message} (${socialServiceDirect.responseTime}ms)\n`);

  // Summary
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                      📊 Summary                           ║
╚═══════════════════════════════════════════════════════════╝
`);

  const passed = tests.filter((t) => t.status === '✅').length;
  const failed = tests.filter((t) => t.status === '❌').length;

  console.log(`
Total Tests: ${tests.length}
✅ Passed: ${passed}
❌ Failed: ${failed}
`);

  console.log('Test Details:');
  console.log('─'.repeat(60));

  tests.forEach((test) => {
    console.log(`${test.status} ${test.name.padEnd(30)} ${test.statusCode ? `(${test.statusCode})` : ''}`);
    console.log(`   URL: ${test.url}`);
    console.log(`   Response: ${test.message}`);
    console.log(`   Time: ${test.responseTime}ms`);
    console.log('');
  });

  // Recommendations
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   💡 Recommendations                      ║
╚═══════════════════════════════════════════════════════════╝
`);

  const gatewayWorking = tests.some(
    (t) => t.name === 'Gateway Health' && t.status === '✅'
  );

  if (!gatewayWorking) {
    console.log('❌ Gateway is not responding');
    console.log('   → Start gateway: cd api-gateway && npm run dev\n');
  } else {
    console.log('✅ Gateway is running\n');
  }

  const authServiceWorking = tests.some(
    (t) => t.name === 'Auth Service Direct' && t.status === '✅'
  );
  if (!authServiceWorking) {
    console.log('❌ Auth Service (3001) is not responding');
    console.log('   → Start it: cd auth-service && npm run dev\n');
  } else {
    console.log('✅ Auth Service is running\n');
  }

  const profileServiceWorking = tests.some(
    (t) => t.name === 'Profile Service Direct' && t.status === '✅'
  );
  if (!profileServiceWorking) {
    console.log('❌ Profile Service (3002) is not responding');
    console.log('   → Start it: cd profile-service && npm run dev\n');
  } else {
    console.log('✅ Profile Service is running\n');
  }

  const socialServiceWorking = tests.some(
    (t) => t.name === 'Social Service Direct' && t.status === '✅'
  );
  if (!socialServiceWorking) {
    console.log('❌ Social Service (3003) is not responding');
    console.log('   → Start it: cd social-service && npm run dev\n');
  } else {
    console.log('✅ Social Service is running\n');
  }

  console.log(`
╔═══════════════════════════════════════════════════════════╗
║              ✨ Test Complete                             ║
╚═══════════════════════════════════════════════════════════╝
`);

  process.exit(passed === tests.length ? 0 : 1);
};

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});
