import { Router, Response } from 'express';
import { query, queryOne } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

export const dashboardRouter = Router();

// GET /api/dashboard/stats - Public High-Level Aggregated KPI Statistics
dashboardRouter.get('/stats', (_req, res): void => {
  try {
    const totalNgos = queryOne(`SELECT COUNT(*) as count FROM ngos`)?.count || 0;
    const totalBudgetRow = queryOne(`SELECT SUM(annual_budget_inr) as total FROM ngos`);
    const totalBudget = totalBudgetRow?.total || 0;
    const activeAudits = queryOne(`SELECT COUNT(*) as count FROM inspections WHERE status IN ('ON_SITE', 'SCHEDULED', 'ASSIGNED', 'SUBMITTED')`)?.count || 0;
    const completedAudits = queryOne(`SELECT COUNT(*) as count FROM inspections WHERE status = 'COMPLETED'`)?.count || 0;
    const totalAttendancePunches = queryOne(`SELECT COUNT(*) as count FROM worker_attendance`)?.count || 0;
    const totalGrievances = queryOne(`SELECT COUNT(*) as count FROM grievances`)?.count || 0;
    const resolvedGrievances = queryOne(`SELECT COUNT(*) as count FROM grievances WHERE status = 'RESOLVED'`)?.count || 0;
    const districtsCovered = queryOne(`SELECT COUNT(DISTINCT district) as count FROM ngos`)?.count || 0;

    res.json({
      totalNgos,
      totalBudget,
      activeAudits,
      completedAudits,
      totalAttendancePunches,
      totalGrievances,
      resolvedGrievances,
      districtsCovered,
    });
  } catch (err: any) {
    console.error('Error fetching public stats:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve portal statistics.' });
  }
});

// GET /api/dashboard/admin - Administrative Directorate Analytics & KPIs
dashboardRouter.get('/admin', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const totalNgos = queryOne(`SELECT COUNT(*) as count FROM ngos`)?.count || 0;
    const activeAudits = queryOne(`SELECT COUNT(*) as count FROM inspections WHERE status IN ('ON_SITE', 'SUBMITTED')`)?.count || 0;
    const pendingInspections = queryOne(`SELECT COUNT(*) as count FROM inspections WHERE status IN ('SCHEDULED', 'ASSIGNED')`)?.count || 0;
    const completedAudits = queryOne(`SELECT COUNT(*) as count FROM inspections WHERE status = 'COMPLETED'`)?.count || 0;
    const flaggedViolations = queryOne(`SELECT COUNT(*) as count FROM ngos WHERE status = 'FLAGGED_VIOLATION'`)?.count || 0;
    const openGrievances = queryOne(`SELECT COUNT(*) as count FROM grievances WHERE status IN ('RECEIVED', 'UNDER_REVIEW', 'INSPECTION_ORDERED')`)?.count || 0;
    const pendingNotices = queryOne(`SELECT COUNT(*) as count FROM notices WHERE status IN ('ISSUED', 'RESPONSE_RECEIVED')`)?.count || 0;
    const fieldOfficersCount = queryOne(`SELECT COUNT(*) as count FROM users u JOIN roles r ON u.role_id = r.id WHERE r.name = 'OFFICER'`)?.count || 0;

    const sectorDistribution = query(`SELECT sector, COUNT(*) as count FROM ngos GROUP BY sector`);
    const recentAudits = query(
      `SELECT i.id, i.scheduled_date as date, i.status, n.name as ngo_name, u.full_name as inspector_name
       FROM inspections i
       JOIN ngos n ON i.ngo_id = n.id
       LEFT JOIN users u ON i.assigned_inspector_id = u.id
       ORDER BY i.scheduled_date DESC LIMIT 5`
    );

    res.json({
      kpis: {
        totalNgos,
        activeAudits,
        pendingInspections,
        completedAudits,
        flaggedViolations,
        openGrievances,
        pendingNotices,
        fieldOfficersCount,
      },
      sectorDistribution,
      recentAudits,
    });
  } catch (err: any) {
    console.error('Error fetching admin dashboard metrics:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve admin dashboard metrics.' });
  }
});

// GET /api/dashboard/inspector - Field Vigilance Officer Summary
dashboardRouter.get('/inspector', authenticateToken, requireRole(['OFFICER', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;

    const assignedTasks = query(
      `SELECT i.*, n.name as ngo_name, n.address as ngo_address, n.lat as ngo_lat, n.lng as ngo_lng
       FROM inspections i
       JOIN ngos n ON i.ngo_id = n.id
       WHERE i.assigned_inspector_id = ?
       ORDER BY i.scheduled_date ASC`,
      [user.id]
    );

    const pendingCheckIns = assignedTasks.filter((t) => t.status === 'ASSIGNED').length;
    const completedCount = assignedTasks.filter((t) => t.status === 'COMPLETED' || t.status === 'ACTION_REQUIRED').length;
    const activeAudits = assignedTasks.filter((t) => t.status === 'ON_SITE' || t.status === 'SUBMITTED').length;

    res.json({
      officer: {
        name: user.full_name,
        badge: user.badge_number,
        assignedDistrict: user.assigned_district,
      },
      metrics: {
        totalAssigned: assignedTasks.length,
        pendingCheckIns,
        activeAudits,
        completedCount,
      },
      tasks: assignedTasks,
    });
  } catch (err: any) {
    console.error('Error fetching inspector dashboard metrics:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve inspector metrics.' });
  }
});

// GET /api/dashboard/ngo - Authenticated NGO Profile & Compliance Status
dashboardRouter.get('/ngo', authenticateToken, requireRole(['NGO', 'ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const user = req.user!;

    if (!user.ngo_id) {
      res.status(404).json({ error: 'NO_LINKED_NGO', message: 'No registered NGO entity associated with this account.' });
      return;
    }

    const ngo = queryOne('SELECT * FROM ngos WHERE id = ?', [user.ngo_id]);
    if (!ngo) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'NGO record not found.' });
      return;
    }

    const inspections = query(
      `SELECT * FROM inspections WHERE ngo_id = ? ORDER BY scheduled_date DESC`,
      [user.ngo_id]
    );

    const notices = query(
      `SELECT * FROM notices WHERE ngo_id = ? ORDER BY created_at DESC`,
      [user.ngo_id]
    );

    const documents = query(
      `SELECT * FROM ngo_documents WHERE ngo_id = ? ORDER BY uploaded_at DESC`,
      [user.ngo_id]
    );

    res.json({
      ngo,
      inspections,
      notices,
      documents,
    });
  } catch (err: any) {
    console.error('Error fetching NGO dashboard:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve NGO dashboard.' });
  }
});

// GET /api/dashboard/audit-logs - Immutable Security & Administrative Audit Trail (Admin Only)
dashboardRouter.get('/audit-logs', authenticateToken, requireRole(['ADMIN']), (req: AuthRequest, res: Response): void => {
  try {
    const { action, entityType, limit = 100 } = req.query;

    let sql = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (action) {
      sql += ` AND action = ?`;
      params.push(action);
    }
    if (entityType) {
      sql += ` AND entity_type = ?`;
      params.push(entityType);
    }

    sql += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(Number(limit));

    const logs = query(sql, params);
    res.json(logs);
  } catch (err: any) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve audit logs.' });
  }
});
