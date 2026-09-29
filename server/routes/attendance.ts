import { Router, Response } from 'express';
import crypto from 'node:crypto';
import { query, queryOne, execute } from '../db';
import { optionalAuth, AuthRequest } from '../middleware/auth';
import { logAuditEvent } from '../middleware/audit';

export const attendanceRouter = Router();

// Helper to map DB row to camelCase frontend format
function mapAttendanceRow(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    workerId: row.worker_id,
    workerName: row.worker_name,
    workerDesignation: row.worker_role,
    ngoId: row.ngo_id,
    ngoName: row.ngo_name,
    dutyDate: row.duty_date,
    checkInTime: row.check_in_time,
    checkInPhoto: row.check_in_photo,
    checkInCoordinates: row.check_in_lat !== null && row.check_in_lng !== null ? {
      lat: row.check_in_lat,
      lng: row.check_in_lng,
    } : undefined,
    checkInAddress: row.check_in_address,
    checkInDistanceMeters: row.check_in_distance_meters,
    checkInTamperHash: row.check_in_hash,
    checkOutTime: row.check_out_time,
    checkOutPhoto: row.check_out_photo,
    checkOutCoordinates: row.check_out_lat !== null && row.check_out_lng !== null ? {
      lat: row.check_out_lat,
      lng: row.check_out_lng,
    } : undefined,
    checkOutAddress: row.check_out_address,
    checkOutDistanceMeters: row.check_out_distance_meters,
    checkOutTamperHash: row.check_out_hash,
    hoursWorked: row.hours_worked,
    status: row.status,
    shiftNotes: row.shift_notes,
    departureNotes: row.departure_notes,
    supervisorApproval: row.supervisor_verification,
    supervisorRemarks: row.supervisor_remarks,
    createdAt: row.created_at,
  };
}

// GET /api/attendance - List attendance records
attendanceRouter.get('/', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { workerId, ngoId, date, status } = req.query;

    let sql = `SELECT * FROM worker_attendance WHERE 1=1`;
    const params: any[] = [];

    if (workerId) {
      sql += ` AND worker_id = ?`;
      params.push(workerId);
    }
    if (ngoId) {
      sql += ` AND ngo_id = ?`;
      params.push(ngoId);
    }
    if (date) {
      sql += ` AND duty_date = ?`;
      params.push(date);
    }
    if (status && status !== 'ALL') {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY duty_date DESC, created_at DESC LIMIT 100`;

    const rows = query(sql, params);
    res.json(rows.map(mapAttendanceRow));
  } catch (err: any) {
    console.error('Error fetching attendance records:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve attendance logs.' });
  }
});

// GET /api/attendance/today/:workerId - Get today's record for a worker
attendanceRouter.get('/today/:workerId', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { workerId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const row = queryOne(
      `SELECT * FROM worker_attendance WHERE worker_id = ? AND duty_date = ? LIMIT 1`,
      [workerId, today]
    );

    res.json(row ? mapAttendanceRow(row) : null);
  } catch (err: any) {
    console.error('Error fetching today attendance:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to retrieve today session.' });
  }
});

// POST /api/attendance/check-in or /punch-in - Record morning arrival check-in with camera photo
attendanceRouter.post(['/check-in', '/punch-in'], optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const {
      workerId,
      workerName,
      workerRole = 'Community Health Mobilizer & Field Staff',
      ngoId,
      ngoName,
      dutyDate = new Date().toISOString().split('T')[0],
      checkInTime = new Date().toLocaleTimeString('en-IN') + ' IST',
      checkInPhoto,
      checkInLat,
      checkInLng,
      checkInAddress = 'Field Location, Mumbai',
      checkInDistanceMeters = 25.0,
      shiftNotes = '',
      checkInHash,
    } = req.body;

    if (!workerId || !checkInPhoto) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Worker ID and Arrival Photo are required.' });
      return;
    }

    // Check if record already exists for today
    const existing = queryOne(
      `SELECT id FROM worker_attendance WHERE worker_id = ? AND duty_date = ? LIMIT 1`,
      [workerId, dutyDate]
    );

    const hash = checkInHash || 'SHA256:' + crypto.createHash('sha256').update(`${workerId}-${dutyDate}-${checkInTime}`).digest('hex');
    const attendanceId = existing ? existing.id : `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    if (existing) {
      execute(
        `UPDATE worker_attendance SET
          check_in_time = ?,
          check_in_photo = ?,
          check_in_lat = ?,
          check_in_lng = ?,
          check_in_address = ?,
          check_in_distance_meters = ?,
          check_in_hash = ?,
          shift_notes = ?,
          status = 'IN_PROGRESS',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [
          checkInTime,
          checkInPhoto,
          checkInLat || null,
          checkInLng || null,
          checkInAddress,
          checkInDistanceMeters,
          hash,
          shiftNotes,
          existing.id,
        ]
      );
    } else {
      execute(
        `INSERT INTO worker_attendance (
          id, worker_id, worker_name, worker_role, ngo_id, ngo_name, duty_date,
          check_in_time, check_in_photo, check_in_lat, check_in_lng, check_in_address,
          check_in_distance_meters, check_in_hash, shift_notes, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_PROGRESS')`,
        [
          attendanceId,
          workerId,
          workerName || 'NGO Field Staff',
          workerRole,
          ngoId || 'ngo_swasthya',
          ngoName || 'Swasthya Seva Trust',
          dutyDate,
          checkInTime,
          checkInPhoto,
          checkInLat || null,
          checkInLng || null,
          checkInAddress,
          checkInDistanceMeters,
          hash,
          shiftNotes,
        ]
      );
    }

    logAuditEvent({
      userId: workerId,
      userName: workerName || 'NGO Worker',
      userRole: 'NGO_WORKER',
      action: 'WORKER_ATTENDANCE_CHECK_IN',
      entityType: 'ATTENDANCE',
      entityId: attendanceId,
      ipAddress: req.ip || '127.0.0.1',
      details: `Worker ${workerName || workerId} clocked in at ${checkInTime} for duty date ${dutyDate}`,
    });

    const updated = queryOne(`SELECT * FROM worker_attendance WHERE id = ?`, [attendanceId]);
    res.json(mapAttendanceRow(updated));
  } catch (err: any) {
    console.error('Error during attendance check-in:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to record check-in attendance.' });
  }
});

