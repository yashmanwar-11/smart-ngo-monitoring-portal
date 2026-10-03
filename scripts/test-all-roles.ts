import { app } from '../server/index';
import { seedDatabase } from '../server/seed';
import http from 'node:http';

async function testAllRoles() {
  console.log('Testing all role logins and dashboard APIs...');
  await seedDatabase();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5098, resolve));
  const BASE_URL = 'http://localhost:5098';

  async function apiCall(path: string, options: any = {}) {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  }

  // Role 1: Admin
  console.log('\n--- 1. Testing Admin (Demo Director [role: Directorate]) ---');
  const adminLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername: 'admin.monitoring@gov.in', password: 'Password@123' })
  });
  console.log('Admin login status:', adminLogin.status, 'user:', adminLogin.data.user?.name);
  const adminToken = adminLogin.data.token;
  
  const adminDash = await apiCall('/api/dashboard/admin', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Admin dashboard metrics status:', adminDash.status, 'kpis:', !!adminDash.data.kpis);

  const notices = await apiCall('/api/notices', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Notices status:', notices.status, 'count:', notices.data?.length);

  const auditLogs = await apiCall('/api/dashboard/audit-logs', {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  console.log('Audit logs status:', auditLogs.status, 'count:', auditLogs.data?.length);

  // Role 2: Inspector
  console.log('\n--- 2. Testing Field Inspector (Vikram Singh) ---');
  const officerLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername: 'vikram.singh@inspection.gov.in', password: 'Password@123' })
  });
  console.log('Officer login status:', officerLogin.status, 'user:', officerLogin.data.user?.name);
  const officerToken = officerLogin.data.token;

  const officerDash = await apiCall('/api/dashboard/inspector', {
    headers: { Authorization: `Bearer ${officerToken}` }
  });
  console.log('Officer dashboard status:', officerDash.status, 'metrics:', officerDash.data.metrics);

  // Role 3: NGO Rep
  console.log('\n--- 3. Testing NGO Rep (Arvind Swaminathan) ---');
  const ngoLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername: 'pratham.delhi@domain.org', password: 'Password@123' })
  });
  console.log('NGO login status:', ngoLogin.status, 'user:', ngoLogin.data.user?.name, 'role:', ngoLogin.data.user?.role, 'ngoId:', ngoLogin.data.user?.ngoId);
  const ngoToken = ngoLogin.data.token;

  const ngoDash = await apiCall('/api/dashboard/ngo', {
    headers: { Authorization: `Bearer ${ngoToken}` }
  });
  console.log('NGO dashboard status:', ngoDash.status, 'ngo name:', ngoDash.data.ngo?.name, 'inspections:', ngoDash.data.inspections?.length);

  // Role 4: Citizen
  console.log('\n--- 4. Testing Citizen (Kavita Sharma) ---');
  const citizenLogin = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ emailOrUsername: 'citizen.kavita@domain.in', password: 'Password@123' })
  });
  console.log('Citizen login status:', citizenLogin.status, 'user:', citizenLogin.data.user?.name, 'role:', citizenLogin.data.user?.role);
  const citizenToken = citizenLogin.data.token;

  const grievances = await apiCall('/api/grievances', {
    headers: { Authorization: `Bearer ${citizenToken}` }
  });
  // Test 5: Fast Switch User API
  console.log('\n--- 5. Testing Fast Switch User API ---');
  const allUsersRes = await apiCall('/api/auth/users');
  console.log('All users count:', allUsersRes.data?.length);

  const switchNgo = await apiCall('/api/auth/switch-user', {
    method: 'POST',
    body: JSON.stringify({ role: 'NGO' })
  });
  console.log('Fast switch to NGO status:', switchNgo.status, 'user:', switchNgo.data.user?.name, 'hasToken:', !!switchNgo.data.token);

  const switchOfficer = await apiCall('/api/auth/switch-user', {
    method: 'POST',
    body: JSON.stringify({ role: 'OFFICER' })
  });
  console.log('Fast switch to Officer status:', switchOfficer.status, 'user:', switchOfficer.data.user?.name, 'hasToken:', !!switchOfficer.data.token);

  server.close();
}

testAllRoles().catch(console.error);
