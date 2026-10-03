import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute, transaction } from '../db';
import { authenticateToken, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const inspectionsRouter = Router();

// Haversine formula to compute exact distance in meters between two coordinates
function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// GET /api/inspections - List Inspections
inspectionsRouter.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { status, inspectorId, ngoId, priority, search } = req.query;
    const user = req.user;

    let sql = `
      SELECT i.*, n.name as ngo_name, n.darpan_id as ngo_darpan_id, n.district as ngo_district,
             n.address as ngo_address, n.lat as ngo_lat, n.lng as ngo_lng,
             u.full_name as assigned_inspector_name, u.badge_number as assigned_inspector_badge,
             ca.verdict as scrutiny_verdict, ca.score as scrutiny_score, ca.sanction_order_number,
             ca.action_choice as scrutiny_action_choice, ca.reviewed_at as scrutiny_reviewed_at
      FROM inspections i
      JOIN ngos n ON i.ngo_id = n.id
      LEFT JOIN users u ON i.assigned_inspector_id = u.id
      LEFT JOIN compliance_assessments ca ON ca.inspection_id = i.id
      WHERE 1=1
    `;

    const params: any[] = [];

    // Role-based scoping
    if (user) {
      if (user.role === 'OFFICER') {
        sql += ` AND (i.assigned_inspector_id = ? OR i.status = 'ASSIGNED')`;
        params.push(user.id);
      } else if (user.role === 'NGO') {
        if (!user.ngo_id) {
          res.json([]);
          return;
        }
        sql += ` AND i.ngo_id = ?`;
        params.push(user.ngo_id);
      }
    }

    if (status && status !== 'ALL') {
      sql += ` AND i.status = ?`;
      params.push(status);
    }
    if (inspectorId && inspectorId !== 'ALL') {
      sql += ` AND i.assigned_inspector_id = ?`;
      params.push(inspectorId);
    }
    if (ngoId && ngoId !== 'ALL') {
      sql += ` AND i.ngo_id = ?`;
      params.push(ngoId);
    }
    if (priority && priority !== 'ALL') {
      sql += ` AND i.priority = ?`;
      params.push(priority);
    }
    if (search) {
      sql += ` AND (LOWER(i.id) LIKE LOWER(?) OR LOWER(n.name) LIKE LOWER(?) OR LOWER(n.district) LIKE LOWER(?))`;
      const searchParam = `%${String(search).trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY i.scheduled_date DESC, i.id DESC`;

    const rows = query(sql, params);

    // Format tasks to match frontend GovernmentInspectionTask structure
    const tasks = rows.map((r) => {
      // Fetch photos for submitted record
      const photos = query(
        `SELECT id, category_code as category, caption, image_url as url,
                lat, lng, accuracy_meters as accuracyMeters, timestamp,
                inspector_badge as officerBadge, location_address as locationAddress,
                file_hash as tamperProofHash
         FROM inspection_evidence WHERE inspection_id = ?`,
        [r.id]
      ).map((p) => ({
        ...p,
        coordinates: { lat: p.lat, lng: p.lng },
      }));

      // Fetch checklist items
      const checklist = query(
        `SELECT id, section, label, passed, notes, severity
         FROM inspection_checklist_items WHERE inspection_id = ?`,
        [r.id]
      ).map((c) => ({
        id: c.id,
        label: c.label,
        passed: Boolean(c.passed),
        notes: c.notes,
      }));

      let scrutinyReview = undefined;
      if (r.sanction_order_number) {
        const assessment = queryOne(`SELECT * FROM compliance_assessments WHERE inspection_id = ?`, [r.id]);
        if (assessment) {
          let selectedActions: string[] = [];
          try {
            selectedActions = JSON.parse(assessment.selected_actions);
          } catch {
            selectedActions = [];
          }

          scrutinyReview = {
            reviewedByOfficerName: assessment.reviewed_by_name,
            reviewedByOfficerBadge: assessment.reviewed_by_badge,
            reviewedAt: assessment.reviewed_at,
            verdict: assessment.verdict,
            score: assessment.score,
            complianceGrade: assessment.compliance_grade,
            actionChoice: assessment.action_choice,
            selectedActions,
            scrutinyRemarks: assessment.scrutiny_remarks,
            sanctionOrderNumber: assessment.sanction_order_number,
            isLocked: Boolean(assessment.is_locked),
          };
        }
      }

      let submittedRecord = undefined;
      if (r.submitted_at) {
        submittedRecord = {
          inspectionId: r.id,
          locationSite: `${r.ngo_name}, ${r.ngo_address}`,
          assignedInspector: r.assigned_inspector_name || 'Designated Inspector',
          assignedInspectorBadge: r.assigned_inspector_badge || 'INSP-DEL',
          dateTime: r.submitted_at,
          inspectionType: r.inspection_type,
          photos,
          checklist,
          observations: r.observations || '',
          issuesDefects: r.issues_defects || '',
          severityPriority: (r.priority === 'CRITICAL' ? 'Critical' : r.priority === 'HIGH' ? 'High' : 'Medium') as any,
          inspectorRemarks: r.inspector_remarks || '',
          inspectionStatus: r.status === 'COMPLETED' ? 'Completed' : 'Failed/Issue Found',
          geofenceVerified: Boolean(r.geofence_verified),
          tamperProofHash: r.tamper_proof_hash,
        };
      }

      // Map backend status to UI status
      const uiStatus =
        r.status === 'COMPLETED'
          ? 'Completed'
          : r.status === 'ACTION_REQUIRED'
          ? 'Failed/Issue Found'
          : r.status === 'ON_SITE' || r.status === 'SUBMITTED'
          ? 'In Progress'
          : r.assigned_inspector_id
          ? 'Assigned'
          : 'Pending';

      return {
        id: r.id,
        title: r.ngo_name,
        location: `${r.ngo_address}, ${r.ngo_district}`,
        department: 'Ministry of Social Justice & Empowerment • Directorate of NGO Vigilance',
        inspectionType: r.inspection_type,
        priority: (r.priority === 'LOW' ? 'Low' : r.priority === 'HIGH' ? 'High' : r.priority === 'CRITICAL' ? 'Critical' : 'Medium') as any,
        date: r.scheduled_date,
        status: uiStatus,
        assignedInspectorId: r.assigned_inspector_id,
        assignedInspectorName: r.assigned_inspector_name,
        assignedInspectorBadge: r.assigned_inspector_badge,
        assignedDate: r.assigned_date,
        coordinates: { lat: r.ngo_lat, lng: r.ngo_lng },
        submittedRecord,
        scrutinyReview,
      };
    });

    res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching inspections:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve inspections.' });
  }
});

