import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute } from '../db';
import { authenticateToken, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const grievancesRouter = Router();

// POST /api/grievances - Public Citizen & Whistleblower Submission
grievancesRouter.post('/', (req: AuthRequest, res: Response): void => {
  try {
    const {
      ngoId, ngoName, citizenName, citizenContact,
      isAnonymous = false, category = 'FUNDS_EMBEZZLEMENT', description,
      evidenceUrls = []
    } = req.body;

    if (!description || description.trim().length < 10) {
      res.status(400).json({ error: 'INVALID_DESCRIPTION', message: 'A descriptive grievance report (minimum 10 characters) is required.' });
      return;
    }

    let targetNgoName = ngoName;
    if (ngoId && !targetNgoName) {
      const ngo = queryOne('SELECT name FROM ngos WHERE id = ?', [ngoId]);
      if (ngo) targetNgoName = ngo.name;
    }

    if (!targetNgoName) {
      targetNgoName = 'Unspecified Entity';
    }

    const id = 'grv_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const trackingToken = `GRV-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const submittedAt = new Date().toLocaleString('en-IN') + ' IST';
    const evidenceUrlsJson = JSON.stringify(Array.isArray(evidenceUrls) ? evidenceUrls : []);

    execute(
      `INSERT INTO grievances (
        id, tracking_token, ngo_id, ngo_name, citizen_name, citizen_contact,
        is_anonymous, category, description, evidence_urls, status, submitted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'RECEIVED', ?)`,
      [
        id, trackingToken, ngoId || null, targetNgoName,
        isAnonymous ? null : citizenName || 'Concerned Citizen',
        isAnonymous ? null : citizenContact || null,
        isAnonymous ? 1 : 0, category, description.trim(), evidenceUrlsJson, submittedAt
      ]
    );

    logAuditEvent({
      userName: isAnonymous ? 'ANONYMOUS_WHISTLEBLOWER' : citizenName || 'CITIZEN',
      userRole: 'PUBLIC',
      action: 'GRIEVANCE_LODGED',
      entityType: 'GRIEVANCES',
      entityId: id,
      ipAddress: req.ip,
      details: `Grievance lodged against ${targetNgoName} [Token: ${trackingToken}]`,
    });

    res.status(201).json({
      success: true,
      trackingToken,
      submittedAt,
      message: `Your grievance has been securely registered with token ${trackingToken}. Keep this token to monitor administrative status.`,
    });
  } catch (err: any) {
    console.error('Error recording grievance:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to record grievance.' });
  }
});

// GET /api/grievances/track/:token - Public Citizen Status Tracking
grievancesRouter.get('/track/:token', (req: AuthRequest, res: Response): void => {
  try {
    const { token } = req.params;

    const row = queryOne(
      `SELECT g.tracking_token, g.ngo_name, g.category, g.status, g.submitted_at, g.updated_at,
              g.admin_remarks
       FROM grievances g WHERE g.tracking_token = ?`,
      [token.trim().toUpperCase()]
    );

    if (!row) {
      res.status(404).json({
        error: 'INVALID_TOKEN',
        message: 'No grievance record found matching tracking token. Please verify the 13-character token.'
      });
      return;
    }

    // Public sanitized timeline
    const stages = [
      { step: 1, label: 'Grievance Received', completed: true, timestamp: row.submitted_at },
      { step: 2, label: 'Under Directorate Scrutiny', completed: row.status !== 'RECEIVED' },
      { step: 3, label: 'Vigilance Investigation Dispatched', completed: row.status === 'INSPECTION_ORDERED' || row.status === 'ACTION_TAKEN' || row.status === 'CLOSED' },
      { step: 4, label: 'Statutory Action Taken / Resolved', completed: row.status === 'ACTION_TAKEN' || row.status === 'CLOSED' }
    ];

    res.json({
      trackingToken: row.tracking_token,
      ngoName: row.ngo_name,
      category: row.category,
      status: row.status,
      submittedAt: row.submitted_at,
      timeline: stages,
      publicRemarks: row.status === 'ACTION_TAKEN' || row.status === 'CLOSED'
        ? (row.admin_remarks || 'Statutory review concluded by Directorate.')
        : 'Case is under active regulatory scrutiny. Field inspection or statutory inquiry may be initiated.'
    });
  } catch (err: any) {
    console.error('Error tracking grievance:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to track grievance.' });
  }
});

// GET /api/grievances - Search & List Grievances (Scoped by Role)
grievancesRouter.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { status, category } = req.query;
    const user = req.user;

    let sql = `SELECT * FROM grievances WHERE 1=1`;
    const params: any[] = [];

    // Role-based scoping
    if (user) {
      if (user.role === 'NGO' && user.ngo_id) {
        sql += ` AND ngo_id = ?`;
        params.push(user.ngo_id);
      } else if (user.role === 'USER') {
        sql += ` AND (LOWER(citizen_name) = LOWER(?) OR citizen_contact = ? OR is_anonymous = 0)`;
        params.push(user.full_name, user.email);
      }
      // ADMIN & OFFICER see all records
    }

    if (status && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (category && category !== 'ALL') {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY submitted_at DESC`;

    const rows = query(sql, params);

    const formatted = rows.map((r) => ({
      id: r.id,
      trackingToken: r.tracking_token,
      ngoId: r.ngo_id,
      ngoName: r.ngo_name,
      citizenName: r.is_anonymous ? 'Anonymous Whistleblower' : r.citizen_name,
      citizenContact: r.is_anonymous ? 'CONFIDENTIAL' : r.citizen_contact,
      isAnonymous: Boolean(r.is_anonymous),
      category: r.category,
      description: r.description,
      submittedAt: r.submitted_at,
      status: r.status,
      investigatingOfficerId: r.investigating_officer_id,
      adminRemarks: r.admin_remarks,
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching grievances:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve grievances.' });
  }
});

// PUT /api/grievances/:id/status - Update Status & Order Inspection (Admin Only)
grievancesRouter.put('/:id/status', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { status, adminRemarks, investigatingOfficerId } = req.body;

    const grievance = queryOne('SELECT * FROM grievances WHERE id = ?', [id]);
    if (!grievance) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Grievance not found.' });
      return;
    }

    execute(
      `UPDATE grievances
       SET status = ?,
           admin_remarks = COALESCE(?, admin_remarks),
           investigating_officer_id = COALESCE(?, investigating_officer_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, adminRemarks, investigatingOfficerId, id]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'GRIEVANCE_STATUS_UPDATED',
      entityType: 'GRIEVANCES',
      entityId: id,
      ipAddress: req.ip,
      details: `Grievance ${grievance.tracking_token} status set to ${status}`,
    });

    res.json({ success: true, message: 'Grievance status updated.' });
  } catch (err: any) {
    console.error('Error updating grievance status:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to update grievance.' });
  }
});
