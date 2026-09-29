import { Router, Request, Response } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { requireAuth } from '../middleware/auth';

export const vcRouter = Router();

// Protect all VC endpoints with official auth
vcRouter.use(requireAuth);

/**
 * GET /api/vc/sessions
 * Returns list of VC inspection sessions with filter support
 */
vcRouter.get('/sessions', (req: Request, res: Response): void => {
  try {
    const ngoId = req.query.ngoId as string;
    let query = 'SELECT * FROM vc_sessions ORDER BY created_at DESC LIMIT 50';
    let params: any[] = [];

    if (ngoId) {
      query = 'SELECT * FROM vc_sessions WHERE ngo_id = ? ORDER BY created_at DESC LIMIT 50';
      params = [ngoId];
    }

    const rows = db.prepare(query).all(...params) as any[];
    const sessions = rows.map((r) => ({
      id: r.id,
      sessionToken: r.session_token,
      ngoId: r.ngo_id,
      ngoName: r.ngo_name,
      ngoDarpanId: r.ngo_darpan_id,
      district: r.district,
      state: r.state,
      scheme: r.scheme,
      initiatedByOfficerId: r.initiated_by_officer_id,
      initiatedByOfficerName: r.initiated_by_officer_name,
      participantType: r.participant_type,
      participantName: r.participant_name,
      participantPhone: r.participant_phone,
      startTime: r.start_time,
      endTime: r.end_time,
      status: r.status,
      verificationChecklist: r.verification_checklist ? JSON.parse(r.verification_checklist) : {},
      latitude: r.lat,
      longitude: r.lng,
      accuracyMeters: r.accuracy_meters,
      evidenceSnapshotUrl: r.evidence_snapshot_url,
      tamperProofHash: r.tamper_proof_hash,
      findingsSummary: r.findings_summary,
      complianceVerdict: r.compliance_verdict,
    }));

    res.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Failed to get VC sessions:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});

/**
 * GET /api/vc/random-target
 * Algorithmic selection of a DoSJE institute/project for a surprise VC check
 */
vcRouter.get('/random-target', (req: Request, res: Response): void => {
  try {
    const scheme = req.query.scheme as string;
    let query = `
      SELECT id, name, darpan_id, sector, scheme, district, state, lat, lng, president_name, contact_phone, compliance_score 
      FROM ngos 
      WHERE status != 'REJECTED'
    `;
    const params: any[] = [];

    if (scheme && scheme !== 'ALL') {
      query += ' AND (scheme LIKE ? OR sector LIKE ?)';
      params.push(`%${scheme}%`, `%${scheme}%`);
    }

    query += ' ORDER BY RANDOM() LIMIT 1';

    const target = db.prepare(query).get(...params) as any;
    if (!target) {
      res.status(404).json({ error: 'NO_TARGET', message: 'No registered institute found for specified criteria.' });
      return;
    }

    // Generate random candidate participant options
    const candidateParticipants = [
      {
        type: 'INCHARGE',
        name: target.president_name || 'Dr. Anand Deshmukh',
        roleTitle: 'Project Director & In-Charge',
        phone: target.contact_phone || '+91 98220 44910',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
      },
      {
        type: 'STAFF',
        name: 'Sunita Patil',
        roleTitle: 'Resident Counselor & Nursing Staff',
        phone: '+91 98334 11290',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&auto=format&fit=crop&q=80',
      },
      {
        type: 'BENEFICIARY',
        name: 'Ramesh K. (Beneficiary ID: BEN-2026-081)',
        roleTitle: target.scheme?.includes('NAPDDR') ? 'Rehabilitation Patient' : target.scheme?.includes('AVYAY') ? 'Senior Resident' : 'Student Scholar',
        phone: '+91 91234 56789',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      },
    ];

    res.json({
      success: true,
      targetInstitute: target,
      candidateParticipants,
    });
  } catch (error: any) {
    console.error('Failed to get random VC target:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});

/**
 * POST /api/vc/initiate
 * Create a new surprise Video Conference session
 */
vcRouter.post('/initiate', (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const {
      ngoId,
      ngoName,
      ngoDarpanId,
      district,
      state,
      scheme,
      participantType,
      participantName,
      participantPhone,
      lat,
      lng,
    } = req.body;

    if (!ngoId || !ngoName || !participantType || !participantName) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'NGO details and participant information are required.' });
      return;
    }

    const id = `vc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const sessionToken = `VC-SURPRISE-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const startTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';

    const defaultChecklist = {
      physicalPresenceConfirmed: true,
      identityVerifiedAadhaar: true,
      headcountMatchesRegister: true,
      reportedHeadcount: 24,
      cleanlinessAndMealsSatisfactory: true,
      noCoercionReported: true,
      immediateGrievanceNoted: '',
    };

    db.prepare(`
      INSERT INTO vc_sessions (
        id, session_token, ngo_id, ngo_name, ngo_darpan_id, district, state, scheme,
        initiated_by_officer_id, initiated_by_officer_name, participant_type, participant_name,
        participant_phone, start_time, status, verification_checklist, lat, lng, accuracy_meters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      sessionToken,
      ngoId,
      ngoName,
      ngoDarpanId || 'DL/2026/00142',
      district || 'South Delhi',
      state || 'Delhi NCR',
      scheme || 'NAPDDR',
      user?.id || 'usr_admin_1',
      user?.name || 'Dr. Rajesh Verma, IAS',
      participantType,
      participantName,
      participantPhone || '+91 98765 43210',
      startTime,
      'CONNECTED',
      JSON.stringify(defaultChecklist),
      lat || 28.6139,
      lng || 77.2090,
      3.5
    );

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${Date.now()}`,
      user?.id,
      user?.name || 'Officer',
      user?.role || 'ADMIN',
      'VC_SURPRISE_CALL_INITIATED',
      'VC_SESSION',
      id,
      `Surprise VC initiated with ${participantName} (${participantType}) at ${ngoName}`
    );

    res.json({
      success: true,
      sessionId: id,
      sessionToken,
      startTime,
      participantName,
      participantType,
      status: 'CONNECTED',
    });
  } catch (error: any) {
    console.error('Failed to initiate VC session:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});

/**
 * POST /api/vc/verify
 * Update on-call checklist and intermediate observations
 */
vcRouter.post('/verify', (req: Request, res: Response): void => {
  try {
    const { sessionId, checklist, snapshotUrl, findingsSummary } = req.body;
    if (!sessionId) {
      res.status(400).json({ error: 'MISSING_ID', message: 'Session ID is required.' });
      return;
    }

    db.prepare(`
      UPDATE vc_sessions 
      SET verification_checklist = ?, evidence_snapshot_url = COALESCE(?, evidence_snapshot_url), findings_summary = COALESCE(?, findings_summary)
      WHERE id = ?
    `).run(
      JSON.stringify(checklist || {}),
      snapshotUrl || null,
      findingsSummary || null,
      sessionId
    );

    res.json({ success: true, message: 'On-call verification checklist updated.' });
  } catch (error: any) {
    console.error('Failed to update VC verification:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});

/**
 * POST /api/vc/complete
 * Seal and complete the surprise Video Conference session with cryptographic verification token
 */
vcRouter.post('/complete', (req: Request, res: Response): void => {
  try {
    const user = (req as any).user;
    const { sessionId, findingsSummary, complianceVerdict, snapshotUrl, checklist } = req.body;

    if (!sessionId) {
      res.status(400).json({ error: 'MISSING_ID', message: 'Session ID is required.' });
      return;
    }

    const endTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST';
    const hashData = `${sessionId}:${endTime}:${complianceVerdict}:${findingsSummary}`;
    const tamperProofHash = 'SHA256:' + crypto.createHash('sha256').update(hashData).digest('hex');

    db.prepare(`
      UPDATE vc_sessions 
      SET status = 'COMPLETED',
          end_time = ?,
          findings_summary = ?,
          compliance_verdict = ?,
          evidence_snapshot_url = COALESCE(?, evidence_snapshot_url),
          verification_checklist = COALESCE(?, verification_checklist),
          tamper_proof_hash = ?
      WHERE id = ?
    `).run(
      endTime,
      findingsSummary || 'Surprise video conference verification completed. On-site presence and beneficiary interaction recorded.',
      complianceVerdict || 'SATISFACTORY',
      snapshotUrl || null,
      checklist ? JSON.stringify(checklist) : null,
      tamperProofHash,
      sessionId
    );

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_name, user_role, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `aud_${Date.now()}`,
      user?.id,
      user?.name || 'Officer',
      user?.role || 'ADMIN',
      'VC_SURPRISE_CALL_COMPLETED',
      'VC_SESSION',
      sessionId,
      `VC session finalized with verdict: ${complianceVerdict || 'SATISFACTORY'} (Hash: ${tamperProofHash.substring(0, 16)}...)`
    );

    res.json({
      success: true,
      message: 'Surprise Video Conference audit completed and cryptographically sealed.',
      tamperProofHash,
      endTime,
      complianceVerdict: complianceVerdict || 'SATISFACTORY',
    });
  } catch (error: any) {
    console.error('Failed to complete VC session:', error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: error.message });
  }
});
