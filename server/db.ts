import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

// Database file path in project data folder
const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'ngo_portal.db');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency and foreign keys for referential integrity
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

/**
 * Initialize all normalized tables, constraints, and indexes
 */
export function initSchema(): void {
  db.exec(`
    -- 1. Roles & Clearance Levels
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT NOT NULL,
      clearance_level TEXT NOT NULL
    );

    -- 2. Users (Government Officers, Inspectors, NGO Reps, Citizens)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      designation TEXT,
      phone TEXT,
      badge_number TEXT,
      department TEXT,
      assigned_district TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      ngo_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
    );

    -- 3. NGOs Master Registry
    CREATE TABLE IF NOT EXISTS ngos (
      id TEXT PRIMARY KEY,
      darpan_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      sector TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'REGISTERED',
      founding_year INTEGER NOT NULL,
      president_name TEXT NOT NULL,
      contact_email TEXT NOT NULL,
      contact_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      fcra_status TEXT NOT NULL DEFAULT 'APPROVED',
      annual_budget_inr REAL NOT NULL DEFAULT 0,
      compliance_score REAL DEFAULT 85,
      risk_level TEXT NOT NULL DEFAULT 'LOW',
      risk_reasons TEXT, -- JSON string array
      last_inspection_date TEXT,
      scheme TEXT,
      ngo_type TEXT,
      website TEXT,
      google_maps_url TEXT,
      verification_status TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 4. NGO Documents (Trust Deed, 12A/80G, Annual Audit, PAN)
    CREATE TABLE IF NOT EXISTS ngo_documents (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT,
      file_url TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
    );

    -- 5. Field Inspections & Audits
    CREATE TABLE IF NOT EXISTS inspections (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      inspection_type TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'MEDIUM',
      scheduled_date TEXT NOT NULL,
      scheduled_time TEXT NOT NULL DEFAULT '10:00 AM',
      status TEXT NOT NULL DEFAULT 'SCHEDULED',
      assigned_inspector_id TEXT,
      assigned_date TEXT,
      instructions TEXT,
      check_in_time TEXT,
      check_in_lat REAL,
      check_in_lng REAL,
      check_in_distance_meters REAL,
      geofence_verified INTEGER DEFAULT 0, -- 0 = false, 1 = true
      observations TEXT,
      issues_defects TEXT,
      inspector_remarks TEXT,
      tamper_proof_hash TEXT,
      submitted_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_inspector_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 6. Inspection Checklist Items (10-Point Statutory Checklist)
    CREATE TABLE IF NOT EXISTS inspection_checklist_items (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      section TEXT NOT NULL,
      label TEXT NOT NULL,
      passed INTEGER NOT NULL DEFAULT 1, -- 1 = true, 0 = false
      notes TEXT,
      severity TEXT NOT NULL DEFAULT 'LOW',
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE
    );

    -- 7. Evidence Categories (5 Mandatory Shelves)
    CREATE TABLE IF NOT EXISTS evidence_categories (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      description TEXT NOT NULL
    );

    -- 8. Inspection Evidence (Geotagged, Timestamped & SHA-256 Hashed Photos)
    CREATE TABLE IF NOT EXISTS inspection_evidence (
      id TEXT PRIMARY KEY,
      inspection_id TEXT NOT NULL,
      category_code TEXT NOT NULL,
      caption TEXT,
      image_url TEXT NOT NULL,
      file_hash TEXT NOT NULL, -- SHA-256
      lat REAL NOT NULL,
      lng REAL NOT NULL,
      accuracy_meters REAL DEFAULT 3.5,
      timestamp TEXT NOT NULL,
      inspector_badge TEXT,
      location_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
      FOREIGN KEY (category_code) REFERENCES evidence_categories(code)
    );

    -- 9. Directorate General (IAS) Scrutiny & Sanction Orders
    CREATE TABLE IF NOT EXISTS compliance_assessments (
      id TEXT PRIMARY KEY,
      inspection_id TEXT UNIQUE NOT NULL,
      ngo_id TEXT NOT NULL,
      reviewed_by_user_id TEXT NOT NULL,
      reviewed_by_name TEXT NOT NULL,
      reviewed_by_badge TEXT NOT NULL,
      verdict TEXT NOT NULL, -- 'GOOD_COMPLIANT' | 'BAD_DEFICIENT'
      score REAL NOT NULL, -- 0 to 100
      compliance_grade TEXT NOT NULL, -- 'A_EXCELLENT', 'B_SATISFACTORY', 'C_NON_COMPLIANT', 'D_CRITICAL_FRAUD'
      action_choice TEXT NOT NULL, -- 'ACTION_REQUIRED' | 'NO_ACTION_CLEARED'
      selected_actions TEXT NOT NULL, -- JSON string array
      scrutiny_remarks TEXT NOT NULL,
      sanction_order_number TEXT UNIQUE NOT NULL,
      is_locked INTEGER DEFAULT 1,
      reviewed_at TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE CASCADE,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
      FOREIGN KEY (reviewed_by_user_id) REFERENCES users(id)
    );

    -- 10. Citizen Whistleblower Complaints & Grievances
    CREATE TABLE IF NOT EXISTS grievances (
      id TEXT PRIMARY KEY,
      tracking_token TEXT UNIQUE NOT NULL,
      ngo_id TEXT,
      ngo_name TEXT NOT NULL,
      citizen_name TEXT,
      citizen_contact TEXT,
      is_anonymous INTEGER NOT NULL DEFAULT 0,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      evidence_urls TEXT, -- JSON string array
      status TEXT NOT NULL DEFAULT 'RECEIVED',
      investigating_officer_id TEXT,
      admin_remarks TEXT,
      submitted_at TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE SET NULL,
      FOREIGN KEY (investigating_officer_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 11. Statutory Notices (DARPAN Section 14, Show-Cause, Defect Rectification)
    CREATE TABLE IF NOT EXISTS notices (
      id TEXT PRIMARY KEY,
      notice_number TEXT UNIQUE NOT NULL,
      ngo_id TEXT NOT NULL,
      inspection_id TEXT,
      subject TEXT NOT NULL,
      notice_type TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT NOT NULL,
      deadline TEXT NOT NULL,
      issued_by_user_id TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'ISSUED', -- 'ISSUED' | 'RESPONSE_RECEIVED' | 'REVIEWED' | 'CLOSED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
      FOREIGN KEY (inspection_id) REFERENCES inspections(id) ON DELETE SET NULL,
      FOREIGN KEY (issued_by_user_id) REFERENCES users(id)
    );

    -- 12. NGO Notice Responses
    CREATE TABLE IF NOT EXISTS notice_responses (
      id TEXT PRIMARY KEY,
      notice_id TEXT NOT NULL,
      ngo_id TEXT NOT NULL,
      response_text TEXT NOT NULL,
      attachment_urls TEXT, -- JSON string array
      submitted_by_user_id TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (notice_id) REFERENCES notices(id) ON DELETE CASCADE,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE,
      FOREIGN KEY (submitted_by_user_id) REFERENCES users(id)
    );

    -- 13. Immutable Security & Administrative Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      details TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 14. NGO Registration Applications (DARPAN Onboarding Workflow)
    CREATE TABLE IF NOT EXISTS ngo_applications (
      id TEXT PRIMARY KEY,
      ngo_name TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      applicant_role TEXT NOT NULL DEFAULT 'Managing Trustee',
      email TEXT NOT NULL,
      phone TEXT,
      registration_number TEXT NOT NULL,
      darpan_id TEXT UNIQUE NOT NULL,
      sector TEXT NOT NULL,
      address TEXT NOT NULL,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      lat REAL DEFAULT 28.6139,
      lng REAL DEFAULT 77.2090,
      applied_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      rejection_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 15. System Configuration
    CREATE TABLE IF NOT EXISTS system_config (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 16. NGO Field Staff & Worker Attendance (Dual Camera Check-In / Check-Out)
    CREATE TABLE IF NOT EXISTS worker_attendance (
      id TEXT PRIMARY KEY,
      worker_id TEXT NOT NULL,
      worker_name TEXT NOT NULL,
      worker_role TEXT NOT NULL DEFAULT 'FIELD_WORKER',
      ngo_id TEXT NOT NULL,
      ngo_name TEXT NOT NULL,
      duty_date TEXT NOT NULL, -- YYYY-MM-DD
      -- Arrival Punch-In
      check_in_time TEXT,
      check_in_photo TEXT,
      check_in_lat REAL,
      check_in_lng REAL,
      check_in_address TEXT,
      check_in_distance_meters REAL,
      check_in_hash TEXT,
      -- Departure Punch-Out
      check_out_time TEXT,
      check_out_photo TEXT,
      check_out_lat REAL,
      check_out_lng REAL,
      check_out_address TEXT,
      check_out_distance_meters REAL,
      check_out_hash TEXT,
      -- Metrics
      hours_worked REAL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS', -- 'PRESENT', 'HALF_DAY', 'IN_PROGRESS', 'OVERTIME'
      shift_notes TEXT,
      departure_notes TEXT,
      supervisor_verification TEXT DEFAULT 'VERIFIED',
      supervisor_remarks TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
    );

    -- 17. Authorized CCTV / IP Surveillance Cameras Registry
    CREATE TABLE IF NOT EXISTS cameras (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ngo_id TEXT NOT NULL,
      location TEXT NOT NULL,
      camera_type TEXT NOT NULL DEFAULT 'FIXED', -- 'FIXED' | 'PTZ' | 'DOME' | 'BULLET' | 'THERMAL'
      manufacturer TEXT DEFAULT 'Generic ONVIF',
      model TEXT DEFAULT 'IP-CAM-1080P',
      ip_address TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 554,
      rtsp_path TEXT NOT NULL DEFAULT '/live',
      onvif_url TEXT,
      username TEXT,
      encrypted_password TEXT,
      iv TEXT,
      auth_tag TEXT,
      status TEXT NOT NULL DEFAULT 'OFFLINE', -- 'LIVE' | 'OFFLINE' | 'CONNECTING' | 'ERROR' | 'DISABLED'
      last_seen TEXT,
      last_heartbeat TEXT,
      last_error TEXT,
      consecutive_failures INTEGER NOT NULL DEFAULT 0,
      resolution TEXT DEFAULT '1920x1080',
      codec TEXT DEFAULT 'H.264',
      fps INTEGER DEFAULT 25,
      is_enabled INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
    );

    -- 18. CCTV Role & Officer Access Permissions
    CREATE TABLE IF NOT EXISTS camera_access_permissions (
      id TEXT PRIMARY KEY,
      camera_id TEXT NOT NULL,
      user_id TEXT, -- NULL for role-wide grants
      role TEXT, -- 'ADMIN' | 'OFFICER'
      can_view INTEGER NOT NULL DEFAULT 1,
      can_capture_evidence INTEGER NOT NULL DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 19. Ephemeral Authorized CCTV Stream Sessions
    CREATE TABLE IF NOT EXISTS camera_stream_sessions (
      token TEXT PRIMARY KEY,
      camera_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      ip_address TEXT,
      status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE' | 'EXPIRED' | 'REVOKED'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL,
      last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 20. Immutable CCTV Security & Surveillance Audit Trail
    CREATE TABLE IF NOT EXISTS cctv_audit_logs (
      id TEXT PRIMARY KEY,
      camera_id TEXT,
      camera_name TEXT,
      ngo_id TEXT,
      user_id TEXT,
      user_name TEXT NOT NULL,
      user_role TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      ip_address TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE SET NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 21. Random Video Conferencing (VC) Surprise Sessions
    CREATE TABLE IF NOT EXISTS vc_sessions (
      id TEXT PRIMARY KEY,
      session_token TEXT UNIQUE NOT NULL,
      ngo_id TEXT NOT NULL,
      ngo_name TEXT NOT NULL,
      ngo_darpan_id TEXT,
      district TEXT NOT NULL,
      state TEXT NOT NULL,
      scheme TEXT NOT NULL,
      initiated_by_officer_id TEXT NOT NULL,
      initiated_by_officer_name TEXT NOT NULL,
      participant_type TEXT NOT NULL, -- 'INCHARGE' | 'STAFF' | 'BENEFICIARY'
      participant_name TEXT NOT NULL,
      participant_phone TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT,
      status TEXT NOT NULL DEFAULT 'CONNECTED', -- 'CONNECTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'REJECTED'
      verification_checklist TEXT, -- JSON
      lat REAL,
      lng REAL,
      accuracy_meters REAL,
      evidence_snapshot_url TEXT,
      tamper_proof_hash TEXT,
      findings_summary TEXT,
      compliance_verdict TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
    );

    -- 22. AI Automated Double-Blind Random Duty Assignment Batches
    CREATE TABLE IF NOT EXISTS random_assignment_batches (
      id TEXT PRIMARY KEY,
      batch_id TEXT UNIQUE NOT NULL,
      neutrality_seed TEXT NOT NULL,
      generated_by TEXT NOT NULL,
      scheme_filter TEXT NOT NULL,
      state_filter TEXT NOT NULL,
      total_assigned INTEGER NOT NULL,
      anti_collusion_buffer_hours INTEGER NOT NULL DEFAULT 4,
      tasks_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- 23. AI-Based Real-Time System & Attendance Anomalies
    CREATE TABLE IF NOT EXISTS system_anomalies (
      id TEXT PRIMARY KEY,
      ngo_id TEXT NOT NULL,
      ngo_name TEXT NOT NULL,
      darpan_id TEXT NOT NULL,
      district TEXT NOT NULL,
      scheme TEXT NOT NULL,
      type TEXT NOT NULL, -- 'ATTENDANCE_DROP' | 'GHOST_BENEFICIARY' | 'GEO_DRIFT' | 'SPOOF_ATTEMPT' | 'EXPENDITURE_OUTLIER'
      severity TEXT NOT NULL, -- 'CRITICAL' | 'HIGH' | 'WARNING'
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      metric_value TEXT NOT NULL,
      baseline_value TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN' | 'INVESTIGATING' | 'SHOW_CAUSE_ISSUED' | 'RESOLVED'
      detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (ngo_id) REFERENCES ngos(id) ON DELETE CASCADE
    );

    -- Create Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
    CREATE INDEX IF NOT EXISTS idx_ngos_sector ON ngos(sector);
    CREATE INDEX IF NOT EXISTS idx_ngos_status ON ngos(status);
    CREATE INDEX IF NOT EXISTS idx_ngos_district ON ngos(district);
    CREATE INDEX IF NOT EXISTS idx_inspections_ngo ON inspections(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_inspections_status ON inspections(status);
    CREATE INDEX IF NOT EXISTS idx_inspections_inspector ON inspections(assigned_inspector_id);
    CREATE INDEX IF NOT EXISTS idx_evidence_inspection ON inspection_evidence(inspection_id);
    CREATE INDEX IF NOT EXISTS idx_grievances_token ON grievances(tracking_token);
    CREATE INDEX IF NOT EXISTS idx_notices_ngo ON notices(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON ngo_applications(status);
    CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_vc_ngo ON vc_sessions(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_vc_status ON vc_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_anomalies_ngo ON system_anomalies(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_anomalies_severity ON system_anomalies(severity);
    CREATE INDEX IF NOT EXISTS idx_attendance_worker ON worker_attendance(worker_id);
    CREATE INDEX IF NOT EXISTS idx_attendance_date ON worker_attendance(duty_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_ngo ON worker_attendance(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_cameras_ngo ON cameras(ngo_id);
    CREATE INDEX IF NOT EXISTS idx_cameras_status ON cameras(status);
    CREATE INDEX IF NOT EXISTS idx_cameras_enabled ON cameras(is_enabled);
    CREATE INDEX IF NOT EXISTS idx_cctv_sessions_camera ON camera_stream_sessions(camera_id);
    CREATE INDEX IF NOT EXISTS idx_cctv_sessions_expires ON camera_stream_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_cctv_audit_camera ON cctv_audit_logs(camera_id);
    CREATE INDEX IF NOT EXISTS idx_cctv_audit_timestamp ON cctv_audit_logs(timestamp);
  `);

  // Safe non-destructive column migrations for existing SQLite databases
  const schemaMigrations = [
    'ALTER TABLE ngos ADD COLUMN scheme TEXT',
    'ALTER TABLE ngos ADD COLUMN ngo_type TEXT',
    'ALTER TABLE ngos ADD COLUMN website TEXT',
    'ALTER TABLE ngos ADD COLUMN google_maps_url TEXT',
    'ALTER TABLE ngos ADD COLUMN verification_status TEXT',
    'ALTER TABLE inspection_evidence ADD COLUMN camera_id TEXT',
    'ALTER TABLE inspection_evidence ADD COLUMN evidence_source TEXT DEFAULT "MOBILE_CAMERA"',
    'ALTER TABLE cameras ADD COLUMN camera_source TEXT DEFAULT "RTSP_STREAM"',
    'ALTER TABLE cameras ADD COLUMN ptz_capabilities INTEGER DEFAULT 1',
    'ALTER TABLE cameras ADD COLUMN stream_url TEXT',
  ];
  for (const sql of schemaMigrations) {
    try {
      db.exec(sql);
    } catch {
      // Column already exists, safe to ignore
    }
  }

  // Auto-seed default cameras if cameras table is empty
  try {
    const camCount = db.prepare('SELECT COUNT(*) as count FROM cameras').get() as { count: number };
    if (!camCount || camCount.count === 0) {
      const ngo = db.prepare('SELECT id FROM ngos LIMIT 1').get() as { id: string } | undefined;
      const ngoId = ngo?.id || 'ngo_ssp_latur';

      db.prepare(`
        INSERT INTO cameras (
          id, name, ngo_id, location, camera_type, camera_source, ptz_capabilities,
          manufacturer, model, ip_address, port, rtsp_path, stream_url, status, is_enabled,
          resolution, codec, fps
        ) VALUES
        (
          'cam_hw_node', 'Integrated HD Vigilance Node', ?, 'Main Entry / Biometric Turnstile',
          'DEVICE_CAM', 'HARDWARE_DEVICE', 1, 'Integrated HD Node', 'USB/Hardware Sensor',
          '127.0.0.1', 0, '/device/live', NULL, 'LIVE', 1, '1920x1080', 'MEDIASTREAM', 30
        ),
        (
          'cam_hls_live', 'Perimeter High-Def Surveillance Feed', ?, 'Outer Perimeter & Facility Yard',
          'BULLET', 'HLS_STREAM', 1, 'Axis Communications', 'AXIS Q1798-LE',
          'stream.cctv-gov.in', 443, '/live/stream.m3u8', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          'LIVE', 1, '1920x1080', 'H.264', 30
        ),
        (
          'cam_phone_mjpeg', 'Android Mobile IP Webcam (Port 8080)', ?, 'Muster Roll & Ration Desk',
          'FIXED', 'HTTP_MJPEG', 1, 'Android IP Webcam', 'Wi-Fi Sensor Node',
          '192.168.1.100', 8080, '/video', NULL,
          'OFFLINE', 1, '1920x1080', 'MJPEG', 30
        )
      `).run(ngoId, ngoId, ngoId);
    }
  } catch (err) {
    console.warn('Notice: Camera bootstrap check:', err);
  }
}

// Auto-initialize schema immediately on database module load
initSchema();

// Database query helpers
export function query<T = any>(sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

export function queryOne<T = any>(sql: string, params: any[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

export function execute(sql: string, params: any[] = []): { changes: number | bigint; lastInsertRowid: number | bigint } {
  const stmt = db.prepare(sql);
  return stmt.run(...params);
}

export function transaction<T>(fn: () => T): T {
  db.exec('BEGIN IMMEDIATE TRANSACTION;');
  try {
    const result = fn();
    db.exec('COMMIT;');
    return result;
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}