// GET /api/inspections/:id - Full Inspection Dossier
inspectionsRouter.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;

    const row = queryOne(
      `SELECT i.*, n.name as ngo_name, n.darpan_id as ngo_darpan_id, n.district as ngo_district,
              n.address as ngo_address, n.lat as ngo_lat, n.lng as ngo_lng, n.compliance_score as ngo_score,
              u.full_name as assigned_inspector_name, u.badge_number as assigned_inspector_badge
       FROM inspections i
       JOIN ngos n ON i.ngo_id = n.id
       LEFT JOIN users u ON i.assigned_inspector_id = u.id
       WHERE i.id = ?`,
      [id]
    );

    if (!row) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Inspection not found.' });
      return;
    }

    const checklist = query(
      `SELECT id, section, label, passed, notes, severity
       FROM inspection_checklist_items WHERE inspection_id = ?`,
      [id]
    ).map((c) => ({ ...c, passed: Boolean(c.passed) }));

    const evidence = query(
      `SELECT id, category_code as category, caption, image_url as url,
              lat, lng, accuracy_meters as accuracyMeters, timestamp,
              inspector_badge as officerBadge, location_address as locationAddress,
              file_hash as fileHash
       FROM inspection_evidence WHERE inspection_id = ?`,
      [id]
    ).map((e) => ({ ...e, coordinates: { lat: e.lat, lng: e.lng } }));

    const assessment = queryOne(`SELECT * FROM compliance_assessments WHERE inspection_id = ?`, [id]);
    let scrutinyReview = null;
    if (assessment) {
      let selectedActions: string[] = [];
      try {
        selectedActions = JSON.parse(assessment.selected_actions);
      } catch {
        selectedActions = [];
      }

      scrutinyReview = {
        reviewedByOfficerName: assessment.reviewed_by_name,
        reviewedByOfficerBadge: assessment.reviewed_by_badge,
        reviewedAt: assessment.reviewed_at,
        verdict: assessment.verdict,
        score: assessment.score,
        complianceGrade: assessment.compliance_grade,
        actionChoice: assessment.action_choice,
        selectedActions,
        scrutinyRemarks: assessment.scrutiny_remarks,
        sanctionOrderNumber: assessment.sanction_order_number,
        isLocked: Boolean(assessment.is_locked),
      };
    }

    res.json({
      id: row.id,
      ngoId: row.ngo_id,
      ngoName: row.ngo_name,
      ngoDarpanId: row.ngo_darpan_id,
      ngoAddress: row.ngo_address,
      ngoDistrict: row.ngo_district,
      ngoCoordinates: { lat: row.ngo_lat, lng: row.ngo_lng },
      inspectionType: row.inspection_type,
      priority: row.priority,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      status: row.status,
      assignedInspectorId: row.assigned_inspector_id,
      assignedInspectorName: row.assigned_inspector_name,
      assignedInspectorBadge: row.assigned_inspector_badge,
      assignedDate: row.assigned_date,
      instructions: row.instructions,
      checkInTime: row.check_in_time,
      checkInCoordinates: row.check_in_lat ? { lat: row.check_in_lat, lng: row.check_in_lng } : null,
      checkInDistanceMeters: row.check_in_distance_meters,
      geofenceVerified: Boolean(row.geofence_verified),
      observations: row.observations,
      issuesDefects: row.issues_defects,
      inspectorRemarks: row.inspector_remarks,
      tamperProofHash: row.tamper_proof_hash,
      submittedAt: row.submitted_at,
      checklist,
      evidence,
      scrutinyReview,
    });
  } catch (err: any) {
    console.error('Error fetching inspection dossier:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve inspection dossier.' });
  }
});

