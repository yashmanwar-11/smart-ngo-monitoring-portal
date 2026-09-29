import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const noticesRouter = Router();

// GET /api/notices - List Statutory Notices
noticesRouter.get('/', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;
    let sql = `
      SELECT n.*, ng.name as ngo_name, ng.darpan_id as ngo_darpan_id,
             u.full_name as issued_by_name,
             (SELECT COUNT(*) FROM notice_responses nr WHERE nr.notice_id = n.id) as responses_count
      FROM notices n
      JOIN ngos ng ON n.ngo_id = ng.id
      JOIN users u ON n.issued_by_user_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (user.role === 'NGO') {
      if (!user.ngo_id) {
        res.json([]);
        return;
      }
      sql += ` AND n.ngo_id = ?`;
      params.push(user.ngo_id);
    }

    sql += ` ORDER BY n.created_at DESC`;

    const rows = query(sql, params);
    res.json(rows);
  } catch (err: any) {
    console.error('Error fetching notices:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve notices.' });
  }
});

// GET /api/notices/:id - Notice Detail with Responses
noticesRouter.get('/:id', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const notice = queryOne(
      `SELECT n.*, ng.name as ngo_name, ng.darpan_id as ngo_darpan_id, ng.contact_email,
              u.full_name as issued_by_name
       FROM notices n
       JOIN ngos ng ON n.ngo_id = ng.id
       JOIN users u ON n.issued_by_user_id = u.id
       WHERE n.id = ?`,
      [id]
    );

    if (!notice) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notice not found.' });
      return;
    }

    // Role check: NGO users can only inspect their own notices
    if (user.role === 'NGO' && user.ngo_id !== notice.ngo_id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Unauthorized to view this notice.' });
      return;
    }

    const responses = query(
      `SELECT nr.*, u.full_name as submitted_by_name
       FROM notice_responses nr
       JOIN users u ON nr.submitted_by_user_id = u.id
       WHERE nr.notice_id = ?
       ORDER BY nr.submitted_at DESC`,
      [id]
    );

    res.json({ ...notice, responses });
  } catch (err: any) {
    console.error('Error fetching notice detail:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve notice detail.' });
  }
});

// POST /api/notices - Issue Notice (Admin Only)
noticesRouter.post('/', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { ngoId, inspectionId, subject, noticeType, reason, details, deadline } = req.body;

    if (!ngoId || !subject || !noticeType || !deadline) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'NGO ID, Subject, Notice Type, and Deadline are required.' });
      return;
    }

    const ngo = queryOne('SELECT id, name FROM ngos WHERE id = ?', [ngoId]);
    if (!ngo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Target NGO not found.' });
      return;
    }

    const id = 'not_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const noticeNumber = `NOT-MSJE-2026-${Math.floor(100 + Math.random() * 900)}`;

    execute(
      `INSERT INTO notices (
        id, notice_number, ngo_id, inspection_id, subject, notice_type,
        reason, details, deadline, issued_by_user_id, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ISSUED')`,
      [
        id, noticeNumber, ngoId, inspectionId || null, subject.trim(), noticeType,
        reason || 'Statutory Compliance Defect', details || '', deadline, req.user!.id
      ]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'STATUTORY_NOTICE_ISSUED',
      entityType: 'NOTICES',
      entityId: id,
      ipAddress: req.ip,
      details: `Issued ${noticeType} notice ${noticeNumber} to ${ngo.name}`,
    });

    res.status(201).json({
      success: true,
      id,
      noticeNumber,
      message: `Official Notice ${noticeNumber} issued with deadline ${deadline}.`
    });
  } catch (err: any) {
    console.error('Error issuing notice:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to issue notice.' });
  }
});

// POST /api/notices/:id/respond - NGO Submits Response
noticesRouter.post('/:id/respond', authenticateToken, requireRole(['NGO', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { responseText, attachmentUrls = [] } = req.body;

    if (!responseText || responseText.trim().length < 10) {
      res.status(400).json({ error: 'INVALID_RESPONSE', message: 'Formal response text (minimum 10 characters) is required.' });
      return;
    }

    const notice = queryOne('SELECT * FROM notices WHERE id = ?', [id]);
    if (!notice) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'Notice not found.' });
      return;
    }

    if (req.user?.role === 'NGO' && req.user.ngo_id !== notice.ngo_id) {
      res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot respond to notices issued to another organization.' });
      return;
    }

    const responseId = 'resp_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const attachmentsJson = JSON.stringify(Array.isArray(attachmentUrls) ? attachmentUrls : []);

    execute(
      `INSERT INTO notice_responses (id, notice_id, ngo_id, response_text, attachment_urls, submitted_by_user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [responseId, id, notice.ngo_id, responseText.trim(), attachmentsJson, req.user!.id]
    );

    execute(
      `UPDATE notices SET status = 'RESPONSE_RECEIVED' WHERE id = ?`,
      [id]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'NOTICE_RESPONSE_SUBMITTED',
      entityType: 'NOTICES',
      entityId: id,
      ipAddress: req.ip,
      details: `Formal response submitted for notice ${notice.notice_number}`,
    });

    res.status(201).json({
      success: true,
      message: 'Official response submitted to Directorate. Status updated to RESPONSE_RECEIVED.'
    });
  } catch (err: any) {
    console.error('Error responding to notice:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to record response.' });
  }
});
