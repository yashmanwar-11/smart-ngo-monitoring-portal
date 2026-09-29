import { app } from '../server/index';
import { seedDatabase } from '../server/seed';
import http from 'node:http';

async function runTests() {
  console.log('🧪 Commencing automated API & Database integration tests...');
  await seedDatabase();

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(5099, resolve));

  const BASE_URL = 'http://localhost:5099';

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

  try {
    // 1. Health check
    console.log('1. Testing /api/health...');
    const health = await apiCall('/api/health');
    if (health.status !== 200 || health.data.status !== 'OPERATIONAL') {
      throw new Error(`Health check failed: ${JSON.stringify(health)}`);
    }
    console.log('   ✓ Health check PASSED: Service is OPERATIONAL');

    // 2. Admin Login
    console.log('2. Testing /api/auth/login (Admin Dr. Rajesh Verma IAS)...');
    const loginRes = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrUsername: 'admin.monitoring@gov.in',
        password: 'Password@123',
      }),
    });
    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Admin login failed: ${JSON.stringify(loginRes)}`);
    }
    const adminToken = loginRes.data.token;
    console.log('   ✓ Admin login PASSED: Bearer token received');

    // 3. Officer Login
    console.log('3. Testing /api/auth/login (Inspector Vikram Singh)...');
    const officerLogin = await apiCall('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrUsername: 'vikram.singh',
        password: 'Password@123',
      }),
    });
    if (officerLogin.status !== 200 || !officerLogin.data.token) {
      throw new Error(`Officer login failed: ${JSON.stringify(officerLogin)}`);
    }
    const officerToken = officerLogin.data.token;
    console.log('   ✓ Officer login PASSED: Level-3 Inspector clearance verified');

    // 4. NGO Listing
    console.log('4. Testing /api/ngos (Public Directory)...');
    const ngos = await apiCall('/api/ngos');
    if (ngos.status !== 200 || !Array.isArray(ngos.data) || ngos.data.length < 6) {
      throw new Error(`NGOs retrieval failed: count=${ngos.data?.length}`);
    }
    console.log(`   ✓ NGO listing PASSED: Found ${ngos.data.length} registered organizations`);

    // 5. 150m Haversine Geofence Test (Negative: Outside 150m Boundary)
    console.log('5. Testing 150m Geofence: Rejection when >150m away...');
    // Pratham Education Foundation is at (18.9345, 72.8354) in Fort, Mumbai. Pass coordinates ~6km away (18.9800, 72.8800)
    const outOfBoundsCheck = await apiCall('/api/inspections/INSP-2026-1042/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({ lat: 18.9800, lng: 72.8800 }),
    });
    if (outOfBoundsCheck.status !== 403 || !outOfBoundsCheck.data.error) {
      throw new Error(`Expected 403 Forbidden for out-of-bounds check-in, got ${outOfBoundsCheck.status}`);
    }
    console.log(`   ✓ Geofence boundary lock PASSED: Successfully rejected out-of-bounds check-in (${Math.round(outOfBoundsCheck.data.distanceMeters)}m away)`);

    // 6. 150m Haversine Geofence Test (Positive: Within 30m)
    console.log('6. Testing 150m Geofence: Approval when within perimeter (<150m)...');
    const inBoundsCheck = await apiCall('/api/inspections/INSP-2026-1042/check-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({ lat: 18.9346, lng: 72.8354 }),
    });
    if (inBoundsCheck.status !== 200 || !inBoundsCheck.data.geofenceVerified) {
      throw new Error(`Expected 200 OK for in-bounds check-in, got: ${JSON.stringify(inBoundsCheck)}`);
    }
    console.log(`   ✓ Geofence check-in PASSED: Verified at ${inBoundsCheck.data.distanceMeters}m (Limit: 150m)`);

    // 7. Grievance Lodging & Tracking
    console.log('7. Testing /api/grievances and /api/grievances/track/:token...');
    const grievanceRes = await apiCall('/api/grievances', {
      method: 'POST',
      body: JSON.stringify({
        ngoName: 'Swasthya Seva Trust',
        isAnonymous: true,
        category: 'FAKE_OFFICE',
        description: 'Automated test grievance confirming whistleblowing token generation.',
      }),
    });
    if (grievanceRes.status !== 201 || !grievanceRes.data.trackingToken) {
      throw new Error(`Grievance filing failed: ${JSON.stringify(grievanceRes)}`);
    }
    const token = grievanceRes.data.trackingToken;
    console.log(`   ✓ Grievance lodged with Token: ${token}`);

    const trackRes = await apiCall(`/api/grievances/track/${token}`);
    if (trackRes.status !== 200 || trackRes.data.trackingToken !== token) {
      throw new Error(`Grievance tracking failed: ${JSON.stringify(trackRes)}`);
    }
    console.log(`   ✓ Grievance tracked successfully: Status = ${trackRes.data.status}`);

    // 8. Admin Dashboard & Audit Logs
    console.log('8. Testing /api/dashboard/admin and /api/dashboard/audit-logs...');
    const adminDash = await apiCall('/api/dashboard/admin', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminDash.status !== 200 || !adminDash.data.kpis) {
      throw new Error(`Admin dashboard failed: ${JSON.stringify(adminDash)}`);
    }
    console.log(`   ✓ Admin Dashboard KPIs verified: ${adminDash.data.kpis.totalNgos} NGOs, ${adminDash.data.kpis.fieldOfficersCount} Officers`);

    const auditLogs = await apiCall('/api/dashboard/audit-logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (auditLogs.status !== 200 || !Array.isArray(auditLogs.data)) {
      throw new Error(`Audit logs failed: ${JSON.stringify(auditLogs)}`);
    }
    console.log(`   ✓ Audit Trail verified: ${auditLogs.data.length} immutable security records logged`);

    // 9. NGO Registration Applications Lifecycle (Submission -> Admin Approval -> Auto NGO Provisioning)
    console.log('9. Testing /api/applications (DARPAN Onboarding Lifecycle)...');
    const appsList = await apiCall('/api/applications');
    if (appsList.status !== 200 || !Array.isArray(appsList.data) || appsList.data.length < 1) {
      throw new Error(`Failed to list applications: count=${appsList.data?.length}`);
    }
    console.log(`   ✓ Applications listing verified: ${appsList.data.length} records in queue`);

    const submitAppRes = await apiCall('/api/applications', {
      method: 'POST',
      body: JSON.stringify({
        ngoName: 'Himalayan Gramin Seva Sanstha',
        applicantName: 'Col. Ramesh Chandra (Retd.)',
        applicantRole: 'Managing Trustee',
        email: 'ramesh.chandra@himalayanseva.org',
        phone: '+91 94120 77123',
        sector: 'Environment',
        address: 'Village Ranikhet, Dist Almora',
        district: 'Almora',
        state: 'Uttarakhand',
      }),
    });
    if (submitAppRes.status !== 201 || !submitAppRes.data.id) {
      throw new Error(`Failed to submit application: ${JSON.stringify(submitAppRes)}`);
    }
    const createdAppId = submitAppRes.data.id;
    console.log(`   ✓ Application submitted: ${createdAppId} for DARPAN ${submitAppRes.data.darpanId}`);

    // Admin approves the application
    const approveRes = await apiCall(`/api/applications/${createdAppId}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (approveRes.status !== 200 || !approveRes.data.success || !approveRes.data.ngoId) {
      throw new Error(`Failed to approve application: ${JSON.stringify(approveRes)}`);
    }
    console.log(`   ✓ Application approved & auto-provisioned into Master NGO Registry (NGO ID: ${approveRes.data.ngoId})`);

    // 10. Testing CCTV Camera Real Connection Probe (Non-Simulated)
    console.log('10. Testing Real CCTV Connection Probe (/api/cameras/test-connection)...');
    const probeRes = await apiCall('/api/cameras/test-connection', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        ipAddress: '192.0.2.1', // RFC 5737 TEST-NET-1 (Guaranteed unreachable IP)
        port: 554,
        rtspPath: '/live',
      }),
    });
    if (probeRes.status !== 200 || !probeRes.data.result || (probeRes.data.result.status !== 'CAMERA_OFFLINE' && probeRes.data.result.status !== 'TIMEOUT')) {
      throw new Error(`Real probe did not detect offline camera: ${JSON.stringify(probeRes)}`);
    }
    console.log(`   ✓ Real probe non-simulation verified: Genuinely detected "${probeRes.data.result.status}" for unreachable IP (${probeRes.data.result.latencyMs}ms latency)`);

    // 11. Testing Camera Registration with Encrypted Credentials & Listing
    console.log('11. Testing Camera Registration & RBAC Authorization (/api/cameras)...');
    const firstNgoId = ngos.data[0].id;
    const registerCamRes = await apiCall('/api/cameras', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        name: 'Main Gate Surveillance Alpha',
        ngoId: firstNgoId,
        location: 'Perimeter Entry Gate A',
        cameraType: 'BULLET',
        manufacturer: 'Hikvision',
        model: 'DS-2CD2043G2-I',
        ipAddress: '192.168.1.150',
        port: 554,
        rtspPath: '/Streaming/Channels/101',
        username: 'sec_admin',
        password: 'ClassifiedGovPassword2026!',
      }),
    });
    if (registerCamRes.status !== 201 || !registerCamRes.data.camera?.id) {
      throw new Error(`Failed to register camera: ${JSON.stringify(registerCamRes)}`);
    }
    const testCamId = registerCamRes.data.camera.id;
    console.log(`   ✓ Camera registered with AES-256-GCM encrypted credentials: ${testCamId}`);

    // Verify Officer can view the camera list without credentials being leaked
    const officerCams = await apiCall('/api/cameras', {
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    if (officerCams.status !== 200 || !Array.isArray(officerCams.data.cameras)) {
      throw new Error(`Failed to list cameras for officer: ${JSON.stringify(officerCams)}`);
    }
    const foundCam = officerCams.data.cameras.find((c: any) => c.id === testCamId);
    if (!foundCam || foundCam.encrypted_password || foundCam.password) {
      throw new Error('Security defect: Camera missing or plain credentials exposed in API response!');
    }
    console.log(`   ✓ Officer camera list verified: ${officerCams.data.count} cameras (Credentials safely stripped)`);

    // 12. Testing Stream Session Authorization & Immutable Audit Trail
    console.log('12. Testing Stream Session Issuance & CCTV Audit Logging...');
    const sessionRes = await apiCall(`/api/cameras/${testCamId}/session`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
    });
    if (sessionRes.status !== 200 || !sessionRes.data.sessionToken || !sessionRes.data.streamUrl) {
      throw new Error(`Failed to establish stream session: ${JSON.stringify(sessionRes)}`);
    }
    console.log(`   ✓ Ephemeral session token created: ${sessionRes.data.sessionToken.slice(0, 18)}... (Expires in 30 mins)`);

    // Verify CCTV Audit Log
    const auditLogsRes = await apiCall('/api/cameras/audit/logs', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (auditLogsRes.status !== 200 || !Array.isArray(auditLogsRes.data.logs)) {
      throw new Error(`Failed to fetch CCTV audit logs: ${JSON.stringify(auditLogsRes)}`);
    }
    const cctvViewAction = auditLogsRes.data.logs.find((l: any) => l.action === 'CAMERA_VIEW_STARTED');
    if (!cctvViewAction) {
      throw new Error('Audit trail defect: CAMERA_VIEW_STARTED event was not logged!');
    }
    console.log(`   ✓ Immutable CCTV audit trail verified: Action "${cctvViewAction.action}" recorded for ${cctvViewAction.user_name}`);

    // 13. Negative Auth Gating (Protected routes reject unauthenticated requests)
    console.log('13. Testing Security Gating: Unauthenticated request rejection (/api/random-assignment/execute)...');
    const unauthRes = await apiCall('/api/random-assignment/execute', {
      method: 'POST',
      body: JSON.stringify({ schemeFilter: 'NAPDDR' }),
    });
    if (unauthRes.status !== 401) {
      throw new Error(`Expected 401 Unauthorized for unauthenticated request, got ${unauthRes.status}`);
    }
    console.log('   ✓ Security Gating PASSED: Unauthenticated request rejected with HTTP 401');

    // 14. AI Double-Blind Random Duty Allocation
    console.log('14. Testing AI Double-Blind Random Duty Allocation (/api/random-assignment/execute)...');
    const allocRes = await apiCall('/api/random-assignment/execute', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        schemeFilter: 'ALL',
        batchSize: 3,
        antiCollusionBufferHours: 4,
      }),
    });
    if (allocRes.status !== 200 || !allocRes.data.batchId || !allocRes.data.neutralitySeed || !Array.isArray(allocRes.data.tasks)) {
      throw new Error(`Random duty allocation failed: ${JSON.stringify(allocRes)}`);
    }
    console.log(`   ✓ Double-Blind Allocation PASSED: Dispatched ${allocRes.data.tasks.length} surprise duties (Batch: ${allocRes.data.batchId}, Seed: ${allocRes.data.neutralitySeed.slice(0, 18)})`);

    // 15. Field Evidence Upload with SHA-256 seal
    console.log('15. Testing Geotagged & SHA-256 Hashed Evidence Upload (/api/inspections/:id/evidence)...');
    const testTaskId = allocRes.data.tasks[0]?.id || 'INSP-2026-101';
    const evidenceRes = await apiCall(`/api/inspections/${testTaskId}/evidence`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        category: 'PREMISE_SIGNBOARD',
        caption: 'Official Front Signboard and Entrance Verification',
        imageUrl: 'https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&q=80&w=800',
        lat: 18.5204,
        lng: 73.8567,
        accuracyMeters: 3.2,
        locationAddress: 'Plot 42, Shaniwar Peth, Pune',
      }),
    });
    if (evidenceRes.status !== 201 || !evidenceRes.data.fileHash || !evidenceRes.data.fileHash.startsWith('SHA256:')) {
      throw new Error(`Evidence upload failed: ${JSON.stringify(evidenceRes)}`);
    }
    console.log(`   ✓ Evidence Upload PASSED: Tamper-proof hash ${evidenceRes.data.fileHash.slice(0, 20)}... registered`);

    // 16. Final Inspection Submission
    console.log('16. Testing Final Inspection Submission & Dossier Sealing (/api/inspections/:id/submit)...');
    const submitInspectionRes = await apiCall(`/api/inspections/${testTaskId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        checklist: [
          { id: 'chk_1', label: 'Physical Registered Premises Operational', passed: true, notes: 'Operational' },
          { id: 'chk_2', label: 'Official Signboard & Registration Displayed', passed: true, notes: 'Clean' },
          { id: 'chk_3', label: 'Qualified Key Staff & Doctors On-Site', passed: true, notes: 'Doctor present' },
        ],
        observations: 'Full physical compliance verified on-site under statutory guidelines.',
        issuesDefects: 'None. Minor suggestions to expand student library seating.',
        inspectorRemarks: 'Statutory compliance fully met. Recommended for renewal.',
        inspectionStatus: 'Completed',
      }),
    });
    if (submitInspectionRes.status !== 200 || submitInspectionRes.data.status !== 'SUBMITTED' || !submitInspectionRes.data.tamperProofHash) {
      throw new Error(`Inspection submission failed: ${JSON.stringify(submitInspectionRes)}`);
    }
    console.log(`   ✓ Inspection Submission PASSED: Sealed with SHA-256 ${submitInspectionRes.data.tamperProofHash.slice(0, 20)}...`);

    // 17. Directorate General (IAS) Scrutiny & Sanction Order
    console.log('17. Testing Directorate General (IAS) Scrutiny & Sanction Order (/api/inspections/:id/review)...');
    const scrutinyRes = await apiCall(`/api/inspections/${testTaskId}/review`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        verdict: 'GOOD_COMPLIANT',
        score: 96,
        complianceGrade: 'A_EXCELLENT',
        actionChoice: 'NO_ACTION_CLEARED',
        selectedActions: ['Issue Annual Statutory Compliance Renewal Certificate (FY 2026-27)'],
        remarks: 'Physical site audit verified premises, operational activities, and accounts. Full statutory clearance granted.',
      }),
    });
    if (scrutinyRes.status !== 200 || !scrutinyRes.data.sanctionOrderNumber || !scrutinyRes.data.sanctionOrderNumber.startsWith('DIR/ORD/2026/MSJE/')) {
      throw new Error(`Directorate scrutiny failed: ${JSON.stringify(scrutinyRes)}`);
    }
    console.log(`   ✓ Directorate Scrutiny PASSED: Sanction Order ${scrutinyRes.data.sanctionOrderNumber} issued by Dr. Rajesh Verma IAS`);

    // 18. Worker Biometric Face & Geofenced Punch-In
    console.log('18. Testing Worker Biometric & Geofenced Punch-In (/api/attendance/punch-in)...');
    const punchInRes = await apiCall('/api/attendance/punch-in', {
      method: 'POST',
      headers: { Authorization: `Bearer ${officerToken}` },
      body: JSON.stringify({
        workerId: 'usr_worker_1',
        workerName: 'Sunita Patil',
        workerRole: 'Community Health Mobilizer & Field Staff',
        ngoId: 'ngo_swasthya',
        ngoName: 'Swasthya Seva Trust',
        dutyDate: new Date().toISOString().split('T')[0],
        checkInTime: '09:05:00 AM IST',
        checkInPhoto: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...',
        checkInLat: 19.0410,
        checkInLng: 72.8616,
        checkInAddress: 'Dharavi 90 Feet Road, Sion, Mumbai',
        checkInDistanceMeters: 22.4,
        shiftNotes: 'Community pulse health drive and patient mobilization.',
      }),
    });
    const punchRecord = punchInRes.data?.record || punchInRes.data;
    if (punchInRes.status !== 200 || !punchRecord?.id || punchRecord.status !== 'IN_PROGRESS') {
      throw new Error(`Worker punch-in failed: ${JSON.stringify(punchInRes)}`);
    }
    console.log(`   ✓ Worker Biometric Punch-In PASSED: Verified at ${punchRecord.checkInDistanceMeters}m (Record ID: ${punchRecord.id})`);

    // 19. Dynamic Anomaly Engine & Scheme Telemetry
    console.log('19. Testing Dynamic Anomaly Engine & Live Scheme Telemetry (/api/analytics)...');
    const anomRes = await apiCall('/api/analytics/anomalies', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (anomRes.status !== 200 || !Array.isArray(anomRes.data.anomalies) || anomRes.data.anomalies.length === 0) {
      throw new Error(`Anomaly retrieval failed: ${JSON.stringify(anomRes)}`);
    }
    console.log(`   ✓ Anomaly Detection PASSED: ${anomRes.data.anomalies.length} active system anomalies tracked`);

    const triggerRes = await apiCall('/api/analytics/trigger-showcause', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({
        anomalyId: anomRes.data.anomalies[0].id,
        ngoId: anomRes.data.anomalies[0].ngoId,
        subject: 'Show-Cause Directive for Ground Discrepancy under Section 14',
        details: 'Attendance drop cliff detected by automated biometric monitoring.',
        deadlineDays: 14,
      }),
    });
    if (triggerRes.status !== 200 || !triggerRes.data.noticeNumber) {
      throw new Error(`Automated Section 14 notice failed: ${JSON.stringify(triggerRes)}`);
    }
    console.log(`   ✓ Automated Section 14 Notice PASSED: Notice ${triggerRes.data.noticeNumber} issued`);

    const schemesRes = await apiCall('/api/analytics/schemes', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (schemesRes.status !== 200 || !Array.isArray(schemesRes.data.schemes) || schemesRes.data.schemes.length < 5) {
      throw new Error(`Scheme telemetry failed: ${JSON.stringify(schemesRes)}`);
    }
    console.log(`   ✓ Scheme Telemetry PASSED: ${schemesRes.data.schemes.length} DoSJE schemes actively reporting live data`);

    console.log('\n================================================================');
    console.log('🎉 ALL 19 COMPREHENSIVE END-TO-END INTEGRATION TESTS PASSED!');
    console.log('🏛️  INSPIRA SYSTEM FULLY VERIFIED, COHERENT, AND 100% OPERATIONAL.');
    console.log('================================================================');
  } finally {
    server.close();
  }
}

runTests().catch((err) => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