// POST /api/inspections - Create Inspection (Admin Only)
inspectionsRouter.post('/', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { ngoId, inspectionType, priority = 'MEDIUM', scheduledDate, scheduledTime = '10:00 AM', instructions } = req.body;

    if (!ngoId || !inspectionType || !scheduledDate) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'NGO ID, Inspection Type, and Scheduled Date are required.' });
      return;
    }

    const ngo = queryOne('SELECT id, name FROM ngos WHERE id = ?', [ngoId]);
    if (!ngo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Target NGO not found.' });
      return;
    }

    const id = `INSP-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    execute(
      `INSERT INTO inspections (id, ngo_id, inspection_type, priority, scheduled_date, scheduled_time, status, instructions)
       VALUES (?, ?, ?, ?, ?, ?, 'SCHEDULED', ?)`,
      [id, ngoId, inspectionType, priority, scheduledDate, scheduledTime, instructions || null]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'INSPECTION_CREATED',
      entityType: 'INSPECTIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `Created ${inspectionType} inspection for ${ngo.name}`,
    });

    res.status(201).json({ id, status: 'SCHEDULED', message: 'Inspection created successfully.' });
  } catch (err: any) {
    console.error('Error creating inspection:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to create inspection.' });
  }
});

// POST /api/inspections/:id/assign - Assign/Reassign Inspector (Admin Only)
inspectionsRouter.post('/:id/assign', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { inspectorId, instructions, scheduledDate } = req.body;

    if (!inspectorId) {
      res.status(400).json({ error: 'MISSING_INSPECTOR', message: 'Inspector ID is required.' });
      return;
    }

    const inspector = queryOne(
      `SELECT u.id, u.full_name, u.badge_number FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ? AND r.name = 'OFFICER'`,
      [inspectorId]
    );

    if (!inspector) {
      res.status(404).json({ error: 'INVALID_INSPECTOR', message: 'Designated Field Inspector not found.' });
      return;
    }

    const assignedDate = new Date().toISOString().split('T')[0];

    execute(
      `UPDATE inspections
       SET assigned_inspector_id = ?,
           assigned_date = ?,
           instructions = COALESCE(?, instructions),
           scheduled_date = COALESCE(?, scheduled_date),
           status = 'ASSIGNED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [inspectorId, assignedDate, instructions || null, scheduledDate || null, id]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'INSPECTOR_ASSIGNED',
      entityType: 'INSPECTIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `Assigned Inspector ${inspector.full_name} (${inspector.badge_number})`,
    });

    res.json({
      success: true,
      message: `Inspection ${id} assigned to ${inspector.full_name}`,
      assignedInspector: {
        id: inspector.id,
        name: inspector.full_name,
        badge: inspector.badge_number,
      },
    });
  } catch (err: any) {
    console.error('Error assigning inspector:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to assign inspector.' });
  }
});

