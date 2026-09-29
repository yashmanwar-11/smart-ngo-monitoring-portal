import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute, transaction } from '../db';
import { authenticateToken, requireRole, optionalAuth, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const applicationsRouter = Router();

// GET /api/applications - List all NGO registration applications
applicationsRouter.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { status, sector, search } = req.query;

    let sql = `
      SELECT id, ngo_name as ngoName, applicant_name as applicantName,
             applicant_role as applicantRole, email, phone,
             registration_number as registrationNumber, darpan_id as darpanId,
             sector, address, district, state, lat, lng,
             applied_date as appliedDate, status, rejection_reason as rejectionReason,
             created_at as createdAt
      FROM ngo_applications
      WHERE 1=1
    `;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status);
    }
    if (sector && sector !== 'ALL') {
      sql += ` AND sector = ?`;
      params.push(sector);
    }
    if (search) {
      sql += ` AND (LOWER(ngo_name) LIKE LOWER(?) OR LOWER(darpan_id) LIKE LOWER(?) OR LOWER(registration_number) LIKE LOWER(?))`;
      const searchParam = `%${String(search).trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY applied_date DESC, created_at DESC`;

    const rows = query(sql, params);
    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve applications.' });
  }
});

// GET /api/applications/:id - Single application
applicationsRouter.get('/:id', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const row = queryOne(
      `SELECT id, ngo_name as ngoName, applicant_name as applicantName,
              applicant_role as applicantRole, email, phone,
              registration_number as registrationNumber, darpan_id as darpanId,
              sector, address, district, state, lat, lng,
              applied_date as appliedDate, status, rejection_reason as rejectionReason,
              created_at as createdAt
       FROM ngo_applications WHERE id = ?`,
      [id]
    );

    if (!row) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Application record not found.' });
      return;
    }

    res.json(row);
  } catch (err: any) {
    console.error('Error fetching application by ID:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve application.' });
  }
});

// POST /api/applications - Submit new NGO registration application
applicationsRouter.post('/', (req: AuthRequest, res: Response): void => {
  try {
    const {
      ngoName,
      applicantName,
      applicantRole = 'Managing Trustee',
      email,
      phone,
      registrationNumber,
      darpanId,
      sector = 'Education',
      address,
      district,
      state = 'Delhi NCR',
      lat = 28.6139,
      lng = 77.2090,
    } = req.body;

    if (!ngoName || !applicantName || !email) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'NGO Name, Applicant Name, and Email are required.' });
      return;
    }

    const cleanDarpan = darpanId?.trim() || `DL/${new Date().getFullYear()}/${Math.floor(100000 + Math.random() * 900000)}`;
    const cleanReg = registrationNumber?.trim() || `REG-${(state || 'DL').slice(0, 2).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const id = 'app_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const appliedDate = new Date().toISOString().split('T')[0];

    execute(
      `INSERT INTO ngo_applications (
        id, ngo_name, applicant_name, applicant_role, email, phone,
        registration_number, darpan_id, sector, address, district, state,
        lat, lng, applied_date, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        id,
        ngoName.trim(),
        applicantName.trim(),
        applicantRole,
        email.trim(),
        phone || null,
        cleanReg,
        cleanDarpan,
        sector,
        address || 'Registered Office',
        district || 'South Delhi',
        state,
        Number(lat),
        Number(lng),
        appliedDate,
      ]
    );

    logAuditEvent({
      userName: applicantName,
      userRole: 'PUBLIC',
      action: 'NGO_APPLICATION_SUBMITTED',
      entityType: 'NGO_APPLICATIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `New DARPAN onboarding application submitted for ${ngoName} (${cleanDarpan})`,
    });

    res.status(201).json({
      success: true,
      id,
      darpanId: cleanDarpan,
      message: `Registration application for ${ngoName} submitted successfully. Placed in Directorate Review Queue.`,
    });
  } catch (err: any) {
    console.error('Error submitting NGO application:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to submit registration application.' });
  }
});

// POST /api/applications/:id/approve - Admin approves application (Auto-provisions NGO into Master Registry)
applicationsRouter.post('/:id/approve', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;

    const app = queryOne('SELECT * FROM ngo_applications WHERE id = ?', [id]);
    if (!app) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
      return;
    }

    if (app.status === 'APPROVED') {
      res.status(400).json({ error: 'ALREADY_APPROVED', message: 'This application has already been approved.' });
      return;
    }

    const newNgoId = 'ngo_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);

    transaction(() => {
      // 1. Update application status
      execute(
        `UPDATE ngo_applications SET status = 'APPROVED', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [id]
      );

      // 2. Check if NGO already exists by darpan_id
      const existingNgo = queryOne('SELECT id FROM ngos WHERE darpan_id = ?', [app.darpan_id]);
      if (!existingNgo) {
        // Insert into Master NGO Registry
        execute(
          `INSERT INTO ngos (
            id, darpan_id, name, registration_number, sector, status, founding_year,
            president_name, contact_email, contact_phone, address, district, state,
            lat, lng, fcra_status, annual_budget_inr, compliance_score, risk_level, risk_reasons
          ) VALUES (?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?, ?, ?, ?, ?, ?, ?, 'APPROVED', 2500000, 90.0, 'LOW', '["Initial DARPAN accreditation cleared unconditionally"]')`,
          [
            newNgoId,
            app.darpan_id,
            app.ngo_name,
            app.registration_number,
            app.sector,
            new Date().getFullYear(),
            app.applicant_name,
            app.email,
            app.phone || '+91 11 0000 0000',
            app.address,
            app.district,
            app.state,
            app.lat,
            app.lng,
          ]
        );
      }
    });

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'NGO_APPLICATION_APPROVED',
      entityType: 'NGO_APPLICATIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `Approved application for ${app.ngo_name}. Master Registry entry created.`,
    });

    res.json({
      success: true,
      message: `Application for ${app.ngo_name} approved and officially onboarded into Master Registry.`,
      ngoId: newNgoId,
    });
  } catch (err: any) {
    console.error('Error approving application:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to approve application.' });
  }
});

// POST /api/applications/:id/reject - Admin rejects application with reason
applicationsRouter.post('/:id/reject', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { reason = 'Incomplete statutory documentation or unverified registered premise.' } = req.body;

    const app = queryOne('SELECT * FROM ngo_applications WHERE id = ?', [id]);
    if (!app) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Application not found.' });
      return;
    }

    execute(
      `UPDATE ngo_applications
       SET status = 'REJECTED',
           rejection_reason = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [reason, id]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'NGO_APPLICATION_REJECTED',
      entityType: 'NGO_APPLICATIONS',
      entityId: id,
      ipAddress: req.ip,
      details: `Application for ${app.ngo_name} rejected. Reason: ${reason}`,
    });

    res.json({
      success: true,
      message: `Application for ${app.ngo_name} marked as REJECTED.`,
    });
  } catch (err: any) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to reject application.' });
  }
});