// POST /api/attendance/check-out or /punch-out - Record evening departure check-out with second camera photo
attendanceRouter.post(['/check-out', '/punch-out'], optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const {
      workerId,
      dutyDate = new Date().toISOString().split('T')[0],
      checkOutTime = new Date().toLocaleTimeString('en-IN') + ' IST',
      checkOutPhoto,
      checkOutLat,
      checkOutLng,
      checkOutAddress = 'Field Location, Mumbai',
      checkOutDistanceMeters = 30.0,
      departureNotes = '',
      checkOutHash,
    } = req.body;

    if (!workerId || !checkOutPhoto) {
      res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Worker ID and Departure Photo are required.' });
      return;
    }

    const existing = queryOne(
      `SELECT * FROM worker_attendance WHERE worker_id = ? AND duty_date = ? LIMIT 1`,
      [workerId, dutyDate]
    );

    if (!existing) {
      res.status(404).json({ error: 'NOT_FOUND', message: 'No arrival punch-in record found for today. Please clock in first.' });
      return;
    }

    const hash = checkOutHash || 'SHA256:' + crypto.createHash('sha256').update(`${workerId}-${dutyDate}-${checkOutTime}`).digest('hex');

    // Calculate approximate hours worked
    let hoursWorked = 8.0;
    try {
      if (existing.created_at) {
        const checkInDate = new Date(existing.created_at);
        const now = new Date();
        const diffMs = now.getTime() - checkInDate.getTime();
        hoursWorked = Math.max(0.5, Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100);
      }
    } catch {
      hoursWorked = 8.25;
    }

    const finalStatus = hoursWorked >= 7 ? 'PRESENT' : hoursWorked >= 4 ? 'HALF_DAY' : 'IN_PROGRESS';

    execute(
      `UPDATE worker_attendance SET
        check_out_time = ?,
        check_out_photo = ?,
        check_out_lat = ?,
        check_out_lng = ?,
        check_out_address = ?,
        check_out_distance_meters = ?,
        check_out_hash = ?,
        departure_notes = ?,
        hours_worked = ?,
        status = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        checkOutTime,
        checkOutPhoto,
        checkOutLat || null,
        checkOutLng || null,
        checkOutAddress,
        checkOutDistanceMeters,
        hash,
        departureNotes,
        hoursWorked,
        finalStatus,
        existing.id,
      ]
    );

    logAuditEvent({
      userId: workerId,
      userName: existing.worker_name,
      userRole: 'NGO_WORKER',
      action: 'WORKER_ATTENDANCE_CHECK_OUT',
      entityType: 'ATTENDANCE',
      entityId: existing.id,
      ipAddress: req.ip || '127.0.0.1',
      details: `Worker ${existing.worker_name} clocked out at ${checkOutTime}. Shift duration: ${hoursWorked} hrs.`,
    });

    const updated = queryOne(`SELECT * FROM worker_attendance WHERE id = ?`, [existing.id]);
    res.json(mapAttendanceRow(updated));
  } catch (err: any) {
    console.error('Error during attendance check-out:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to record check-out attendance.' });
  }
});

// GET /api/attendance/stats/:workerId - Aggregate statistics
attendanceRouter.get('/stats/:workerId', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { workerId } = req.params;

    const rows = query(
      `SELECT status, hours_worked FROM worker_attendance WHERE worker_id = ?`,
      [workerId]
    );

    const totalDays = rows.length;
    const presentDays = rows.filter((r) => r.status === 'PRESENT' || r.status === 'OVERTIME').length;
    const halfDays = rows.filter((r) => r.status === 'HALF_DAY').length;
    const totalHours = rows.reduce((acc, r) => acc + (r.hours_worked || 0), 0);
    const avgHours = totalDays > 0 ? Math.round((totalHours / totalDays) * 10) / 10 : 8.0;

    res.json({
      totalDays,
      presentDays,
      halfDays,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours,
      complianceRate: totalDays > 0 ? Math.round(((presentDays + halfDays * 0.5) / totalDays) * 100) : 100,
    });
  } catch (err: any) {
    console.error('Error calculating attendance stats:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to compute attendance metrics.' });
  }
});

// PATCH /api/attendance/:id/verify - Supervisor verification
attendanceRouter.patch('/:id/verify', optionalAuth, (req: AuthRequest, res: Response): void => {
  try {
    const { id } = req.params;
    const { approvalStatus = 'VERIFIED', remarks = 'Verified by Executive Trustee' } = req.body;

    execute(
      `UPDATE worker_attendance SET supervisor_verification = ?, supervisor_remarks = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [approvalStatus, remarks, id]
    );

    const updated = queryOne(`SELECT * FROM worker_attendance WHERE id = ?`, [id]);
    res.json(mapAttendanceRow(updated));
  } catch (err: any) {
    console.error('Error verifying attendance:', err);
    res.status(500).json({ error: 'DB_ERROR', message: 'Failed to update verification status.' });
  }
});