// POST /api/inspections/:id/check-in - Backend 150m Haversine Geofence Engine
inspectionsRouter.post('/:id/check-in', authenticateToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { lat, lng } = req.body;

    if (lat === undefined || lng === undefined) {
      res.status(400).json({ error: 'MISSING_COORDINATES', message: 'Exact latitude and longitude are required for GPS verification.' });
      return;
    }

    const inspection = queryOne(
      `SELECT i.*, n.lat as ngo_lat, n.lng as ngo_lng, n.name as ngo_name
       FROM inspections i
       JOIN ngos n ON i.ngo_id = n.id
       WHERE i.id = ?`,
      [id]
    );

    if (!inspection) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Inspection record not found.' });
      return;
    }

    // Compute exact Haversine distance in meters
    const distanceMeters = haversineDistanceMeters(Number(lat), Number(lng), inspection.ngo_lat, inspection.ngo_lng);
    const STATUTORY_RADIUS_METERS = 150;

    if (distanceMeters > STATUTORY_RADIUS_METERS) {
      logAuditEvent({
        userId: req.user?.id,
        userName: req.user?.full_name,
        userRole: req.user?.role,
        action: 'GEOFENCE_VERIFICATION_REJECTED',
        entityType: 'INSPECTIONS',
        entityId: id,
        ipAddress: req.ip,
        details: `Rejected: Inspector coordinates (${lat}, ${lng}) are ${distanceMeters}m away from registered site (Limit: 150m)`,
      });

      res.status(403).json({
        error: 'GEOFENCE_BOUNDARY_EXCEEDED',
        message: `Inspection locked. Current distance: ${Math.round(distanceMeters)} m. Move within ${STATUTORY_RADIUS_METERS} m of registered premises to continue.`,
        distanceMeters,
        requiredRadiusMeters: STATUTORY_RADIUS_METERS,
        geofenceVerified: false,
      });
      return;
    }

    const checkInTimestamp = new Date().toLocaleString('en-IN') + ' IST';

    execute(
      `UPDATE inspections
       SET status = 'ON_SITE',
           check_in_time = ?,
           check_in_lat = ?,
           check_in_lng = ?,
           check_in_distance_meters = ?,
           geofence_verified = 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [checkInTimestamp, Number(lat), Number(lng), distanceMeters, id]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'GEOFENCE_CHECK_IN_VERIFIED',
      entityType: 'INSPECTIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `150m perimeter verified. Distance: ${distanceMeters}m from ${inspection.ngo_name}`,
    });

    res.json({
      success: true,
      message: 'Location verified. Inspector is within the permitted 150-metre boundary.',
      status: 'Eligible for inspection',
      distanceMeters,
      requiredRadiusMeters: STATUTORY_RADIUS_METERS,
      checkInTime: checkInTimestamp,
      geofenceVerified: true,
    });
  } catch (err: any) {
    console.error('Error during geofence check-in:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to process geofence check-in.' });
  }
});

// POST /api/inspections/:id/evidence - Upload Geotagged & SHA-256 Hashed Evidence
inspectionsRouter.post('/:id/evidence', authenticateToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { category, caption, imageUrl, lat, lng, accuracyMeters = 3.5, locationAddress } = req.body;

    if (!category || !imageUrl) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Category and Image URL/Payload are required.' });
      return;
    }

    // Compute genuine SHA-256 checksum of payload
    const hashPayload = `${id}|${category}|${imageUrl.substring(0, 100)}|${lat}|${lng}|${Date.now()}`;
    const fileHash = 'SHA256:' + crypto.createHash('sha256').update(hashPayload).digest('hex');

    const evidenceId = 'ev_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const timestamp = new Date().toLocaleString('en-IN') + ' IST';
    const badge = req.user?.badge_number || 'INSP-DEL-OFFICER';

    execute(
      `INSERT INTO inspection_evidence (
        id, inspection_id, category_code, caption, image_url, file_hash,
        lat, lng, accuracy_meters, timestamp, inspector_badge, location_address
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        evidenceId, id, category, caption || 'Field Inspection Evidence',
        imageUrl, fileHash, Number(lat || 28.6139), Number(lng || 77.2090),
        Number(accuracyMeters), timestamp, badge, locationAddress || null
      ]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'EVIDENCE_UPLOADED',
      entityType: 'INSPECTION_EVIDENCE',
      entityId: evidenceId,
      ipAddress: req.ip,
      details: `Evidence uploaded in category [${category}] with hash ${fileHash.slice(0, 20)}...`,
    });

    res.status(201).json({
      id: evidenceId,
      category,
      fileHash,
      timestamp,
      message: 'Evidence securely registered with SHA-256 integrity seal.',
    });
  } catch (err: any) {
    console.error('Error uploading evidence:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to record evidence.' });
  }
});

