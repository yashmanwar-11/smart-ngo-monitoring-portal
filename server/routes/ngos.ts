import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const ngosRouter = Router();

// GET /api/ngos - Public & Admin Searchable Directory
ngosRouter.get('/', (req: AuthRequest, res: Response): void => {
  try {
    const { sector, status, district, state, riskLevel, search } = req.query;

    let sql = `
      SELECT n.id, n.darpan_id as darpanId, n.name, n.registration_number as regNumber,
             n.sector, n.scheme, n.ngo_type as ngoType, n.website, n.google_maps_url as googleMapsUrl,
             n.verification_status as verificationStatus,
             n.status, n.founding_year as foundingYear, n.president_name as presidentName,
             n.contact_email as contactEmail, n.contact_phone as contactPhone,
             n.address, n.district, n.state, n.lat, n.lng, n.fcra_status as fcraStatus,
             n.annual_budget_inr as annualBudgetInr, n.compliance_score as complianceScore,
             n.risk_level as riskLevel, n.risk_reasons as riskReasons,
             n.last_inspection_date as lastInspectionDate,
             (SELECT COUNT(*) FROM grievances g WHERE g.ngo_id = n.id) as reportedComplaintsCount
      FROM ngos n
      WHERE 1=1
    `;

    const params: any[] = [];

    if (sector && sector !== 'ALL') {
      sql += ` AND n.sector = ?`;
      params.push(sector);
    }
    if (status && status !== 'ALL') {
      sql += ` AND n.status = ?`;
      params.push(status);
    }
    if (district && district !== 'ALL') {
      sql += ` AND n.district = ?`;
      params.push(district);
    }
    if (state && state !== 'ALL') {
      sql += ` AND n.state = ?`;
      params.push(state);
    }
    if (riskLevel && riskLevel !== 'ALL') {
      sql += ` AND n.risk_level = ?`;
      params.push(riskLevel);
    }
    if (search) {
      sql += ` AND (LOWER(n.name) LIKE LOWER(?) OR LOWER(n.darpan_id) LIKE LOWER(?) OR LOWER(n.district) LIKE LOWER(?))`;
      const searchParam = `%${String(search).trim()}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    sql += ` ORDER BY n.compliance_score DESC, n.name ASC`;

    const rawRows = query(sql, params);

    // Format fields to match frontend expectations
    const formatted = rawRows.map((ngo) => {
      let parsedRiskReasons: string[] = [];
      try {
        parsedRiskReasons = ngo.riskReasons ? JSON.parse(ngo.riskReasons) : [];
      } catch {
        parsedRiskReasons = [];
      }

      return {
        id: ngo.id,
        name: ngo.name,
        regNumber: ngo.regNumber,
        sector: ngo.sector,
        scheme: ngo.scheme || undefined,
        ngoType: ngo.ngoType || undefined,
        website: ngo.website || undefined,
        googleMapsUrl: ngo.googleMapsUrl || undefined,
        verificationStatus: ngo.verificationStatus || undefined,
        status: ngo.status,
        foundingYear: ngo.foundingYear,
        presidentName: ngo.presidentName,
        contactEmail: ngo.contactEmail,
        contactPhone: ngo.contactPhone,
        address: ngo.address,
        district: ngo.district,
        state: ngo.state,
        coordinates: {
          lat: ngo.lat,
          lng: ngo.lng,
        },
        fcraStatus: ngo.fcraStatus,
        annualBudgetInr: ngo.annualBudgetInr,
        complianceScore: ngo.complianceScore,
        riskLevel: ngo.riskLevel,
        riskReasons: parsedRiskReasons,
        lastInspectionDate: ngo.lastInspectionDate,
        reportedComplaintsCount: ngo.reportedComplaintsCount || 0,
        description: `Dedicated ${ngo.sector} welfare foundation working across ${ngo.district}, ${ngo.state}.`,
        documents: {
          panCardNumber: 'AAATP' + String(ngo.foundingYear).slice(0, 4) + 'E',
          darpanId: ngo.darpanId,
        },
      };
    });

    res.json(formatted);
  } catch (err: any) {
    console.error('Error fetching NGOs:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve NGO directory.' });
  }
});

// GET /api/ngos/:id - Full Dossier
ngosRouter.get('/:id', (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;

    const ngo = queryOne(
      `SELECT n.*, (SELECT COUNT(*) FROM grievances g WHERE g.ngo_id = n.id) as reportedComplaintsCount
       FROM ngos n WHERE n.id = ?`,
      [id]
    );

    if (!ngo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'NGO record not found.' });
      return;
    }

    const documents = query(
      `SELECT * FROM ngo_documents WHERE ngo_id = ? ORDER BY uploaded_at DESC`,
      [id]
    );

    const inspections = query(
      `SELECT i.*, u.full_name as assigned_inspector_name, u.badge_number as assigned_inspector_badge
       FROM inspections i
       LEFT JOIN users u ON i.assigned_inspector_id = u.id
       WHERE i.ngo_id = ?
       ORDER BY i.scheduled_date DESC`,
      [id]
    );

    const notices = query(
      `SELECT * FROM notices WHERE ngo_id = ? ORDER BY created_at DESC`,
      [id]
    );

    let riskReasons: string[] = [];
    try {
      riskReasons = ngo.risk_reasons ? JSON.parse(ngo.risk_reasons) : [];
    } catch {
      riskReasons = [];
    }

    res.json({
      id: ngo.id,
      darpanId: ngo.darpan_id,
      name: ngo.name,
      regNumber: ngo.registration_number,
      sector: ngo.sector,
      scheme: ngo.scheme || undefined,
      ngoType: ngo.ngo_type || undefined,
      website: ngo.website || undefined,
      googleMapsUrl: ngo.google_maps_url || undefined,
      verificationStatus: ngo.verification_status || undefined,
      status: ngo.status,
      foundingYear: ngo.founding_year,
      presidentName: ngo.president_name,
      contactEmail: ngo.contact_email,
      contactPhone: ngo.contact_phone,
      address: ngo.address,
      district: ngo.district,
      state: ngo.state,
      coordinates: { lat: ngo.lat, lng: ngo.lng },
      fcraStatus: ngo.fcra_status,
      annualBudgetInr: ngo.annual_budget_inr,
      complianceScore: ngo.compliance_score,
      riskLevel: ngo.risk_level,
      riskReasons,
      lastInspectionDate: ngo.last_inspection_date,
      reportedComplaintsCount: ngo.reportedComplaintsCount || 0,
      documents,
      inspections,
      notices,
    });
  } catch (err: any) {
    console.error('Error fetching NGO dossier:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve NGO dossier.' });
  }
});

// POST /api/ngos - Create NGO (Admin Only)
ngosRouter.post('/', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const {
      name, darpanId, registrationNumber, sector, foundingYear,
      presidentName, contactEmail, contactPhone, address, district, state,
      lat = 28.6139, lng = 77.2090, fcraStatus = 'APPROVED', annualBudgetInr = 0,
    } = req.body;

    if (!name || !darpanId || !sector || !district || !state) {
      res.status(400).json({ error: 'MISSING_FIELDS', message: 'Name, DARPAN ID, Sector, District, and State are required.' });
      return;
    }

    const existing = queryOne('SELECT id FROM ngos WHERE darpan_id = ?', [darpanId.trim()]);
    if (existing) {
      res.status(409).json({ error: 'DUPLICATE_DARPAN_ID', message: 'An NGO with this DARPAN ID is already registered.' });
      return;
    }

    const id = 'ngo_' + crypto.randomUUID().replace(/-/g, '').substring(0, 12);
    const regNum = registrationNumber || `REG-${state.slice(0, 2).toUpperCase()}-${foundingYear || 2024}-${Math.floor(1000 + Math.random() * 9000)}`;

    execute(
      `INSERT INTO ngos (
        id, darpan_id, name, registration_number, sector, status, founding_year,
        president_name, contact_email, contact_phone, address, district, state,
        lat, lng, fcra_status, annual_budget_inr, compliance_score, risk_level
      ) VALUES (?, ?, ?, ?, ?, 'REGISTERED', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 80.0, 'LOW')`,
      [
        id, darpanId.trim(), name.trim(), regNum, sector, foundingYear || 2020,
        presidentName || 'Representative', contactEmail || 'contact@domain.org',
        contactPhone || '+91 11 0000 0000', address || 'Registered Office',
        district, state, Number(lat), Number(lng), fcraStatus, Number(annualBudgetInr)
      ]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'NGO_REGISTERED',
      entityType: 'NGOS',
      entityId: id,
      ipAddress: req.ip,
      details: `New NGO created: ${name} (${darpanId})`,
    });

    res.status(201).json({ id, darpanId, name, status: 'REGISTERED' });
  } catch (err: any) {
    console.error('Error creating NGO:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to create NGO record.' });
  }
});

// PUT /api/ngos/:id - Update NGO (Admin Only)
ngosRouter.put('/:id', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { name, sector, status, complianceScore, riskLevel, contactEmail, contactPhone, address } = req.body;

    const ngo = queryOne('SELECT * FROM ngos WHERE id = ?', [id]);
    if (!ngo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'NGO not found.' });
      return;
    }

    execute(
      `UPDATE ngos
       SET name = COALESCE(?, name),
           sector = COALESCE(?, sector),
           status = COALESCE(?, status),
           compliance_score = COALESCE(?, compliance_score),
           risk_level = COALESCE(?, risk_level),
           contact_email = COALESCE(?, contact_email),
           contact_phone = COALESCE(?, contact_phone),
           address = COALESCE(?, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, sector, status,
        complianceScore !== undefined ? Number(complianceScore) : null,
        riskLevel, contactEmail, contactPhone, address, id
      ]
    );

    logAuditEvent({
      userId: req.user?.id,
      userName: req.user?.full_name,
      userRole: req.user?.role,
      action: 'NGO_UPDATED',
      entityType: 'NGOS',
      entityId: id,
      ipAddress: req.ip,
      details: `Updated NGO details for ${ngo.name}`,
    });

    res.json({ success: true, message: 'NGO updated successfully.' });
  } catch (err: any) {
    console.error('Error updating NGO:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to update NGO.' });
  }
});
