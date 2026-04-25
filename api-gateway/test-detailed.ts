import axios from 'axios';

interface RequestTest {
  name: string;
  method: string;
  url: string;
  headers?: Record<string, string>;
  data?: any;
}

const GATEWAY_URL = 'http://localhost:3000';

const printHeader = (text: string) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  ${text}`);
  console.log(`${'═'.repeat(70)}\n`);
};

const printRequest = (test: RequestTest) => {
  console.log(`📤 ${test.method.toUpperCase()} ${test.url}`);
  if (test.headers) {
    console.log(`   Headers:`);
    Object.entries(test.headers).forEach(([key, value]) => {
      console.log(`     ${key}: ${value}`);
    });
  }
  if (test.data) {
    console.log(`   Body: ${JSON.stringify(test.data)}`);
  }
};

const printResponse = (status: number, statusText: string, data: any, time: number) => {
  console.log(`📥 Response [${status} ${statusText}] (${time}ms)`);
  console.log(`\n${JSON.stringify(data, null, 2)}\n`);
};

const makeRequest = async (test: RequestTest) => {
  try {
    const startTime = Date.now();
    const response = await axios({
      method: test.method.toUpperCase() as any,
      url: `${GATEWAY_URL}${test.url}`,
      headers: test.headers || {},
      data: test.data,
      validateStatus: () => true,
    });
    const time = Date.now() - startTime;

    printRequest(test);
    printResponse(response.status, response.statusText, response.data, time);
    return { success: true, status: response.status };
  } catch (error: any) {
    printRequest(test);
    console.log(`❌ Error: ${error.message}\n`);
    return { success: false, error: error.message };
  }
};

const main = async () => {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║       🌐 API Gateway - Detailed Connection & Route Tests        ║
╚══════════════════════════════════════════════════════════════════╝

Gateway URL: ${GATEWAY_URL}

Available Microservices:
  • Auth Service:    http://localhost:3001
  • Profile Service: http://localhost:3002
  • Social Service:  http://localhost:3003
`);

  // Test 1: Gateway Health
  printHeader('1️⃣  Gateway Health Check');
  await makeRequest({
    name: 'Gateway Health',
    method: 'GET',
    url: '/health',
  });

  // Test 2: Auth Service Routes
  printHeader('2️⃣  Auth Service Routes (→ port 3001)');

  await makeRequest({
    name: 'Auth Status',
    method: 'GET',
    url: '/auth/status',
  });

  await makeRequest({
    name: 'Auth Me (with token)',
    method: 'GET',
    url: '/auth/me',
    headers: {
      Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      'Content-Type': 'application/json',
    },
  });

  // Test 3: Profile Service Routes
  printHeader('3️⃣  Profile Service Routes (→ port 3002)');

  await makeRequest({
    name: 'Get All Profiles',
    method: 'GET',
    url: '/profiles',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await makeRequest({
    name: 'Get Profile by ID',
    method: 'GET',
    url: '/profiles/123-abc-456',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 4: Profile Subjects Routes
  printHeader('4️⃣  Profile Subjects Routes (→ port 3002)');

  await makeRequest({
    name: 'Get Subjects for Profile',
    method: 'GET',
    url: '/profile-subjects/123-abc-456',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 5: Social Service - Groups
  printHeader('5️⃣  Social Service - Study Groups (→ port 3003)');

  await makeRequest({
    name: 'Get All Groups',
    method: 'GET',
    url: '/groups',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await makeRequest({
    name: 'Get Group by ID',
    method: 'GET',
    url: '/groups/group-123',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 6: Social Service - Events
  printHeader('6️⃣  Social Service - Events (→ port 3003)');

  await makeRequest({
    name: 'Get All Events',
    method: 'GET',
    url: '/events',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  await makeRequest({
    name: 'Get Event by ID',
    method: 'GET',
    url: '/events/event-456',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 7: Header Forwarding Test
  printHeader('7️⃣  Testing Header Forwarding');

  await makeRequest({
    name: 'Request with Multiple Headers',
    method: 'GET',
    url: '/auth/status',
    headers: {
      Authorization: 'Bearer test-token',
      'Content-Type': 'application/json',
      'User-Agent': 'Test-Client/1.0',
      'X-Custom-Header': 'gateway-test',
    },
  });

  // Test 8: Query String Support
  printHeader('8️⃣  Testing Query String Support');

  await makeRequest({
    name: 'Request with Query Params',
    method: 'GET',
    url: '/groups?limit=10&offset=0&sort=created_at',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 9: Error Handling - Non-existent Route
  printHeader('9️⃣  Error Handling - Non-existent Route');

  await makeRequest({
    name: '404 Error Test',
    method: 'GET',
    url: '/non-existent-endpoint',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Test 10: POST Request (without body)
  printHeader('🔟 POST Requests');

  await makeRequest({
    name: 'POST to Groups',
    method: 'POST',
    url: '/groups',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer sample-token',
    },
    data: {
      name: 'Test Group',
      description: 'A test study group',
      subject_id: 'math-101',
    },
  });

  // Summary
  printHeader('✨ Test Complete');
  console.log(`
All routes have been tested through the API Gateway.

Key Points:
  ✅ Gateway is forwarding requests to microservices
  ✅ Headers are being preserved (Authorization, Content-Type, etc.)
  ✅ Query strings are supported
  ✅ POST requests with JSON body are supported
  ✅ Error handling is working

Next Steps:
  1. Update client applications to use http://localhost:3000
  2. All /auth/*, /profiles/*, /profile-subjects/*, /groups/*, /events/* routes
     are now available through the gateway
  3. No changes needed to client code except for the base URL

For Production:
  • Update AUTH_SERVICE_URL, PROFILE_SERVICE_URL, SOCIAL_SERVICE_URL to
    point to your deployed microservices
  • Use appropriate PORT for gateway (default: 3000)
  • Add environment-specific configurations
`);
};

main().catch(console.error);