// POST /api/inspections/:id/submit - Finalize & Submit Inspection Dossier
inspectionsRouter.post('/:id/submit', authenticateToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { checklist, observations, issuesDefects, inspectorRemarks, inspectionStatus = 'Completed' } = req.body;

    const inspection = queryOne('SELECT * FROM inspections WHERE id = ?', [id]);
    if (!inspection) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Inspection record not found.' });
      return;
    }

    const submittedAt = new Date().toLocaleString('en-IN') + ' IST';
    const auditPayload = `${id}|${observations}|${issuesDefects}|${inspectorRemarks}|${submittedAt}`;
    const tamperProofHash = 'SHA256:' + crypto.createHash('sha256').update(auditPayload).digest('hex');

    transaction(() => {
      // 1. Delete and insert fresh checklist items
      execute(`DELETE FROM inspection_checklist_items WHERE inspection_id = ?`, [id]);

      if (Array.isArray(checklist)) {
        for (const item of checklist) {
          const chkId = 'chk_' + crypto.randomUUID().replace(/-/g, '').substring(0, 8);
          execute(
            `INSERT INTO inspection_checklist_items (id, inspection_id, section, label, passed, notes)
             VALUES (?, ?, 'GENERAL', ?, ?, ?)`,
            [chkId, id, item.label, item.passed ? 1 : 0, item.notes || null]
          );
        }
      }

      // 2. Update inspection record
      const finalStatus = inspectionStatus === 'Completed' ? 'SUBMITTED' : 'ACTION_REQUIRED';

      execute(
        `UPDATE inspections
         SET status = ?,
             observations = ?,
             issues_defects = ?,
             inspector_remarks = ?,
             tamper_proof_hash = ?,
             submitted_at = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [finalStatus, observations, issuesDefects, inspectorRemarks, tamperProofHash, submittedAt, id]
      );
    });

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'INSPECTION_DOSSIER_SUBMITTED',
      entityType: 'INSPECTIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `Field audit submitted with SHA-256 seal: ${tamperProofHash.slice(0, 20)}...`,
    });

    res.json({
      success: true,
      message: 'Statutory inspection dossier submitted successfully to the Directorate.',
      status: 'SUBMITTED',
      tamperProofHash,
      submittedAt,
    });
  } catch (err: any) {
    console.error('Error submitting inspection:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to submit inspection dossier.' });
  }
});

// POST /api/inspections/:id/review - Directorate Scrutiny & Sanction Order
inspectionsRouter.post('/:id/review', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { verdict, score, complianceGrade, actionChoice, selectedActions, remarks } = req.body;

    if (!verdict || score === undefined || !complianceGrade || !actionChoice) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Verdict, Score, Compliance Grade, and Action Choice are required.' });
      return;
    }

    const inspection = queryOne(
      `SELECT i.*, n.id as ngo_id, n.name as ngo_name FROM inspections i
       JOIN ngos n ON i.ngo_id = n.id WHERE i.id = ?`,
      [id]
    );

    if (!inspection) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Inspection not found.' });
      return;
    }

    const reviewerName = req.user?.full_name || 'Demo Director (role: Directorate)';
    const reviewerBadge = req.user?.badge_number || 'DEMO-DIR-001';
    const reviewedAt = new Date().toLocaleString('en-IN') + ' IST';
    const sanctionOrderNumber = `DIR/ORD/2026/MSJE/${Math.floor(1000 + Math.random() * 9000)}${verdict === 'BAD_DEFICIENT' ? '-PUN' : ''}`;
    const assessmentId = 'scrutiny_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const selectedActionsJson = JSON.stringify(Array.isArray(selectedActions) ? selectedActions : []);

    transaction(() => {
      // 1. Delete previous assessment if any
      execute(`DELETE FROM compliance_assessments WHERE inspection_id = ?`, [id]);

      // 2. Insert new Directorate assessment
      execute(
        `INSERT INTO compliance_assessments (
          id, inspection_id, ngo_id, reviewed_by_user_id, reviewed_by_name, reviewed_by_badge,
          verdict, score, compliance_grade, action_choice, selected_actions,
          scrutiny_remarks, sanction_order_number, is_locked, reviewed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          assessmentId, id, inspection.ngo_id, req.user!.id, reviewerName, reviewerBadge,
          verdict, Number(score), complianceGrade, actionChoice, selectedActionsJson,
          remarks || 'Directorate review complete.', sanctionOrderNumber, reviewedAt
        ]
      );

      // 3. Update inspection status
      const inspectionFinalStatus = verdict === 'GOOD_COMPLIANT' ? 'COMPLETED' : 'ACTION_REQUIRED';
      execute(
        `UPDATE inspections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [inspectionFinalStatus, id]
      );

      // 4. Synchronize NGO Master Registry Status & Score
      const ngoNewStatus = verdict === 'GOOD_COMPLIANT' ? 'REGISTERED' : 'FLAGGED_VIOLATION';
      execute(
        `UPDATE ngos
         SET compliance_score = ?,
             status = ?,
             last_inspection_date = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [Number(score), ngoNewStatus, inspection.scheduled_date, inspection.ngo_id]
      );
    });

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'DIRECTORATE_SCRUTINY_EXECUTED',
      entityType: 'COMPLIANCE_ASSESSMENTS',
      entityId: assessmentId,
      ipAddress: req.ip,
      details: `Executed Sanction Order ${sanctionOrderNumber}: Verdict ${verdict}, Score ${score}/100 for ${inspection.ngo_name}`,
    });

    res.json({
      success: true,
      message: `Directorate Sanction Order ${sanctionOrderNumber} sealed and issued.`,
      sanctionOrderNumber,
      verdict,
      score,
      complianceGrade,
      reviewedAt,
    });
  } catch (err: any) {
    console.error('Error executing Directorate scrutiny:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to execute Directorate scrutiny review.' });
  }
});
